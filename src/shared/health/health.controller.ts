import { Controller, Get, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Response } from 'express'

import { PrismaService } from '../prisma'
import { RedisService } from '../redis'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  /**
   * Liveness Probe
   *
   * Checks if the application is running and can respond to requests.
   * Used by orchestrators to determine if the container should be restarted.
   * This is a lightweight check that should always succeed if the app is running.
   */
  @Get('live')
  checkLiveness() {
    return { status: 'ok' }
  }

  /**
   * Readiness Probe
   *
   * Checks if the application is ready to accept traffic.
   * Validates that all critical dependencies (database, cache) are available.
   * Used by load balancers and orchestrators to route traffic only to ready instances.
   */
  @Get('ready')
  async checkReadiness(@Res({ passthrough: true }) response: Response) {
    const checks = {
      database: (await this.prisma.healthCheck()) ? 'ok' : 'error',
      redis: (await this.redis.isHealthy()) ? 'ok' : 'error',
    }
    const isHealthy = Object.values(checks).every((value) => value === 'ok')

    response.status(isHealthy ? 200 : 503)

    return {
      status: isHealthy ? 'ok' : 'error',
      checks,
    }
  }

  /**
   * General Health Check
   *
   * Comprehensive health check including all dependencies.
   * Provides detailed status information for monitoring and debugging.
   */
  @Get()
  async check(@Res({ passthrough: true }) response: Response) {
    const checks = {
      database: (await this.prisma.healthCheck()) ? 'ok' : 'error',
      redis: (await this.redis.isHealthy()) ? 'ok' : 'error',
    }
    const isHealthy = Object.values(checks).every((value) => value === 'ok')

    response.status(isHealthy ? 200 : 503)

    return {
      status: isHealthy ? 'ok' : 'degraded',
      checks,
    }
  }
}
