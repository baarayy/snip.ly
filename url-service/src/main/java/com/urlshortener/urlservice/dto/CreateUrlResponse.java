package com.urlshortener.urlservice.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUrlResponse {

    private String shortUrl;
    private String shortCode;
    private String longUrl;
    private LocalDateTime expiryDate;
    private LocalDateTime createdAt;
}
