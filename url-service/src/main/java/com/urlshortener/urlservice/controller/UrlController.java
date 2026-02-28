package com.urlshortener.urlservice.controller;

import com.urlshortener.urlservice.dto.CreateUrlRequest;
import com.urlshortener.urlservice.dto.CreateUrlResponse;
import com.urlshortener.urlservice.service.UrlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/urls")
@RequiredArgsConstructor
public class UrlController {

    private final UrlService urlService;

    /**
     * POST /api/v1/urls
     * Create a new short URL.
     */
    @PostMapping
    public ResponseEntity<CreateUrlResponse> createUrl(@Valid @RequestBody CreateUrlRequest request) {
        CreateUrlResponse response = urlService.createShortUrl(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/v1/urls/{shortCode}
     * Get URL info (not redirect – useful for admin/debug).
     */
    @GetMapping("/{shortCode}")
    public ResponseEntity<CreateUrlResponse> getUrlInfo(@PathVariable String shortCode) {
        CreateUrlResponse response = urlService.getUrlInfo(shortCode);
        return ResponseEntity.ok(response);
    }

    /**
     * Health check for the service.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("URL Service is up");
    }
}
