import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "*" });
  const port = process.env.PORT || 8082;
  await app.listen(port);
  console.log(`Redirect Service running on port ${port}`);
}
bootstrap();
