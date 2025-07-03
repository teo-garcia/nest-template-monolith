import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

import { PrismaService } from './shared/prisma'

export class HealthCheckValidationDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name cannot be longer than 50 characters' })
  name!: string

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters long' })
  @MaxLength(500, { message: 'Message cannot be longer than 500 characters' })
  message?: string
}

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService
  ) {}

  @Get()
  getHello(): string {
    return 'NestJS Monolith Template - API is running! 🚀'
  }

  @Get('health')
  async getHealth(): Promise<{
    application: {
      name: string
      environment: string
    }
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: {
      database: 'healthy' | 'unhealthy'
      validation: 'operational'
      errorHandling: 'operational'
      responseTransform: 'operational'
    }
  }> {
    const appName =
      this.configService.get<string>('app.appName') ||
      'NestJS Monolith Template'
    const environment =
      this.configService.get<string>('app.nodeEnv') || 'development'

    const databaseHealthy = await this.prismaService.healthCheck()

    return {
      application: {
        name: appName,
        environment,
      },
      status: databaseHealthy ? 'healthy' : 'degraded',
      services: {
        database: databaseHealthy ? 'healthy' : 'unhealthy',
        validation: 'operational',
        errorHandling: 'operational',
        responseTransform: 'operational',
      },
    }
  }

  @Get('health/database')
  async getDatabaseHealth(): Promise<{
    status: 'healthy' | 'unhealthy'
    metrics: {
      users: number
      books: number
    }
    connection: {
      database: string
      user: string
    }
  }> {
    const isHealthy = await this.prismaService.healthCheck()

    if (!isHealthy) {
      return {
        status: 'unhealthy',
        metrics: { users: -1, books: -1 },
        connection: { database: 'unknown', user: 'unknown' },
      }
    }

    const userCount = await this.prismaService.user.count()
    const bookCount = await this.prismaService.book.count()
    const databaseInfo = await this.prismaService.getDatabaseInfo()
    const infoArray = Array.isArray(databaseInfo) ? databaseInfo : []
    const info = (infoArray[0] as Record<string, unknown>) || {}

    return {
      status: 'healthy',
      metrics: {
        users: userCount,
        books: bookCount,
      },
      connection: {
        database:
          typeof info.database_name === 'string'
            ? info.database_name
            : 'unknown',
        user:
          typeof info.current_user === 'string' ? info.current_user : 'unknown',
      },
    }
  }

  @Post('health/validation')
  testValidation(@Body() dto: HealthCheckValidationDto): {
    system: 'validation'
    status: 'operational'
    testedData: HealthCheckValidationDto
  } {
    return {
      system: 'validation',
      status: 'operational',
      testedData: dto,
    }
  }

  @Get('health/error/:type')
  testErrorHandling(@Param('type') type: string): never {
    switch (type) {
      case 'bad-request': {
        throw new HttpException(
          'Testing bad request handling',
          HttpStatus.BAD_REQUEST
        )
      }
      case 'not-found': {
        throw new HttpException(
          'Testing not found handling',
          HttpStatus.NOT_FOUND
        )
      }
      case 'validation': {
        throw new HttpException(
          {
            message: 'Testing validation error format',
            errors: {
              field1: ['Field 1 validation failed'],
              field2: ['Field 2 is required'],
            },
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        )
      }
      default: {
        throw new Error('Testing unknown error handling')
      }
    }
  }

  @Get('health/transform')
  testResponseTransform(): {
    system: 'responseTransform'
    status: 'operational'
    sample: {
      text: string
      number: number
      boolean: boolean
    }
  } {
    return {
      system: 'responseTransform',
      status: 'operational',
      sample: {
        text: 'example',
        number: 123,
        boolean: true,
      },
    }
  }

  @Get('health/comprehensive')
  async getComprehensiveHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy'
    systems: {
      database: {
        status: 'operational' | 'down'
        metrics: { users: number; books: number }
      }
      validation: { status: 'operational' }
      errorHandling: { status: 'operational' }
      responseTransform: { status: 'operational' }
    }
  }> {
    const databaseHealthy = await this.prismaService.healthCheck()
    const userCount = databaseHealthy
      ? await this.prismaService.user.count()
      : -1
    const bookCount = databaseHealthy
      ? await this.prismaService.book.count()
      : -1

    return {
      overall: databaseHealthy ? 'healthy' : 'degraded',
      systems: {
        database: {
          status: databaseHealthy ? 'operational' : 'down',
          metrics: { users: userCount, books: bookCount },
        },
        validation: { status: 'operational' },
        errorHandling: { status: 'operational' },
        responseTransform: { status: 'operational' },
      },
    }
  }
}
