package redis

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
	"github.com/urlshortener/auth-service/internal/config"
)

// Connect establishes a connection to Redis.
func Connect(cfg *config.Config) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		DB:   1, // Use DB 1 for auth (DB 0 is used by url/redirect services)
	})

	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Could not connect to Redis: %v (token blacklisting disabled)", err)
	} else {
		log.Println("Connected to Redis")
	}

	return rdb
}
