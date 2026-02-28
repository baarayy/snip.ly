package com.urlshortener.urlservice.repository;

import com.urlshortener.urlservice.entity.Url;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UrlRepository extends JpaRepository<Url, Long> {

    Optional<Url> findByShortCode(String shortCode);

    boolean existsByShortCode(String shortCode);

    @Query("SELECT u FROM Url u WHERE u.expiryAt IS NOT NULL AND u.expiryAt < :now AND u.isActive = true")
    List<Url> findExpiredUrls(LocalDateTime now);

    @Modifying
    @Query("UPDATE Url u SET u.isActive = false WHERE u.expiryAt IS NOT NULL AND u.expiryAt < :now AND u.isActive = true")
    int deactivateExpiredUrls(LocalDateTime now);
}
