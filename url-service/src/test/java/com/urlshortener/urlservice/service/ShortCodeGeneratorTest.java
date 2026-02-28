package com.urlshortener.urlservice.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.RepeatedTest;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ShortCodeGeneratorTest {

    @Test
    @DisplayName("generate() produces code of requested length")
    void generateReturnsCorrectLength() {
        for (int len = 1; len <= 12; len++) {
            String code = ShortCodeGenerator.generate(len);
            assertThat(code).hasSize(len);
        }
    }

    @Test
    @DisplayName("generate() produces only alphanumeric characters")
    void generateReturnsAlphanumericOnly() {
        for (int i = 0; i < 100; i++) {
            String code = ShortCodeGenerator.generate(7);
            assertThat(code).matches("^[a-zA-Z0-9]+$");
        }
    }

    @RepeatedTest(5)
    @DisplayName("generate() produces unique codes (low collision rate)")
    void generateProducesUniqueCodes() {
        Set<String> codes = new HashSet<>();
        int count = 1000;
        for (int i = 0; i < count; i++) {
            codes.add(ShortCodeGenerator.generate(7));
        }
        // With 62^7 ≈ 3.5 trillion possibilities, 1000 codes should all be unique
        assertThat(codes).hasSize(count);
    }

    @Test
    @DisplayName("generate() with length 0 returns empty string")
    void generateZeroLength() {
        String code = ShortCodeGenerator.generate(0);
        assertThat(code).isEmpty();
    }
}
