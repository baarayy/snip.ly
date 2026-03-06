package model

import "time"

// User represents a user account.
type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	AvatarURL    string    `json:"avatarUrl"`
	Provider     string    `json:"provider"`
	ProviderID   string    `json:"-"`
	Plan         string    `json:"plan"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// RefreshToken represents a stored refresh token.
type RefreshToken struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"userId"`
	TokenHash string    `json:"-"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
	Revoked   bool      `json:"revoked"`
}

// APIKey represents an API key for programmatic access.
type APIKey struct {
	ID        int64      `json:"id"`
	UserID    int64      `json:"userId"`
	Name      string     `json:"name"`
	KeyHash   string     `json:"-"`
	Prefix    string     `json:"prefix"`
	Scopes    []string   `json:"scopes"`
	IsActive  bool       `json:"isActive"`
	LastUsed  *time.Time `json:"lastUsed"`
	CreatedAt time.Time  `json:"createdAt"`
}

// TokenPair contains the access and refresh tokens returned on login.
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expiresIn"`
	TokenType    string `json:"tokenType"`
}
