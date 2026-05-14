import { ExecutionContext, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import type { Request } from 'express'

import { AppController } from './app.controller'
import { environmentConfig, validate } from './config'
import { TasksModule } from './modules/tasks'
import { HealthModule } from './shared/health'
import { LoggerModule } from './shared/logger/logger.module'
import { MetricsModule } from './shared/metrics'
import { PrismaModule } from './shared/prisma'
import { RedisModule, RedisThrottlerStorage } from './shared/redis'

const shouldSkipThrottle = (context: ExecutionContext): boolean => {
  if (context.getType() !== 'http') {
    return true
  }

  const request = context.switchToHttp().getRequest<Request>()
  const path = request.path || request.url.split('?')[0] || '/'

  return (
    path === '/' ||
    path === '/health' ||
    path.startsWith('/health/') ||
    path === '/metrics' ||
    path === '/docs' ||
    path.startsWith('/docs/')
  )
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
      validate,
    }),

    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [ConfigService, RedisThrottlerStorage],
      useFactory: (config: ConfigService, storage: RedisThrottlerStorage) => ({
        storage,
        skipIf: shouldSkipThrottle,
        setHeaders: true,
        throttlers: [
          {
            name: 'default',
            ttl: (config.get<number>('config.throttle.ttl') ?? 60) * 1000,
            limit: config.get<number>('config.throttle.limit') ?? 100,
          },
        ],
      }),
    }),

    LoggerModule.forRoot(),
    PrismaModule,
    RedisModule,
    HealthModule,
    MetricsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
