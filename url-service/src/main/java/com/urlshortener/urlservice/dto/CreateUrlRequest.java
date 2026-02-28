package com.urlshortener.urlservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUrlRequest {

    @NotBlank(message = "longUrl is required")
    @URL(message = "Must be a valid URL")
    @Size(max = 2048, message = "URL must not exceed 2048 characters")
    private String longUrl;

    @Size(min = 3, max = 10, message = "Custom alias must be 3-10 characters")
    private String customAlias;

    private LocalDateTime expiryDate;
}
