package com.urlshortener.urlservice.service;

import java.security.SecureRandom;

/**
 * Generates cryptographically random, URL-safe short codes.
 *
 * Uses a 62-character alphabet (0-9, a-z, A-Z) and {@link SecureRandom}.
 * A 7-character code yields 62^7 ≈ 3.5 trillion combinations — effectively
 * collision-free for any practical workload.
 */
public class ShortCodeGenerator {

    private static final String ALPHABET =
            "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    private ShortCodeGenerator() {}

    /**
     * Generate a random short code of the given length.
     *
     * @param length desired code length (typically 7)
     * @return a random alphanumeric string
     */
    public static String generate(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
