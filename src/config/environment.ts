import { registerAs } from '@nestjs/config'

/**
 * Environment Configuration
 *
 * Centralizes all environment variables for the monolith.
 * This configuration is designed to work across different deployment environments.
 */
export default registerAs('config', () => ({
  // Application Settings
  app: {
    env: process.env.NODE_ENV || 'development',
    port: Number.parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api',
    name: process.env.APP_NAME || 'NestJS Monolith Template',
    version: process.env.API_VERSION || '1',
  },

  // Database Configuration
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number.parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    name: process.env.DATABASE_NAME || 'nest_monolith',
    url: process.env.DATABASE_URL,
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
    expiration: process.env.JWT_EXPIRATION || '1d',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // Redis Cache
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    ttl: Number.parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    output: process.env.LOG_OUTPUT || 'console',
  },

  // CORS
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Rate Limiting
  throttle: {
    ttl: Number.parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: Number.parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // Metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false', // Enabled by default
  },
}))
