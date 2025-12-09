import { Controller, Get } from '@nestjs/common'
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus'

import { PrismaService } from '../prisma'

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
    private prisma: PrismaService
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
   * Validates that all critical dependencies (database, cache, etc.) are available.
   * Used by load balancers and orchestrators to route traffic only to ready instances.
   */
  @Get('ready')
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      // Check database connectivity
      // This uses Prisma to execute a simple query: SELECT 1
      async () => this.prismaHealth.pingCheck('database', this.prisma),
    ])
  }

  /**
   * General Health Check
   *
   * Comprehensive health check including all dependencies.
   * Provides detailed status information for monitoring and debugging.
   * Currently equivalent to readiness check, but can be extended with more checks.
   */
  @Get()
  @HealthCheck()
  check() {
    // Delegates to readiness check for now
    // In the future, this could include additional monitoring checks
    // that don't affect readiness (e.g., non-critical dependencies, metrics)
    return this.checkReadiness()
  }
}
