-- This script runs on first startup of the PostgreSQL container.
-- It creates the schema used by url-service, redirect-service, and auth-service.

CREATE TABLE IF NOT EXISTS urls (
    id              BIGSERIAL       PRIMARY KEY,
    short_code      VARCHAR(10)     NOT NULL UNIQUE,
    long_url        TEXT            NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    expiry_at       TIMESTAMP,
    user_id         BIGINT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_urls_short_code  ON urls (short_code);
CREATE INDEX idx_urls_user_id     ON urls (user_id);
CREATE INDEX idx_urls_expiry_at   ON urls (expiry_at);

-- Auth service tables

CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL       PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    name            VARCHAR(255),
    avatar_url      TEXT,
    provider        VARCHAR(50)     NOT NULL DEFAULT 'local',
    provider_id     VARCHAR(255),
    plan            VARCHAR(50)     NOT NULL DEFAULT 'free',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email       ON users (email);
CREATE INDEX idx_users_provider    ON users (provider, provider_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255)    NOT NULL,
    expires_at      TIMESTAMP       NOT NULL,
    revoked         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash    ON refresh_tokens (token_hash);

CREATE TABLE IF NOT EXISTS api_keys (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255)    NOT NULL,
    key_hash        VARCHAR(255)    NOT NULL,
    prefix          VARCHAR(20)     NOT NULL,
    scopes          TEXT            NOT NULL DEFAULT 'read,write',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_used_at    TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user     ON api_keys (user_id);
CREATE INDEX idx_api_keys_hash     ON api_keys (key_hash);
CREATE INDEX idx_api_keys_prefix   ON api_keys (prefix);
