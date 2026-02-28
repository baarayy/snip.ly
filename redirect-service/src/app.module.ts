import { Module } from "@nestjs/common";
import { RedirectController } from "./redirect/redirect.controller";
import { RedirectService } from "./redirect/redirect.service";
import { RedisService } from "./redis/redis.service";
import { DatabaseService } from "./database/database.service";
import { RabbitMQService } from "./rabbitmq/rabbitmq.service";
import { HealthController } from "./health/health.controller";

@Module({
  controllers: [HealthController, RedirectController],
  providers: [RedirectService, RedisService, DatabaseService, RabbitMQService],
})
export class AppModule {}
