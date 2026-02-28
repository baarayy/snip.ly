package com.urlshortener.urlservice.service;

import com.urlshortener.urlservice.dto.CreateUrlRequest;
import com.urlshortener.urlservice.dto.CreateUrlResponse;
import com.urlshortener.urlservice.entity.Url;
import com.urlshortener.urlservice.exception.AliasConflictException;
import com.urlshortener.urlservice.exception.UrlNotFoundException;
import com.urlshortener.urlservice.repository.UrlRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlServiceTest {

    @Mock
    private UrlRepository urlRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    @InjectMocks
    private UrlService urlService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(urlService, "baseUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(urlService, "shortCodeLength", 7);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    @DisplayName("createShortUrl – random code – saves and caches")
    void createShortUrl_randomCode_success() {
        CreateUrlRequest request = new CreateUrlRequest();
        request.setLongUrl("https://example.com");

        when(urlRepository.existsByShortCode(anyString())).thenReturn(false);
        when(urlRepository.save(any(Url.class))).thenAnswer(invocation -> {
            Url url = invocation.getArgument(0);
            url.setId(1L);
            url.setCreatedAt(LocalDateTime.now());
            return url;
        });

        CreateUrlResponse response = urlService.createShortUrl(request);

        assertThat(response.getShortCode()).hasSize(7);
        assertThat(response.getShortUrl()).startsWith("http://localhost:8080/");
        assertThat(response.getLongUrl()).isEqualTo("https://example.com");
        verify(urlRepository).save(any(Url.class));
        verify(valueOps).set(startsWith("url:"), eq("https://example.com"));
    }

    @Test
    @DisplayName("createShortUrl – custom alias – saves with alias")
    void createShortUrl_customAlias_success() {
        CreateUrlRequest request = new CreateUrlRequest();
        request.setLongUrl("https://example.com");
        request.setCustomAlias("myalias");

        when(urlRepository.existsByShortCode("myalias")).thenReturn(false);
        when(urlRepository.save(any(Url.class))).thenAnswer(invocation -> {
            Url url = invocation.getArgument(0);
            url.setId(1L);
            url.setCreatedAt(LocalDateTime.now());
            return url;
        });

        CreateUrlResponse response = urlService.createShortUrl(request);

        assertThat(response.getShortCode()).isEqualTo("myalias");
        verify(urlRepository).existsByShortCode("myalias");
    }

    @Test
    @DisplayName("createShortUrl – duplicate alias – throws AliasConflictException")
    void createShortUrl_duplicateAlias_throws() {
        CreateUrlRequest request = new CreateUrlRequest();
        request.setLongUrl("https://example.com");
        request.setCustomAlias("taken");

        when(urlRepository.existsByShortCode("taken")).thenReturn(true);

        assertThatThrownBy(() -> urlService.createShortUrl(request))
                .isInstanceOf(AliasConflictException.class)
                .hasMessageContaining("taken");
    }

    @Test
    @DisplayName("createShortUrl – with expiry date – caches with TTL")
    void createShortUrl_withExpiry_cachesWithTTL() {
        CreateUrlRequest request = new CreateUrlRequest();
        request.setLongUrl("https://example.com");
        request.setExpiryDate(LocalDateTime.now().plusHours(1));

        when(urlRepository.existsByShortCode(anyString())).thenReturn(false);
        when(urlRepository.save(any(Url.class))).thenAnswer(invocation -> {
            Url url = invocation.getArgument(0);
            url.setId(1L);
            url.setCreatedAt(LocalDateTime.now());
            return url;
        });

        CreateUrlResponse response = urlService.createShortUrl(request);

        assertThat(response.getExpiryDate()).isNotNull();
        verify(redisTemplate).expire(anyString(), anyLong(), any());
    }

    @Test
    @DisplayName("getUrlInfo – existing code – returns response")
    void getUrlInfo_exists_success() {
        Url url = Url.builder()
                .id(1L)
                .shortCode("abc1234")
                .longUrl("https://example.com")
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();

        when(urlRepository.findByShortCode("abc1234")).thenReturn(Optional.of(url));

        CreateUrlResponse response = urlService.getUrlInfo("abc1234");

        assertThat(response.getShortCode()).isEqualTo("abc1234");
        assertThat(response.getLongUrl()).isEqualTo("https://example.com");
    }

    @Test
    @DisplayName("getUrlInfo – non-existent code – throws UrlNotFoundException")
    void getUrlInfo_notFound_throws() {
        when(urlRepository.findByShortCode("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> urlService.getUrlInfo("unknown"))
                .isInstanceOf(UrlNotFoundException.class);
    }

    @Test
    @DisplayName("createShortUrl – collision retry – retries and succeeds")
    void createShortUrl_collisionRetry_succeeds() {
        CreateUrlRequest request = new CreateUrlRequest();
        request.setLongUrl("https://example.com");

        // First 3 codes collide, 4th succeeds
        when(urlRepository.existsByShortCode(anyString()))
                .thenReturn(true, true, true, false);
        when(urlRepository.save(any(Url.class))).thenAnswer(invocation -> {
            Url url = invocation.getArgument(0);
            url.setId(1L);
            url.setCreatedAt(LocalDateTime.now());
            return url;
        });

        CreateUrlResponse response = urlService.createShortUrl(request);

        assertThat(response).isNotNull();
        verify(urlRepository, times(4)).existsByShortCode(anyString());
    }

    @Test
    @DisplayName("createShortUrl – Redis failure – still saves to DB")
    void createShortUrl_redisFails_stillSaves() {
        CreateUrlRequest request = new CreateUrlRequest();
        request.setLongUrl("https://example.com");

        when(urlRepository.existsByShortCode(anyString())).thenReturn(false);
        when(urlRepository.save(any(Url.class))).thenAnswer(invocation -> {
            Url url = invocation.getArgument(0);
            url.setId(1L);
            url.setCreatedAt(LocalDateTime.now());
            return url;
        });
        doThrow(new RuntimeException("Redis down")).when(valueOps)
                .set(anyString(), anyString());

        // Should not throw — Redis failure is swallowed
        CreateUrlResponse response = urlService.createShortUrl(request);

        assertThat(response).isNotNull();
        verify(urlRepository).save(any(Url.class));
    }
}
