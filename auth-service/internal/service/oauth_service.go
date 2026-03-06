package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/redis/go-redis/v9"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	googleOAuth "golang.org/x/oauth2/google"

	"github.com/urlshortener/auth-service/internal/config"
)

// OAuthService handles OAuth 2.0 authentication flows.
type OAuthService struct {
	db           *sql.DB
	rdb          *redis.Client
	cfg          *config.Config
	authService  *AuthService
	googleConfig *oauth2.Config
	githubConfig *oauth2.Config
}

// NewOAuthService creates a new OAuthService.
func NewOAuthService(db *sql.DB, rdb *redis.Client, cfg *config.Config) *OAuthService {
	svc := &OAuthService{
		db:  db,
		rdb: rdb,
		cfg: cfg,
		authService: &AuthService{db: db, rdb: rdb, cfg: cfg},
	}

	// Google OAuth config
	svc.googleConfig = &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     googleOAuth.Endpoint,
	}

	// GitHub OAuth config
	svc.githubConfig = &oauth2.Config{
		ClientID:     cfg.GitHubClientID,
		ClientSecret: cfg.GitHubClientSecret,
		RedirectURL:  cfg.GitHubRedirectURL,
		Scopes:       []string{"user:email", "read:user"},
		Endpoint:     github.Endpoint,
	}

	return svc
}

// GoogleAuthURL returns the Google OAuth authorization URL.
func (s *OAuthService) GoogleAuthURL(state string) string {
	return s.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// GitHubAuthURL returns the GitHub OAuth authorization URL.
func (s *OAuthService) GitHubAuthURL(state string) string {
	return s.githubConfig.AuthCodeURL(state)
}

// GoogleCallback handles the Google OAuth callback.
func (s *OAuthService) GoogleCallback(ctx context.Context, code string) (string, error) {
	token, err := s.googleConfig.Exchange(ctx, code)
	if err != nil {
		return "", fmt.Errorf("failed to exchange code: %w", err)
	}

	// Get user info
	client := s.googleConfig.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return "", fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var info struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.Unmarshal(body, &info); err != nil {
		return "", fmt.Errorf("failed to parse user info: %w", err)
	}

	_, tokens, err := s.authService.FindOrCreateOAuthUser(info.Email, info.Name, info.Picture, "google", info.ID)
	if err != nil {
		return "", err
	}

	// Return a redirect URL with tokens encoded
	redirectURL := fmt.Sprintf("%s/auth/callback?accessToken=%s&refreshToken=%s",
		s.cfg.FrontendURL, tokens.AccessToken, tokens.RefreshToken)

	return redirectURL, nil
}

// GitHubCallback handles the GitHub OAuth callback.
func (s *OAuthService) GitHubCallback(ctx context.Context, code string) (string, error) {
	token, err := s.githubConfig.Exchange(ctx, code)
	if err != nil {
		return "", fmt.Errorf("failed to exchange code: %w", err)
	}

	// Get user info
	client := s.githubConfig.Client(ctx, token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return "", fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var info struct {
		ID        int    `json:"id"`
		Login     string `json:"login"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := json.Unmarshal(body, &info); err != nil {
		return "", fmt.Errorf("failed to parse user info: %w", err)
	}

	// If email is private, fetch from emails endpoint
	email := info.Email
	if email == "" {
		email, _ = s.fetchGitHubEmail(client)
	}
	if email == "" {
		return "", fmt.Errorf("could not get email from GitHub")
	}

	name := info.Name
	if name == "" {
		name = info.Login
	}

	providerID := fmt.Sprintf("%d", info.ID)
	_, tokens, err := s.authService.FindOrCreateOAuthUser(email, name, info.AvatarURL, "github", providerID)
	if err != nil {
		return "", err
	}

	redirectURL := fmt.Sprintf("%s/auth/callback?accessToken=%s&refreshToken=%s",
		s.cfg.FrontendURL, tokens.AccessToken, tokens.RefreshToken)

	return redirectURL, nil
}

func (s *OAuthService) fetchGitHubEmail(client *http.Client) (string, error) {
	resp, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err := json.Unmarshal(body, &emails); err != nil {
		return "", err
	}

	for _, e := range emails {
		if e.Primary && e.Verified {
			return e.Email, nil
		}
	}
	if len(emails) > 0 {
		return emails[0].Email, nil
	}

	return "", fmt.Errorf("no email found")
}
