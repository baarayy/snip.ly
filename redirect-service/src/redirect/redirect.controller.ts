import { Controller, Get, Param, Req, Res, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { RedirectService } from "./redirect.service";

@Controller()
export class RedirectController {
  private readonly logger = new Logger(RedirectController.name);

  constructor(private readonly redirectService: RedirectService) {}

  /**
   * GET /:shortCode
   *
   * This is the core redirect endpoint.
   * Returns HTTP 301 (permanent redirect) or error codes.
   */
  @Get(":shortCode")
  async redirect(
    @Param("shortCode") shortCode: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const referrer = req.headers["referer"] || req.headers["referrer"] || "";

    this.logger.log(`Redirect request: ${shortCode} from ${ip}`);

    const result = await this.redirectService.resolve(
      shortCode,
      ip,
      userAgent as string,
      referrer as string,
    );

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        res.status(404).json({ error: "Short URL not found" });
        return;
      }
      if (result.error === "EXPIRED") {
        res.status(410).json({ error: "Short URL has expired" });
        return;
      }
    }

    if ("longUrl" in result) {
      res.redirect(result.statusCode, result.longUrl);
    }
  }
}
