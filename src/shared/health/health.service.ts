import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from '../prisma/index.js'
import { RedisService } from '../redis/index.js'
import {
  HealthCheckState,
  HealthResponseDto,
  resolveHealthStatus,
} from './health.contract.js'

/**
 * Builds the shared health report. Mirrors the Adonis template's
 * `readiness_service` so both backends answer with the same contract.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService
  ) {}

  private get version(): string {
    return this.configService.get<string>('config.app.version') ?? '1'
  }

  liveness(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: this.version,
    }
  }

  async report(): Promise<HealthResponseDto> {
    const [database, redis] = await Promise.all([
      this.check(() => this.prismaService.healthCheck()),
      this.check(() => this.redisService.isHealthy()),
    ])

    const checks: Record<string, HealthCheckState> = { database, redis }

    return {
      status: resolveHealthStatus(checks),
      timestamp: new Date().toISOString(),
      version: this.version,
      checks,
    }
  }

  private async check(
    probe: () => Promise<boolean>
  ): Promise<HealthCheckState> {
    try {
      return (await probe()) ? 'up' : 'down'
    } catch {
      return 'down'
    }
  }
}
