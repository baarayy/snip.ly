package main

import (
	"log"

	"github.com/urlshortener/auth-service/internal/config"
	"github.com/urlshortener/auth-service/internal/database"
	"github.com/urlshortener/auth-service/internal/middleware"
	"github.com/urlshortener/auth-service/internal/handler"
	redisclient "github.com/urlshortener/auth-service/internal/redis"
	"github.com/urlshortener/auth-service/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	// Connect to PostgreSQL
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Connect to Redis
	rdb := redisclient.Connect(cfg)

	// Initialize services
	authService := service.NewAuthService(db, rdb, cfg)
	apiKeyService := service.NewAPIKeyService(db)
	oauthService := service.NewOAuthService(db, rdb, cfg)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	apiKeyHandler := handler.NewAPIKeyHandler(apiKeyService)
	oauthHandler := handler.NewOAuthHandler(oauthService)

	// Setup router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.Default()

	// CORS middleware
	router.Use(middleware.CORS())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "auth-service"})
	})

	// Public auth routes
	v1 := router.Group("/api/v1/auth")
	{
		v1.POST("/register", authHandler.Register)
		v1.POST("/login", authHandler.Login)
		v1.POST("/refresh", authHandler.RefreshToken)
		v1.POST("/logout", authHandler.Logout)

		// OAuth routes
		v1.GET("/oauth/google", oauthHandler.GoogleLogin)
		v1.GET("/oauth/google/callback", oauthHandler.GoogleCallback)
		v1.GET("/oauth/github", oauthHandler.GitHubLogin)
		v1.GET("/oauth/github/callback", oauthHandler.GitHubCallback)
	}

	// Protected routes (require valid JWT)
	protected := router.Group("/api/v1")
	protected.Use(middleware.AuthRequired(cfg.JWTSecret))
	{
		// User profile
		protected.GET("/me", authHandler.GetProfile)
		protected.PUT("/me", authHandler.UpdateProfile)

		// API key management
		protected.POST("/api-keys", apiKeyHandler.CreateAPIKey)
		protected.GET("/api-keys", apiKeyHandler.ListAPIKeys)
		protected.DELETE("/api-keys/:id", apiKeyHandler.RevokeAPIKey)

		// User's URLs (link ownership)
		protected.GET("/my/urls", authHandler.GetMyURLs)
	}

	// Token validation endpoint (used internally by other services)
	router.POST("/api/v1/auth/validate", authHandler.ValidateToken)

	port := cfg.Port
	if port == "" {
		port = "8085"
	}
	log.Printf("Auth service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
