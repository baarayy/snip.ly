package com.urlshortener.urlservice.service;

import com.urlshortener.urlservice.dto.CreateUrlRequest;
import com.urlshortener.urlservice.dto.CreateUrlResponse;
import com.urlshortener.urlservice.entity.Url;
import com.urlshortener.urlservice.exception.AliasConflictException;
import com.urlshortener.urlservice.exception.UrlNotFoundException;
import com.urlshortener.urlservice.repository.UrlRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class UrlService {

    private final UrlRepository urlRepository;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.short-code-length:7}")
    private int shortCodeLength;

    private static final int MAX_COLLISION_RETRIES = 10;

    /**
     * Create a new short URL.
     *
     * Strategy:
     *   1. If a custom alias is provided → validate uniqueness, save.
     *   2. Otherwise → generate a random alphanumeric short code (retry on collision).
     *   3. Push the mapping into Redis cache.
     */
    @Transactional
    public CreateUrlResponse createShortUrl(CreateUrlRequest request) {
        String shortCode;

        if (request.getCustomAlias() != null && !request.getCustomAlias().isBlank()) {
            shortCode = request.getCustomAlias();

            if (urlRepository.existsByShortCode(shortCode)) {
                throw new AliasConflictException("Alias '" + shortCode + "' is already taken");
            }

            Url url = Url.builder()
                    .shortCode(shortCode)
                    .longUrl(request.getLongUrl())
                    .expiryAt(request.getExpiryDate())
                    .isActive(true)
                    .build();
            url = urlRepository.save(url);

            cacheUrl(url);
            return toResponse(url);

        } else {
            // Generate a random short code, retrying on the rare collision
            for (int attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
                shortCode = ShortCodeGenerator.generate(shortCodeLength);
                if (!urlRepository.existsByShortCode(shortCode)) {
                    Url url = Url.builder()
                            .shortCode(shortCode)
                            .longUrl(request.getLongUrl())
                            .expiryAt(request.getExpiryDate())
                            .isActive(true)
                            .build();
                    url = urlRepository.save(url);
                    cacheUrl(url);
                    return toResponse(url);
                }
                log.warn("Short code collision on attempt {} — retrying", attempt + 1);
            }
            throw new RuntimeException("Failed to generate unique short code after "
                    + MAX_COLLISION_RETRIES + " attempts");
        }
    }

    /**
     * Look up a URL by short code (used for info / admin, not redirect).
     */
    @Transactional(readOnly = true)
    public CreateUrlResponse getUrlInfo(String shortCode) {
        Url url = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new UrlNotFoundException("Short code not found: " + shortCode));
        return toResponse(url);
    }

    // ── Helpers ─────────────────────────────────────────────

    private void cacheUrl(Url url) {
        try {
            String key = "url:" + url.getShortCode();
            redisTemplate.opsForValue().set(key, url.getLongUrl());

            // If there's an expiry, set TTL on the cache key
            if (url.getExpiryAt() != null) {
                Duration ttl = Duration.between(java.time.LocalDateTime.now(), url.getExpiryAt());
                if (!ttl.isNegative()) {
                    redisTemplate.expire(key, ttl.getSeconds(), TimeUnit.SECONDS);
                }
            }
            log.info("Cached URL mapping: {} -> {}", url.getShortCode(), url.getLongUrl());
        } catch (Exception e) {
            log.warn("Failed to cache URL mapping – Redis may be unavailable", e);
        }
    }

    private CreateUrlResponse toResponse(Url url) {
        return CreateUrlResponse.builder()
                .shortUrl(baseUrl + "/" + url.getShortCode())
                .shortCode(url.getShortCode())
                .longUrl(url.getLongUrl())
                .expiryDate(url.getExpiryAt())
                .createdAt(url.getCreatedAt())
                .build();
    }
}
