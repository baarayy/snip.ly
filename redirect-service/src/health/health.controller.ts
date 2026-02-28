import { Controller, Get } from "@nestjs/common";

@Controller("_health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "redirect-service" };
  }
}
