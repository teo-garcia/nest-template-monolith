import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  appName: process.env.APP_NAME || 'NestJS Monolith Template',
  apiVersion: process.env.API_VERSION || '1',

  // Database
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number.parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    name: process.env.DATABASE_NAME || 'nest_monolith',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
    expiration: process.env.JWT_EXPIRATION || '1d',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // Redis Cache (Optional)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    ttl: Number.parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  // Swagger Documentation
  swagger: {
    title: process.env.SWAGGER_TITLE || 'NestJS Monolith API',
    description:
      process.env.SWAGGER_DESCRIPTION ||
      'API Documentation for NestJS Monolith Template',
    version: process.env.SWAGGER_VERSION || '1.0',
    path: process.env.SWAGGER_PATH || 'docs',
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
}));
