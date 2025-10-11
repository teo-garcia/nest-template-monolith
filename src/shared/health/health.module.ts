import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'

import { PrismaModule } from '../prisma'
import { HealthController } from './health.controller'

/**
 * Health Module
 *
 * Provides health check endpoints for the application.
 * Integrates with @nestjs/terminus for standardized health checks.
 */
@Module({
  imports: [
    TerminusModule, // NestJS health check utilities
    PrismaModule, // Database health checks
  ],
  controllers: [HealthController],
})
export class HealthModule {}



