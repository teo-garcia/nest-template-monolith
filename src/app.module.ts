import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller'
import { environmentConfig, validate } from './config'
import { TasksModule } from './modules/tasks'
import { HealthModule } from './shared/health'
import { LoggerModule } from './shared/logger/logger.module'
import { MetricsModule } from './shared/metrics'
import { PrismaModule } from './shared/prisma'
import { RedisModule } from './shared/redis'

/**
 * App Module
 *
 * Root module for the monolith application.
 * Imports all shared modules and feature modules.
 *
 * Architecture:
 * - Shared modules (global): Logging, Metrics, Database, Cache
 * - Infrastructure modules: Health checks, Configuration
 * - Feature modules: Tasks (example domain module)
 */
@Module({
  imports: [
    // Configuration
    // Loads and validates environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
      validate,
    }),

    // Logging
    // Provides structured logging throughout the application
    LoggerModule.forRoot(),

    // Database
    // Prisma ORM for PostgreSQL access
    PrismaModule,

    // Cache
    // Redis for caching and rate limiting
    RedisModule,

    // Health Checks
    // Liveness and readiness probes for orchestrators
    HealthModule,

    // Metrics
    // Prometheus-compatible metrics collection
    MetricsModule,

    // Feature Modules
    // Domain-specific business logic
    TasksModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
