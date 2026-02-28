import { Test, TestingModule } from "@nestjs/testing";
import { RedirectService, RedirectResult } from "../redirect/redirect.service";
import { RedisService } from "../redis/redis.service";
import { DatabaseService, UrlRecord } from "../database/database.service";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service";

describe("RedirectService", () => {
  let service: RedirectService;
  let redis: jest.Mocked<RedisService>;
  let db: jest.Mocked<DatabaseService>;
  let rabbitmq: jest.Mocked<RabbitMQService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedirectService,
        {
          provide: RedisService,
          useValue: {
            getLongUrl: jest.fn(),
            cacheLongUrl: jest.fn(),
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            findByShortCode: jest.fn(),
          },
        },
        {
          provide: RabbitMQService,
          useValue: {
            publishClickEvent: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RedirectService>(RedirectService);
    redis = module.get(RedisService) as jest.Mocked<RedisService>;
    db = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
    rabbitmq = module.get(RabbitMQService) as jest.Mocked<RabbitMQService>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("resolve()", () => {
    const shortCode = "abc1234";
    const ip = "127.0.0.1";
    const userAgent = "Jest/1.0";
    const referrer = "https://google.com";

    it("should return cached URL on cache hit", async () => {
      redis.getLongUrl.mockResolvedValue("https://example.com");

      const result = await service.resolve(shortCode, ip, userAgent, referrer);

      expect(result).toEqual({
        longUrl: "https://example.com",
        statusCode: 301,
      });
      expect(redis.getLongUrl).toHaveBeenCalledWith(shortCode);
      expect(db.findByShortCode).not.toHaveBeenCalled();
      expect(rabbitmq.publishClickEvent).toHaveBeenCalledWith(
        expect.objectContaining({ shortCode, ipAddress: ip }),
      );
    });

    it("should fall back to DB on cache miss and cache the result", async () => {
      redis.getLongUrl.mockResolvedValue(null);
      db.findByShortCode.mockResolvedValue({
        shortCode,
        longUrl: "https://example.com",
        expiryAt: null,
        isActive: true,
      } as UrlRecord);

      const result = await service.resolve(shortCode, ip, userAgent, referrer);

      expect(result).toEqual({
        longUrl: "https://example.com",
        statusCode: 301,
      });
      expect(db.findByShortCode).toHaveBeenCalledWith(shortCode);
      expect(redis.cacheLongUrl).toHaveBeenCalledWith(
        shortCode,
        "https://example.com",
        undefined,
      );
    });

    it("should return NOT_FOUND when code does not exist", async () => {
      redis.getLongUrl.mockResolvedValue(null);
      db.findByShortCode.mockResolvedValue(null);

      const result = await service.resolve(shortCode, ip, userAgent, referrer);

      expect(result).toEqual({ error: "NOT_FOUND" });
      expect(rabbitmq.publishClickEvent).not.toHaveBeenCalled();
    });

    it("should return NOT_FOUND when URL is inactive", async () => {
      redis.getLongUrl.mockResolvedValue(null);
      db.findByShortCode.mockResolvedValue({
        shortCode,
        longUrl: "https://example.com",
        expiryAt: null,
        isActive: false,
      } as UrlRecord);

      const result = await service.resolve(shortCode, ip, userAgent, referrer);

      expect(result).toEqual({ error: "NOT_FOUND" });
    });

    it("should return EXPIRED when URL has passed its expiry", async () => {
      redis.getLongUrl.mockResolvedValue(null);
      db.findByShortCode.mockResolvedValue({
        shortCode,
        longUrl: "https://example.com",
        expiryAt: new Date("2020-01-01"),
        isActive: true,
      } as UrlRecord);

      const result = await service.resolve(shortCode, ip, userAgent, referrer);

      expect(result).toEqual({ error: "EXPIRED" });
    });

    it("should cache with TTL when URL has a future expiry", async () => {
      const expiryAt = new Date(Date.now() + 3600_000); // 1 hour from now
      redis.getLongUrl.mockResolvedValue(null);
      db.findByShortCode.mockResolvedValue({
        shortCode,
        longUrl: "https://example.com",
        expiryAt,
        isActive: true,
      } as UrlRecord);

      await service.resolve(shortCode, ip, userAgent, referrer);

      expect(redis.cacheLongUrl).toHaveBeenCalledWith(
        shortCode,
        "https://example.com",
        expect.any(Number),
      );
      const ttl = redis.cacheLongUrl.mock.calls[0][2]!;
      expect(ttl).toBeGreaterThan(3500);
      expect(ttl).toBeLessThanOrEqual(3600);
    });

    it("should not throw if RabbitMQ publish fails", async () => {
      redis.getLongUrl.mockResolvedValue("https://example.com");
      rabbitmq.publishClickEvent.mockRejectedValue(new Error("RabbitMQ down"));

      // Should not throw
      const result = await service.resolve(shortCode, ip, userAgent, referrer);
      expect(result).toEqual({
        longUrl: "https://example.com",
        statusCode: 301,
      });
    });
  });
});
