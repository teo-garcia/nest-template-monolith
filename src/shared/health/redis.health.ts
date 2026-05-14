import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus'

import { RedisService } from '../redis'

/**
 * Redis Health Indicator
 *
 * Custom health indicator for Redis connectivity.
 * Used by the health check endpoints to verify Redis is available.
 */
@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redisService: RedisService,
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  /**
   * Check if Redis is healthy
   *
   * Performs a PING command to verify connectivity.
   *
   * @param key - Key name for the health check result
   * @returns Health indicator result
   * @throws Error if Redis is not responding
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key)
    const isHealthy = await this.redisService.isHealthy()

    if (!isHealthy) {
      return indicator.down('Redis PING failed')
    }

    return indicator.up()
  }
}
