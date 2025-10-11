import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller'
import environmentConfig from './config/environment'
import { HealthModule } from './shared/health'
import { LoggerModule } from './shared/logger/logger.module'
import { MetricsModule } from './shared/metrics'
import { PrismaModule } from './shared/prisma'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
    }),
    LoggerModule.forRoot(),
    PrismaModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
