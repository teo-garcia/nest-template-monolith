import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import environmentConfig from './environment';
import { validate } from './validation';

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
