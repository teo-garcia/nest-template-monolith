import { plainToInstance, Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator'

export class EnvironmentVariables {
  // Application
  @IsEnum(['development', 'production', 'test', 'staging'], {
    message: 'NODE_ENV must be one of: development, production, test, staging',
  })
  @IsOptional()
  NODE_ENV: string = 'development'

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  PORT: number = 3000

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api'

  @IsString()
  @IsOptional()
  APP_NAME: string = 'NestJS Monolith Template'

  @IsString()
  @IsOptional()
  API_VERSION: string = '1'

  // Database
  @IsString()
  @IsOptional()
  DATABASE_HOST: string = 'localhost'

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  DATABASE_PORT: number = 5432

  @IsString()
  @IsOptional()
  DATABASE_USER: string = 'postgres'

  @IsString()
  @IsOptional()
  DATABASE_PASSWORD: string = 'postgres'

  @IsString()
  @IsOptional()
  DATABASE_NAME: string = 'nest_monolith'

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  DATABASE_SYNCHRONIZE: boolean = false

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  DATABASE_LOGGING: boolean = true

  // JWT Authentication
  @IsString()
  JWT_SECRET: string

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string = '1d'

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION: string = '7d'

  // Redis Cache (Optional)
  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost'

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  REDIS_PORT: number = 6379

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string = ''

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  REDIS_TTL: number = 3600

  // Swagger Documentation
  @IsString()
  @IsOptional()
  SWAGGER_TITLE: string = 'NestJS Monolith API'

  @IsString()
  @IsOptional()
  SWAGGER_DESCRIPTION: string = 'API Documentation for NestJS Monolith Template'

  @IsString()
  @IsOptional()
  SWAGGER_VERSION: string = '1.0'

  @IsString()
  @IsOptional()
  SWAGGER_PATH: string = 'docs'

  // Logging
  @IsEnum(['error', 'warn', 'info', 'debug', 'verbose'], {
    message: 'LOG_LEVEL must be one of: error, warn, info, debug, verbose',
  })
  @IsOptional()
  LOG_LEVEL: string = 'debug'

  @IsEnum(['console', 'file'], {
    message: 'LOG_OUTPUT must be one of: console, file',
  })
  @IsOptional()
  LOG_OUTPUT: string = 'console'

  // CORS
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  CORS_ENABLED: boolean = true

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000'

  // Rate Limiting
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  THROTTLE_TTL: number = 60

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  THROTTLE_LIMIT: number = 100
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  return validatedConfig
}
