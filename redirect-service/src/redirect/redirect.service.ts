import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";
import { DatabaseService, UrlRecord } from "../database/database.service";
import { RabbitMQService, ClickEvent } from "../rabbitmq/rabbitmq.service";

export interface RedirectResult {
  longUrl: string;
  statusCode: 301 | 302;
}

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly db: DatabaseService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  /**
   * Resolve a short code to the original long URL.
   *
   * Flow:
   *  1. Check Redis cache
   *  2. On miss → query PostgreSQL
   *  3. Validate expiry & active status
   *  4. Cache the result in Redis for next time
   *  5. Publish click event to RabbitMQ (fire-and-forget)
   */
  async resolve(
    shortCode: string,
    ip: string,
    userAgent: string,
    referrer: string,
  ): Promise<RedirectResult | { error: "NOT_FOUND" | "EXPIRED" }> {
    // 1. Cache lookup
    const cached = await this.redis.getLongUrl(shortCode);
    if (cached) {
      this.logger.debug(`Cache HIT for ${shortCode}`);
      this.emitClickEvent(shortCode, ip, userAgent, referrer);
      return { longUrl: cached, statusCode: 301 };
    }

    this.logger.debug(`Cache MISS for ${shortCode}, querying DB`);

    // 2. Database lookup
    const record: UrlRecord | null = await this.db.findByShortCode(shortCode);
    if (!record || !record.isActive) {
      return { error: "NOT_FOUND" };
    }

    // 3. Expiry check
    if (record.expiryAt && new Date(record.expiryAt) < new Date()) {
      return { error: "EXPIRED" };
    }

    // 4. Populate cache
    let ttl: number | undefined;
    if (record.expiryAt) {
      ttl = Math.floor(
        (new Date(record.expiryAt).getTime() - Date.now()) / 1000,
      );
    }
    await this.redis.cacheLongUrl(shortCode, record.longUrl, ttl);

    // 5. Publish click event
    this.emitClickEvent(shortCode, ip, userAgent, referrer);

    return { longUrl: record.longUrl, statusCode: 301 };
  }

  /**
   * Fire-and-forget: push click analytics to RabbitMQ.
   */
  private emitClickEvent(
    shortCode: string,
    ip: string,
    userAgent: string,
    referrer: string,
  ): void {
    const event: ClickEvent = {
      shortCode,
      timestamp: new Date().toISOString(),
      ipAddress: ip,
      userAgent,
      referrer,
    };
    // intentionally not awaited – non-blocking
    this.rabbitmq.publishClickEvent(event).catch((err) => {
      this.logger.warn("Click event publish failed", (err as Error).message);
    });
  }
}
