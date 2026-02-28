import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import * as amqp from "amqplib";

export interface ClickEvent {
  shortCode: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  referrer: string;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: any;
  private channel: any;
  private readonly logger = new Logger(RabbitMQService.name);

  private readonly EXCHANGE = "url.shortener.exchange";
  private readonly ROUTING_KEY = "click.event";

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(maxRetries = 10, delayMs = 5000) {
    const url =
      process.env.RABBITMQ_URL ||
      "amqp://urlshortener:urlshortener@localhost:5672";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.EXCHANGE, "topic", {
          durable: true,
        });
        this.logger.log("Connected to RabbitMQ");
        return;
      } catch (err) {
        this.logger.warn(
          `Failed to connect to RabbitMQ (attempt ${attempt}/${maxRetries}): ${(err as Error).message}`,
        );
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    this.logger.error("Could not connect to RabbitMQ after all retries");
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // ignore
    }
  }

  /**
   * Publish a click event asynchronously to the message queue.
   * Analytics service will consume these events.
   */
  async publishClickEvent(event: ClickEvent): Promise<void> {
    try {
      const payload = Buffer.from(JSON.stringify(event));
      this.channel.publish(this.EXCHANGE, this.ROUTING_KEY, payload, {
        persistent: true,
        contentType: "application/json",
      });
      this.logger.debug(`Published click event for ${event.shortCode}`);
    } catch (err) {
      this.logger.error(
        "Failed to publish click event",
        (err as Error).message,
      );
    }
  }
}
