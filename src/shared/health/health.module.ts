import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'

import { HealthController } from './health.controller'
import { RedisHealthIndicator } from './redis.health'

/**
 * Health Module
 *
 * Provides health check endpoints for the application.
 * Uses @nestjs/terminus for standardized health checks.
 *
 * Endpoints:
 * - GET /health/live  - Liveness probe (is the app running?)
 * - GET /health/ready - Readiness probe (are dependencies available?)
 * - GET /health       - Comprehensive health check
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
