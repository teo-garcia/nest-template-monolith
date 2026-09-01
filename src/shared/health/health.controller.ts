import { Controller, Get, Res } from '@nestjs/common'
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import type { Response } from 'express'

import { HealthResponseDto } from './health.contract'
import { HealthService } from './health.service'

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Liveness Probe
   *
   * Checks if the application is running and can respond to requests.
   * Used by orchestrators to determine if the container should be restarted.
   * This is a lightweight check that should always succeed if the app is running.
   */
  @Get('live')
  @ApiOkResponse({ type: HealthResponseDto })
  checkLiveness(): HealthResponseDto {
    return this.healthService.liveness()
  }

  /**
   * Readiness Probe
   *
   * Checks if the application is ready to accept traffic.
   * Validates that all critical dependencies (database, cache) are available.
   * Used by load balancers and orchestrators to route traffic only to ready instances.
   */
  @Get('ready')
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiResponse({ status: 503, type: HealthResponseDto })
  async checkReadiness(
    @Res({ passthrough: true }) response: Response
  ): Promise<HealthResponseDto> {
    return this.respond(response)
  }

  /**
   * General Health Check
   *
   * Comprehensive health check including all dependencies.
   * Provides detailed status information for monitoring and debugging.
   */
  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiResponse({ status: 503, type: HealthResponseDto })
  async check(
    @Res({ passthrough: true }) response: Response
  ): Promise<HealthResponseDto> {
    return this.respond(response)
  }

  /**
   * A degraded or down report answers 503 so orchestrators and load balancers
   * take the instance out of rotation.
   */
  private async respond(response: Response): Promise<HealthResponseDto> {
    const report = await this.healthService.report()

    response.status(report.status === 'ok' ? 200 : 503)

    return report
  }
}
