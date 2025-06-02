import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './validation';
import environmentConfig from './environment';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [environmentConfig],
      validate,
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
