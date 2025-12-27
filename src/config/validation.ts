import { plainToClass } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator'

/**
 * Environment Variables Validation Schema
 *
 * Validates that all required environment variables are present and correctly typed.
 * The application will fail to start if validation fails, preventing runtime errors.
 */

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment = Environment.Development

  @IsNumber()
  @IsOptional()
  PORT?: number = 3000

  @IsString()
  @IsOptional()
  API_PREFIX?: string = 'api'

  @IsString()
  @IsOptional()
  APP_NAME?: string

  @IsString()
  @IsOptional()
  API_VERSION?: string

  // Database (required for monolith)
  @IsString()
  @IsOptional()
  DATABASE_URL?: string

  @IsString()
  @IsOptional()
  DATABASE_HOST?: string

  @IsNumber()
  @IsOptional()
  DATABASE_PORT?: number

  @IsString()
  @IsOptional()
  DATABASE_USER?: string

  @IsString()
  @IsOptional()
  DATABASE_PASSWORD?: string

  @IsString()
  @IsOptional()
  DATABASE_NAME?: string

  @IsBoolean()
  @IsOptional()
  DATABASE_SYNCHRONIZE?: boolean

  @IsBoolean()
  @IsOptional()
  DATABASE_LOGGING?: boolean

  // Redis (for caching)
  @IsString()
  @IsOptional()
  REDIS_HOST?: string = 'localhost'

  @IsNumber()
  @IsOptional()
  REDIS_PORT?: number = 6379

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string

  @IsNumber()
  @IsOptional()
  REDIS_TTL?: number

  // Logging
  @IsString()
  @IsOptional()
  LOG_LEVEL?: string = 'debug'

  @IsString()
  @IsOptional()
  LOG_OUTPUT?: string

  // CORS
  @IsBoolean()
  @IsOptional()
  CORS_ENABLED?: boolean

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string

  // Rate Limiting
  @IsNumber()
  @IsOptional()
  THROTTLE_TTL?: number

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT?: number

  // Metrics
  @IsBoolean()
  @IsOptional()
  METRICS_ENABLED?: boolean
}

/**
 * Validate environment variables
 *
 * @param config - Raw environment variables
 * @returns Validated configuration
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
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
