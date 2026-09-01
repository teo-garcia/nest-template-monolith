import { Module } from '@nestjs/common'

import { HealthController } from './health.controller'
import { HealthService } from './health.service'

/**
 * Health Module
 *
 * Provides health check endpoints for the application.
 *
 * Endpoints:
 * - GET /health/live  - Liveness probe (is the app running?)
 * - GET /health/ready - Readiness probe (are dependencies available?)
 * - GET /health       - Comprehensive health check
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
