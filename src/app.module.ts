import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller'
import environmentConfig from './config/environment'
import { LoggerModule } from './shared/logger/logger.module'
import { PrismaModule } from './shared/prisma'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
    }),
    LoggerModule.forRoot(),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
