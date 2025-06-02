import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  /**
   * Health check method to verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * Get database connection info for debugging
   */
  async getDatabaseInfo(): Promise<unknown> {
    try {
      const result = await this.$queryRaw`
        SELECT
          current_database() as database_name,
          current_user as current_user,
          version() as version,
          now() as current_time
      `;
      return result;
    } catch (error) {
      this.logger.error('Failed to get database info', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL with proper error handling
   */
  async executeRaw(sql: string, parameters: unknown[] = []): Promise<number> {
    try {
      return await this.$executeRawUnsafe(sql, ...parameters);
    } catch (error) {
      this.logger.error(`Raw SQL execution failed: ${sql}`, error);
      throw error;
    }
  }

  /**
   * Query raw SQL with proper error handling
   */
  async queryRaw(sql: string, parameters: unknown[] = []): Promise<unknown> {
    try {
      return await this.$queryRawUnsafe(sql, ...parameters);
    } catch (error) {
      this.logger.error(`Raw SQL query failed: ${sql}`, error);
      throw error;
    }
  }
}
