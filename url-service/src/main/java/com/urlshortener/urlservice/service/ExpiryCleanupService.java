package com.urlshortener.urlservice.service;

import com.urlshortener.urlservice.repository.UrlRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Background job that deactivates expired URLs.
 * Runs every 5 minutes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExpiryCleanupService {

    private final UrlRepository urlRepository;

    @Scheduled(fixedRate = 300_000) // every 5 min
    @Transactional
    public void cleanupExpiredUrls() {
        int count = urlRepository.deactivateExpiredUrls(LocalDateTime.now());
        if (count > 0) {
            log.info("Deactivated {} expired URL(s)", count);
        }
    }
}
