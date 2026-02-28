import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    });

    this.client.on("connect", () => this.logger.log("Connected to Redis"));
    this.client.on("error", (err: Error) =>
      this.logger.error("Redis error", err.message),
    );
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Get the long URL from Redis cache.
   * Key format: url:{shortCode}
   */
  async getLongUrl(shortCode: string): Promise<string | null> {
    try {
      return await this.client.get(`url:${shortCode}`);
    } catch (err) {
      this.logger.warn("Redis GET failed, falling back to DB");
      return null;
    }
  }

  /**
   * Cache a URL mapping for future lookups.
   */
  async cacheLongUrl(
    shortCode: string,
    longUrl: string,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.setex(`url:${shortCode}`, ttlSeconds, longUrl);
      } else {
        await this.client.set(`url:${shortCode}`, longUrl);
      }
    } catch (err) {
      this.logger.warn("Redis SET failed");
    }
  }
}
