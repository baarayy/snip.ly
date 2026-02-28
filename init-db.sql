-- This script runs on first startup of the PostgreSQL container.
-- It creates the schema used by url-service and redirect-service.

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
