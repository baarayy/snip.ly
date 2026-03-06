package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/urlshortener/auth-service/internal/service"
)

// OAuthHandler handles OAuth 2.0 endpoints.
type OAuthHandler struct {
	oauthService *service.OAuthService
}

// NewOAuthHandler creates a new OAuthHandler.
func NewOAuthHandler(oauthService *service.OAuthService) *OAuthHandler {
	return &OAuthHandler{oauthService: oauthService}
}

// GoogleLogin handles GET /api/v1/auth/oauth/google
func (h *OAuthHandler) GoogleLogin(c *gin.Context) {
	state := uuid.New().String()
	// In production, store state in Redis for CSRF protection
	url := h.oauthService.GoogleAuthURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback handles GET /api/v1/auth/oauth/google/callback
func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
		return
	}

	redirectURL, err := h.oauthService.GoogleCallback(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuth authentication failed: " + err.Error()})
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// GitHubLogin handles GET /api/v1/auth/oauth/github
func (h *OAuthHandler) GitHubLogin(c *gin.Context) {
	state := uuid.New().String()
	url := h.oauthService.GitHubAuthURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GitHubCallback handles GET /api/v1/auth/oauth/github/callback
func (h *OAuthHandler) GitHubCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
		return
	}

	redirectURL, err := h.oauthService.GitHubCallback(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuth authentication failed: " + err.Error()})
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}
