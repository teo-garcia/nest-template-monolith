import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

/**
 * Redis Service
 *
 * Provides Redis connectivity for caching and other Redis operations.
 * Manages connection lifecycle and provides basic cache operations.
 *
 * Features:
 * - Automatic connection management
 * - Graceful shutdown
 * - Type-safe get/set operations with JSON serialization
 * - TTL support for cache expiration
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis

  /**
   * Default TTL for cached items (in seconds)
   * Can be overridden per-operation
   */
  private readonly defaultTtl: number

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>(
      'config.redis.host',
      'localhost'
    )
    const port = this.configService.get<number>('config.redis.port', 6379)
    const password = this.configService.get<string>('config.redis.password')
    this.defaultTtl = this.configService.get<number>('config.redis.ttl', 3600)

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        // Exponential backoff with max 30 seconds
        const delay = Math.min(times * 100, 30_000)
        this.logger.warn(
          `Redis connection retry attempt ${times}, delay: ${delay}ms`
        )
        return delay
      },
    })
  }

  async onModuleInit() {
    this.client.on('connect', () => {
      this.logger.log('Connected to Redis')
    })

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error)
    })

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed')
    })
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis connection...')
    await this.client.quit()
  }

  /**
   * Get the raw Redis client for advanced operations
   *
   * @returns Redis client instance
   */
  getClient(): Redis {
    return this.client
  }

  /**
   * Check if Redis is connected and responsive
   *
   * @returns true if Redis is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping()
      return result === 'PONG'
    } catch {
      return false
    }
  }

  /**
   * Get a cached value by key
   *
   * @param key - Cache key
   * @returns Parsed value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key)

    if (!value) {
      return null
    }

    try {
      return JSON.parse(value) as T
    } catch {
      // If parsing fails, return raw string as T
      return value as unknown as T
    }
  }

  /**
   * Set a cached value
   *
   * @param key - Cache key
   * @param value - Value to cache (will be JSON serialized)
   * @param ttl - Time to live in seconds (optional, uses default if not provided)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    const expiration = ttl ?? this.defaultTtl

    await this.client.setex(key, expiration, serialized)
  }

  /**
   * Delete a cached value
   *
   * @param key - Cache key
   * @returns Number of keys deleted (0 or 1)
   */
  async del(key: string): Promise<number> {
    return this.client.del(key)
  }

  /**
   * Delete multiple keys matching a pattern
   *
   * @param pattern - Key pattern (e.g., "tasks:*")
   * @returns Number of keys deleted
   */
  async delByPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern)

    if (keys.length === 0) {
      return 0
    }

    return this.client.del(...keys)
  }

  /**
   * Check if a key exists
   *
   * @param key - Cache key
   * @returns true if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  /**
   * Get remaining TTL for a key
   *
   * @param key - Cache key
   * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key)
  }
}
