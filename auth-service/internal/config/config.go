package config

import "os"

// Config holds all configuration for the auth service.
type Config struct {
	// Server
	Port        string
	Environment string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// Redis
	RedisHost string
	RedisPort string

	// JWT
	JWTSecret          string
	JWTAccessTokenTTL  string // e.g. "15m"
	JWTRefreshTokenTTL string // e.g. "7d"

	// OAuth - Google
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// OAuth - GitHub
	GitHubClientID     string
	GitHubClientSecret string
	GitHubRedirectURL  string

	// Frontend URL for OAuth redirects
	FrontendURL string
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// Load reads configuration from environment variables.
func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8085"),
		Environment: getEnv("ENVIRONMENT", "development"),

		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "urlshortener"),
		DBPassword: getEnv("DB_PASSWORD", "urlshortener"),
		DBName:     getEnv("DB_NAME", "urlshortener"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		RedisHost: getEnv("REDIS_HOST", "localhost"),
		RedisPort: getEnv("REDIS_PORT", "6379"),

		JWTSecret:          getEnv("JWT_SECRET", "super-secret-change-in-production"),
		JWTAccessTokenTTL:  getEnv("JWT_ACCESS_TOKEN_TTL", "15m"),
		JWTRefreshTokenTTL: getEnv("JWT_REFRESH_TOKEN_TTL", "168h"), // 7 days

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/auth/oauth/google/callback"),

		GitHubClientID:     getEnv("GITHUB_CLIENT_ID", ""),
		GitHubClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
		GitHubRedirectURL:  getEnv("GITHUB_REDIRECT_URL", "http://localhost:8080/api/v1/auth/oauth/github/callback"),

		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
	}
}
