import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * App Controller
 *
 * Root controller providing basic application info.
 * Health checks are handled by the HealthModule.
 */
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Root endpoint
   *
   * Returns a simple message indicating the API is running.
   */
  @Get()
  getInfo(): string {
    const appName =
      this.configService.get<string>('config.app.name') ||
      'NestJS Monolith Template'
    return `${appName} - API is running!`
  }
}
