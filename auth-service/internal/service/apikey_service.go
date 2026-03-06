package service

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/lib/pq"
	"github.com/urlshortener/auth-service/internal/model"
)

var (
	ErrAPIKeyNotFound = errors.New("API key not found")
)

// APIKeyService manages API keys.
type APIKeyService struct {
	db *sql.DB
}

// NewAPIKeyService creates a new APIKeyService.
func NewAPIKeyService(db *sql.DB) *APIKeyService {
	return &APIKeyService{db: db}
}

// CreateAPIKeyInput contains the data needed to create an API key.
type CreateAPIKeyInput struct {
	Name   string   `json:"name" binding:"required"`
	Scopes []string `json:"scopes"`
}

// CreateAPIKeyResult is returned when a key is created (includes the raw key, shown only once).
type CreateAPIKeyResult struct {
	APIKey model.APIKey `json:"apiKey"`
	RawKey string       `json:"rawKey"`
}

// Create generates a new API key for a user.
func (s *APIKeyService) Create(userID int64, input CreateAPIKeyInput) (*CreateAPIKeyResult, error) {
	// Generate random key
	rawKey, err := generateAPIKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate API key: %w", err)
	}

	prefix := rawKey[:8]
	keyHash := hashAPIKey(rawKey)

	if input.Scopes == nil {
		input.Scopes = []string{"read", "write"}
	}

	var apiKey model.APIKey
	err = s.db.QueryRow(`
		INSERT INTO api_keys (user_id, name, key_hash, prefix, scopes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, name, key_hash, prefix, scopes, is_active, last_used, created_at
	`, userID, input.Name, keyHash, prefix, pq.Array(input.Scopes)).Scan(
		&apiKey.ID, &apiKey.UserID, &apiKey.Name, &apiKey.KeyHash,
		&apiKey.Prefix, pq.Array(&apiKey.Scopes), &apiKey.IsActive,
		&apiKey.LastUsed, &apiKey.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create API key: %w", err)
	}

	return &CreateAPIKeyResult{
		APIKey: apiKey,
		RawKey: "snply_" + rawKey,
	}, nil
}

// List returns all API keys for a user (without the raw key).
func (s *APIKeyService) List(userID int64) ([]model.APIKey, error) {
	rows, err := s.db.Query(`
		SELECT id, user_id, name, key_hash, prefix, scopes, is_active, last_used, created_at
		FROM api_keys WHERE user_id = $1 AND is_active = TRUE
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list API keys: %w", err)
	}
	defer rows.Close()

	var keys []model.APIKey
	for rows.Next() {
		var k model.APIKey
		if err := rows.Scan(
			&k.ID, &k.UserID, &k.Name, &k.KeyHash,
			&k.Prefix, pq.Array(&k.Scopes), &k.IsActive,
			&k.LastUsed, &k.CreatedAt,
		); err != nil {
			continue
		}
		keys = append(keys, k)
	}

	return keys, nil
}

// Revoke deactivates an API key.
func (s *APIKeyService) Revoke(userID, keyID int64) error {
	result, err := s.db.Exec(`
		UPDATE api_keys SET is_active = FALSE WHERE id = $1 AND user_id = $2
	`, keyID, userID)
	if err != nil {
		return fmt.Errorf("failed to revoke API key: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return ErrAPIKeyNotFound
	}
	return nil
}

// ValidateAPIKey checks if an API key is valid and returns the associated user ID.
func (s *APIKeyService) ValidateAPIKey(rawKey string) (int64, error) {
	// Strip prefix
	key := rawKey
	if len(rawKey) > 6 && rawKey[:6] == "snply_" {
		key = rawKey[6:]
	}

	keyHash := hashAPIKey(key)

	var userID int64
	var isActive bool
	err := s.db.QueryRow(`
		SELECT user_id, is_active FROM api_keys WHERE key_hash = $1
	`, keyHash).Scan(&userID, &isActive)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrAPIKeyNotFound
		}
		return 0, err
	}

	if !isActive {
		return 0, ErrAPIKeyNotFound
	}

	// Update last used
	s.db.Exec("UPDATE api_keys SET last_used = $1 WHERE key_hash = $2", time.Now(), keyHash)

	return userID, nil
}

func generateAPIKey() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func hashAPIKey(key string) string {
	h := sha256.Sum256([]byte(key))
	return hex.EncodeToString(h[:])
}
