package com.urlshortener.urlservice.controller;

import com.urlshortener.urlservice.dto.CreateUrlRequest;
import com.urlshortener.urlservice.dto.CreateUrlResponse;
import com.urlshortener.urlservice.exception.AliasConflictException;
import com.urlshortener.urlservice.exception.GlobalExceptionHandler;
import com.urlshortener.urlservice.exception.UrlNotFoundException;
import com.urlshortener.urlservice.service.UrlService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UrlControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UrlService urlService;

    @InjectMocks
    private UrlController urlController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(urlController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ── POST /api/v1/urls ──────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/urls – 201 Created")
    void createUrl_returns201() throws Exception {
        CreateUrlResponse response = CreateUrlResponse.builder()
                .shortCode("abc1234")
                .shortUrl("http://localhost:8080/abc1234")
                .longUrl("https://example.com")
                .createdAt(LocalDateTime.now())
                .build();

        when(urlService.createShortUrl(any(CreateUrlRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/urls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"longUrl\":\"https://example.com\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shortCode").value("abc1234"))
                .andExpect(jsonPath("$.longUrl").value("https://example.com"));
    }

    @Test
    @DisplayName("POST /api/v1/urls – missing longUrl – 400")
    void createUrl_missingLongUrl_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/urls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/urls – alias conflict – 409")
    void createUrl_aliasConflict_returns409() throws Exception {
        when(urlService.createShortUrl(any(CreateUrlRequest.class)))
                .thenThrow(new AliasConflictException("Alias 'taken' is already taken"));

        mockMvc.perform(post("/api/v1/urls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"longUrl\":\"https://example.com\",\"customAlias\":\"taken\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Alias 'taken' is already taken"));
    }

    // ── GET /api/v1/urls/{shortCode} ──────────────────────

    @Test
    @DisplayName("GET /api/v1/urls/{shortCode} – 200 OK")
    void getUrlInfo_returns200() throws Exception {
        CreateUrlResponse response = CreateUrlResponse.builder()
                .shortCode("abc1234")
                .shortUrl("http://localhost:8080/abc1234")
                .longUrl("https://example.com")
                .createdAt(LocalDateTime.now())
                .build();

        when(urlService.getUrlInfo(eq("abc1234"))).thenReturn(response);

        mockMvc.perform(get("/api/v1/urls/abc1234"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortCode").value("abc1234"))
                .andExpect(jsonPath("$.longUrl").value("https://example.com"));
    }

    @Test
    @DisplayName("GET /api/v1/urls/{shortCode} – not found – 404")
    void getUrlInfo_notFound_returns404() throws Exception {
        when(urlService.getUrlInfo(eq("unknown")))
                .thenThrow(new UrlNotFoundException("Short code not found: unknown"));

        mockMvc.perform(get("/api/v1/urls/unknown"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Short code not found: unknown"));
    }

    // ── GET /api/v1/urls/health ───────────────────────────

    @Test
    @DisplayName("GET /api/v1/urls/health – 200 OK")
    void health_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/urls/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("URL Service is up"));
    }
}
