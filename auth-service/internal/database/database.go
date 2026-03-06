package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
	"github.com/urlshortener/auth-service/internal/config"
)

// Connect establishes a connection to PostgreSQL.
func Connect(cfg *config.Config) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Connected to PostgreSQL")
	return db, nil
}

// Migrate creates the necessary tables if they don't exist.
func Migrate(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id            BIGSERIAL    PRIMARY KEY,
			email         VARCHAR(255) NOT NULL UNIQUE,
			password_hash VARCHAR(255),
			name          VARCHAR(255) NOT NULL DEFAULT '',
			avatar_url    TEXT         DEFAULT '',
			provider      VARCHAR(50)  NOT NULL DEFAULT 'local',
			provider_id   VARCHAR(255) DEFAULT '',
			plan          VARCHAR(50)  NOT NULL DEFAULT 'free',
			is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
			created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
			updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`,
		`CREATE INDEX IF NOT EXISTS idx_users_provider ON users (provider, provider_id)`,

		`CREATE TABLE IF NOT EXISTS refresh_tokens (
			id         BIGSERIAL    PRIMARY KEY,
			user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token_hash VARCHAR(255) NOT NULL UNIQUE,
			expires_at TIMESTAMP    NOT NULL,
			created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
			revoked    BOOLEAN      NOT NULL DEFAULT FALSE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash)`,

		`CREATE TABLE IF NOT EXISTS api_keys (
			id         BIGSERIAL    PRIMARY KEY,
			user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name       VARCHAR(255) NOT NULL,
			key_hash   VARCHAR(255) NOT NULL UNIQUE,
			prefix     VARCHAR(10)  NOT NULL,
			scopes     TEXT[]       DEFAULT '{}',
			is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
			last_used  TIMESTAMP,
			created_at TIMESTAMP    NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys (user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash)`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return fmt.Errorf("migration failed: %w\nQuery: %s", err, q)
		}
	}

	log.Println("Database migrations completed")
	return nil
}
