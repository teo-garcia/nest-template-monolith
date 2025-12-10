import { Global, Module } from '@nestjs/common'

import { RedisService } from './redis.service'

/**
 * Redis Module
 *
 * Provides Redis connectivity and caching functionality.
 * Marked as global so it can be used anywhere without importing.
 *
 * Exports:
 * - RedisService: Cache operations and raw client access
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
