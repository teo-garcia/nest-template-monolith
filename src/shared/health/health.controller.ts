import { Controller, Get } from '@nestjs/common'
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus'

import { PrismaService } from '../prisma'
import { RedisHealthIndicator } from './redis.health'

/**
 * Health Check Controller
 *
 * Provides health check endpoints for deployment orchestration (K8s, Docker, cloud platforms).
 * These endpoints help determine if the service is alive and ready to accept traffic.
 */
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    private redisHealth: RedisHealthIndicator
  ) {}

  /**
   * Liveness Probe
   *
   * Checks if the application is running and can respond to requests.
   * Used by orchestrators to determine if the container should be restarted.
   * This is a lightweight check that should always succeed if the app is running.
   */
  @Get('live')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([
      // Simply returns OK if the app is running
      async () => ({ status: { status: 'up' } }),
    ])
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
  checkReadiness() {
    return this.health.check([
      // Check database connectivity
      // Uses Prisma to execute a simple query: SELECT 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => this.prismaHealth.pingCheck('database', this.prisma as any),

      // Check Redis connectivity
      // Sends a PING command and expects PONG response
      async () => this.redisHealth.isHealthy('redis'),
    ])
  }

  /**
   * General Health Check
   *
   * Comprehensive health check including all dependencies.
   * Provides detailed status information for monitoring and debugging.
   */
  @Get()
  @HealthCheck()
  check() {
    return this.checkReadiness()
  }
}
