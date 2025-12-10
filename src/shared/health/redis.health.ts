import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult } from '@nestjs/terminus'

import { RedisService } from '../redis'

/**
 * Redis Health Indicator
 *
 * Custom health indicator for Redis connectivity.
 * Used by the health check endpoints to verify Redis is available.
 */
@Injectable()
export class RedisHealthIndicator {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Create a health status object
   *
   * @param key - Health check key name
   * @param isHealthy - Whether the service is healthy
   * @returns Health indicator result
   */
  private getStatus(key: string, isHealthy: boolean): HealthIndicatorResult {
    return {
      [key]: {
        status: isHealthy ? 'up' : 'down',
      },
    }
  }

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
    const isHealthy = await this.redisService.isHealthy()

    if (!isHealthy) {
      throw new Error('Redis check failed')
    }

    return this.getStatus(key, true)
  }
}
