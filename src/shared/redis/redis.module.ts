import { Global, Module } from '@nestjs/common'

import { RedisService } from './redis.service'
import { RedisThrottlerStorage } from './redis-throttler.storage'

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
  providers: [RedisService, RedisThrottlerStorage],
  exports: [RedisService, RedisThrottlerStorage],
})
export class RedisModule {}
