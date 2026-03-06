package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/urlshortener/auth-service/internal/model"
	"github.com/urlshortener/auth-service/internal/service"
)

// APIKeyHandler handles API key management endpoints.
type APIKeyHandler struct {
	apiKeyService *service.APIKeyService
}

// NewAPIKeyHandler creates a new APIKeyHandler.
func NewAPIKeyHandler(apiKeyService *service.APIKeyService) *APIKeyHandler {
	return &APIKeyHandler{apiKeyService: apiKeyService}
}

// CreateAPIKey handles POST /api/v1/api-keys
func (h *APIKeyHandler) CreateAPIKey(c *gin.Context) {
	userID := c.MustGet("userID").(int64)

	var input service.CreateAPIKeyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.apiKeyService.Create(userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create API key"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"apiKey": result.APIKey,
		"rawKey": result.RawKey,
		"note":   "Save this key — it will not be shown again.",
	})
}

// ListAPIKeys handles GET /api/v1/api-keys
func (h *APIKeyHandler) ListAPIKeys(c *gin.Context) {
	userID := c.MustGet("userID").(int64)

	keys, err := h.apiKeyService.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list API keys"})
		return
	}

	if keys == nil {
		keys = []model.APIKey{}
	}

	c.JSON(http.StatusOK, gin.H{"apiKeys": keys})
}

// RevokeAPIKey handles DELETE /api/v1/api-keys/:id
func (h *APIKeyHandler) RevokeAPIKey(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	keyID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid key ID"})
		return
	}

	if err := h.apiKeyService.Revoke(userID, keyID); err != nil {
		if errors.Is(err, service.ErrAPIKeyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "API key not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revoke API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key revoked"})
}
