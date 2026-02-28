import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { Pool, QueryResult } from "pg";

interface UrlRow {
  short_code: string;
  long_url: string;
  expiry_at: Date | null;
  is_active: boolean;
}

export interface UrlRecord {
  shortCode: string;
  longUrl: string;
  expiryAt: Date | null;
  isActive: boolean;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  onModuleInit() {
    this.pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://urlshortener:urlshortener@localhost:5432/urlshortener",
      max: 10,
    });

    this.pool.on("error", (err: Error) =>
      this.logger.error("Unexpected PG pool error", err.message),
    );

    this.logger.log("PostgreSQL pool created");
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /**
   * Look up a URL record by its short code.
   */
  async findByShortCode(shortCode: string): Promise<UrlRecord | null> {
    const result: QueryResult<UrlRow> = await this.pool.query(
      "SELECT short_code, long_url, expiry_at, is_active FROM urls WHERE short_code = $1 LIMIT 1",
      [shortCode],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      shortCode: row.short_code,
      longUrl: row.long_url,
      expiryAt: row.expiry_at,
      isActive: row.is_active,
    };
  }
}
