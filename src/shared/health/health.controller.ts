import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { SkipThrottle } from '@nestjs/throttler'

import { PrismaHealthIndicator } from './prisma.health'
import { RedisHealthIndicator } from './redis.health'

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly redis: RedisHealthIndicator
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
  @HealthCheck()
  async checkReadiness() {
    return this.checkDependencies()
  }

  /**
   * General Health Check
   *
   * Comprehensive health check including all dependencies.
   * Provides detailed status information for monitoring and debugging.
   */
  @Get()
  @HealthCheck()
  async check() {
    return this.checkDependencies()
  }

  private async checkDependencies() {
    return this.health.check([
      () => this.prisma.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ])
  }
}
