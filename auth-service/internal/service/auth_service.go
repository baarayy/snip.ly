package service

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"

	"github.com/urlshortener/auth-service/internal/config"
	"github.com/urlshortener/auth-service/internal/model"
)

var (
	ErrEmailExists      = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound     = errors.New("user not found")
	ErrTokenExpired     = errors.New("token expired")
	ErrTokenRevoked     = errors.New("token has been revoked")
	ErrTokenInvalid     = errors.New("invalid token")
	ErrAccountInactive  = errors.New("account is inactive")
)

// AuthService handles authentication logic.
type AuthService struct {
	db  *sql.DB
	rdb *redis.Client
	cfg *config.Config
}

// NewAuthService creates a new AuthService.
func NewAuthService(db *sql.DB, rdb *redis.Client, cfg *config.Config) *AuthService {
	return &AuthService{db: db, rdb: rdb, cfg: cfg}
}

// RegisterInput contains the data needed for user registration.
type RegisterInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required"`
}

// LoginInput contains the data needed for user login.
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register creates a new user account.
func (s *AuthService) Register(input RegisterInput) (*model.User, *model.TokenPair, error) {
	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to hash password: %w", err)
	}

	var user model.User
	err = s.db.QueryRow(`
		INSERT INTO users (email, password_hash, name, provider)
		VALUES ($1, $2, $3, 'local')
		RETURNING id, email, password_hash, name, avatar_url, provider, provider_id, plan, is_active, created_at, updated_at
	`, input.Email, string(hash), input.Name).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.AvatarURL, &user.Provider, &user.ProviderID,
		&user.Plan, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if pgErr, ok := err.(*pq.Error); ok && pgErr.Code == "23505" {
			return nil, nil, ErrEmailExists
		}
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate token pair
	tokens, err := s.generateTokenPair(&user)
	if err != nil {
		return nil, nil, err
	}

	return &user, tokens, nil
}

// Login authenticates a user and returns tokens.
func (s *AuthService) Login(input LoginInput) (*model.User, *model.TokenPair, error) {
	var user model.User
	err := s.db.QueryRow(`
		SELECT id, email, password_hash, name, avatar_url, provider, provider_id, plan, is_active, created_at, updated_at
		FROM users WHERE email = $1
	`, input.Email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.AvatarURL, &user.Provider, &user.ProviderID,
		&user.Plan, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, ErrInvalidCredentials
		}
		return nil, nil, fmt.Errorf("failed to query user: %w", err)
	}

	if !user.IsActive {
		return nil, nil, ErrAccountInactive
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	tokens, err := s.generateTokenPair(&user)
	if err != nil {
		return nil, nil, err
	}

	return &user, tokens, nil
}

// RefreshToken exchanges a refresh token for a new token pair.
func (s *AuthService) RefreshToken(refreshToken string) (*model.User, *model.TokenPair, error) {
	tokenHash := hashToken(refreshToken)

	var rt model.RefreshToken
	err := s.db.QueryRow(`
		SELECT id, user_id, token_hash, expires_at, created_at, revoked
		FROM refresh_tokens WHERE token_hash = $1
	`, tokenHash).Scan(&rt.ID, &rt.UserID, &rt.TokenHash, &rt.ExpiresAt, &rt.CreatedAt, &rt.Revoked)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, ErrTokenInvalid
		}
		return nil, nil, fmt.Errorf("failed to query refresh token: %w", err)
	}

	if rt.Revoked {
		return nil, nil, ErrTokenRevoked
	}
	if rt.ExpiresAt.Before(time.Now()) {
		return nil, nil, ErrTokenExpired
	}

	// Revoke old token
	s.db.Exec("UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1", rt.ID)

	// Get user
	user, err := s.GetUserByID(rt.UserID)
	if err != nil {
		return nil, nil, err
	}

	tokens, err := s.generateTokenPair(user)
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

// Logout revokes all refresh tokens for a user and blacklists the access token.
func (s *AuthService) Logout(userID int64, accessToken string) error {
	// Revoke all refresh tokens for the user
	_, err := s.db.Exec("UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE", userID)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh tokens: %w", err)
	}

	// Blacklist the access token in Redis
	ctx := context.Background()
	ttl, _ := time.ParseDuration(s.cfg.JWTAccessTokenTTL)
	s.rdb.Set(ctx, "blacklist:"+accessToken, "1", ttl)

	return nil
}

// ValidateAccessToken validates a JWT access token and returns claims.
func (s *AuthService) ValidateAccessToken(tokenString string) (*JWTClaims, error) {
	// Check blacklist
	ctx := context.Background()
	exists, _ := s.rdb.Exists(ctx, "blacklist:"+tokenString).Result()
	if exists > 0 {
		return nil, ErrTokenRevoked
	}

	claims := &JWTClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, ErrTokenInvalid
	}
	if !token.Valid {
		return nil, ErrTokenInvalid
	}

	return claims, nil
}

// GetUserByID fetches a user by their ID.
func (s *AuthService) GetUserByID(id int64) (*model.User, error) {
	var user model.User
	err := s.db.QueryRow(`
		SELECT id, email, password_hash, name, avatar_url, provider, provider_id, plan, is_active, created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.AvatarURL, &user.Provider, &user.ProviderID,
		&user.Plan, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to query user: %w", err)
	}
	return &user, nil
}

// UpdateProfile updates user profile fields.
func (s *AuthService) UpdateProfile(userID int64, name, avatarURL string) (*model.User, error) {
	_, err := s.db.Exec(`
		UPDATE users SET name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3
	`, name, avatarURL, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}
	return s.GetUserByID(userID)
}

// GetUserURLs returns URLs belonging to a user from the urls table.
func (s *AuthService) GetUserURLs(userID int64, page, pageSize int) ([]map[string]interface{}, int, error) {
	var total int
	err := s.db.QueryRow("SELECT COUNT(*) FROM urls WHERE user_id = $1", userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	rows, err := s.db.Query(`
		SELECT id, short_code, long_url, created_at, expiry_at, is_active
		FROM urls WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var urls []map[string]interface{}
	for rows.Next() {
		var id int64
		var shortCode, longURL string
		var createdAt time.Time
		var expiryAt sql.NullTime
		var isActive bool
		if err := rows.Scan(&id, &shortCode, &longURL, &createdAt, &expiryAt, &isActive); err != nil {
			continue
		}
		url := map[string]interface{}{
			"id":        id,
			"shortCode": shortCode,
			"longUrl":   longURL,
			"createdAt": createdAt,
			"isActive":  isActive,
		}
		if expiryAt.Valid {
			url["expiryAt"] = expiryAt.Time
		}
		urls = append(urls, url)
	}

	return urls, total, nil
}

// FindOrCreateOAuthUser finds an existing OAuth user or creates a new one.
func (s *AuthService) FindOrCreateOAuthUser(email, name, avatarURL, provider, providerID string) (*model.User, *model.TokenPair, error) {
	// Try to find existing user by provider
	var user model.User
	err := s.db.QueryRow(`
		SELECT id, email, password_hash, name, avatar_url, provider, provider_id, plan, is_active, created_at, updated_at
		FROM users WHERE provider = $1 AND provider_id = $2
	`, provider, providerID).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.AvatarURL, &user.Provider, &user.ProviderID,
		&user.Plan, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == nil {
		// Existing user found — generate tokens
		tokens, err := s.generateTokenPair(&user)
		if err != nil {
			return nil, nil, err
		}
		return &user, tokens, nil
	}

	if !errors.Is(err, sql.ErrNoRows) {
		return nil, nil, fmt.Errorf("failed to query user: %w", err)
	}

	// Try to find by email (might have registered via local)
	err = s.db.QueryRow(`
		SELECT id, email, password_hash, name, avatar_url, provider, provider_id, plan, is_active, created_at, updated_at
		FROM users WHERE email = $1
	`, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.AvatarURL, &user.Provider, &user.ProviderID,
		&user.Plan, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == nil {
		// Link OAuth provider to existing account
		s.db.Exec("UPDATE users SET provider = $1, provider_id = $2, avatar_url = $3, updated_at = NOW() WHERE id = $4",
			provider, providerID, avatarURL, user.ID)
		user.Provider = provider
		user.ProviderID = providerID
		user.AvatarURL = avatarURL

		tokens, err := s.generateTokenPair(&user)
		if err != nil {
			return nil, nil, err
		}
		return &user, tokens, nil
	}

	// Create new user
	err = s.db.QueryRow(`
		INSERT INTO users (email, name, avatar_url, provider, provider_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, email, password_hash, name, avatar_url, provider, provider_id, plan, is_active, created_at, updated_at
	`, email, name, avatarURL, provider, providerID).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.AvatarURL, &user.Provider, &user.ProviderID,
		&user.Plan, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create OAuth user: %w", err)
	}

	tokens, err := s.generateTokenPair(&user)
	if err != nil {
		return nil, nil, err
	}

	return &user, tokens, nil
}

// ─── Internal helpers ───────────────────────────────────

// JWTClaims are the claims embedded in the access token.
type JWTClaims struct {
	UserID int64  `json:"userId"`
	Email  string `json:"email"`
	Plan   string `json:"plan"`
	jwt.RegisteredClaims
}

func (s *AuthService) generateTokenPair(user *model.User) (*model.TokenPair, error) {
	accessTTL, err := time.ParseDuration(s.cfg.JWTAccessTokenTTL)
	if err != nil {
		accessTTL = 15 * time.Minute
	}
	refreshTTL, err := time.ParseDuration(s.cfg.JWTRefreshTokenTTL)
	if err != nil {
		refreshTTL = 7 * 24 * time.Hour
	}

	// Generate access token
	now := time.Now()
	accessClaims := JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		Plan:   user.Plan,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(accessTTL)),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   fmt.Sprintf("%d", user.ID),
			Issuer:    "snip.ly-auth",
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessString, err := accessToken.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	// Generate refresh token (opaque UUID)
	refreshString := uuid.New().String()
	refreshHash := hashToken(refreshString)

	// Store refresh token in DB
	_, err = s.db.Exec(`
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, user.ID, refreshHash, now.Add(refreshTTL))
	if err != nil {
		log.Printf("Warning: Failed to store refresh token: %v", err)
	}

	return &model.TokenPair{
		AccessToken:  accessString,
		RefreshToken: refreshString,
		ExpiresIn:    int64(accessTTL.Seconds()),
		TokenType:    "Bearer",
	}, nil
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
