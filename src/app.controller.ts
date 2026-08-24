import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'

import { ApiEnvelopeResponse, AppInfoDto } from './shared/dto'

/**
 * App Controller
 *
 * Root controller providing basic application info.
 * Health checks are handled by the HealthModule.
 */
@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Root endpoint
   *
   * Returns a simple message indicating the API is running.
   */
  @Get()
  @ApiEnvelopeResponse(AppInfoDto, {
    description: 'Service name, status and version in the success envelope.',
  })
  getInfo() {
    const appName =
      this.configService.get<string>('config.app.name') ||
      'NestJS Monolith Template'
    const appVersion =
      this.configService.get<string>('config.app.version') || '1'

    return {
      name: appName,
      status: 'ok',
      version: appVersion,
    }
  }
}
