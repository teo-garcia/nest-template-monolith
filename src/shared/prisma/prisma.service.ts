import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

import { PrismaClient } from '../../generated/prisma/client'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)
  private pool: Pool

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('config.database.url')
    const poolMax = configService.get<number>('config.database.poolMax', 10)

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required')
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      max: poolMax,
    })

    const adapter = new PrismaPg(pool)

    super({
      adapter,
      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      errorFormat: 'colorless',
    })

    this.pool = pool
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect()
      this.logger.log('Successfully connected to database')
    } catch (error) {
      this.logger.error('Failed to connect to database', error)
      throw error
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect()
      await this.pool.end()
      this.logger.log('Disconnected from database')
    } catch (error) {
      this.logger.error('Error disconnecting from database', error)
    }
  }

  /**
   * Health check method to verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      this.logger.error('Database health check failed', error)
      return false
    }
  }
}
