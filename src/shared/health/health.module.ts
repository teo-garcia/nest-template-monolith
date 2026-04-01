import { Module } from '@nestjs/common'

import { HealthController } from './health.controller'

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
})
export class HealthModule {}
