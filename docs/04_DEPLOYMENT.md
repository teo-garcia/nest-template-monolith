# Deployment Guidelines

## Overview

This document provides guidelines for deploying the NestJS monolith application to various environments. The deployment strategy is designed to be flexible, allowing for deployment to traditional servers, containers, or cloud platforms.

## Prerequisites

Before deployment, ensure you have:

1. Node.js (v18+) installed on the target server
2. Database server (PostgreSQL recommended)
3. Environment variables properly configured
4. SSL certificate for production

## Deployment Options

### Traditional Server Deployment

#### Step 1: Prepare the Application

```bash
# Clone the repository
git clone <repository-url>
cd <project-folder>

# Install production dependencies
npm ci --only=production

# Build the application
npm run build
```

#### Step 2: Configure Environment

Create a `.env` file in the root directory with the following variables:

```
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=username
DATABASE_PASSWORD=password
DATABASE_NAME=database_name

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1d
```

#### Step 3: Run the Application

For direct execution:

```bash
npm run start:prod
```

For running with process manager (recommended):

```bash
# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start dist/main.js --name "nest-app"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
```

### Docker Deployment

#### Step 1: Build Docker Image

```bash
# Build the Docker image
docker build -t nest-app:latest .

# Run the container
docker run -p 3000:3000 --env-file .env -d nest-app:latest
```

#### Step 2: Docker Compose (Optional)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    env_file:
      - .env
    depends_on:
      - postgres
    restart: always

  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres_data:
```

Run with Docker Compose:

```bash
docker-compose up -d
```

### Cloud Deployments

#### AWS Elastic Beanstalk

1. Install the EB CLI:

   ```bash
   pip install awsebcli
   ```

2. Initialize EB project:

   ```bash
   eb init
   ```

3. Create an environment:

   ```bash
   eb create production
   ```

4. Deploy:
   ```bash
   eb deploy
   ```

#### Heroku

1. Install Heroku CLI:

   ```bash
   npm install -g heroku
   ```

2. Login to Heroku:

   ```bash
   heroku login
   ```

3. Create a Heroku app:

   ```bash
   heroku create
   ```

4. Add PostgreSQL addon:

   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

5. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

## Continuous Integration/Continuous Deployment (CI/CD)

### GitHub Actions

Create a file at `.github/workflows/main.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm run test
      - name: E2E Tests
        run: npm run test:e2e

  deploy:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        # Add your deployment steps here
        run: echo "Deploying to production"
```

## Database Migrations

Before deployment, ensure all database migrations are applied:

```bash
# Generate a new migration (if needed)
npm run migration:generate -- -n DeploymentMigration

# Run migrations
npm run migration:run
```

## Monitoring & Logging

### Application Monitoring

1. Use PM2 for basic monitoring:

   ```bash
   pm2 monit
   ```

2. For advanced monitoring, consider:
   - New Relic
   - Datadog
   - AppSignal

### Logging

1. Configure a logging service like Winston to send logs to:
   - Elasticsearch
   - Logstash
   - CloudWatch
   - Loggly

Example Winston configuration:

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const app = await NestFactory.create(AppModule, {
  logger: WinstonModule.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  }),
});
```

## SSL/TLS Configuration

For production, enable HTTPS:

```typescript
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('path/to/private-key.pem'),
    cert: fs.readFileSync('path/to/public-certificate.pem'),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  await app.listen(3000);
}
```

## Health Checks

Implement health checks for monitoring tools:

```typescript
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class AppModule {}
```

## Backup Strategy

1. Regular database backups:

   ```bash
   pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql
   ```

2. Store backups in a secure location:
   - Amazon S3
   - Google Cloud Storage
   - Azure Blob Storage

## Rollback Strategy

1. Keep multiple versions of the application deployed
2. Implement feature flags for new functionality
3. Use database migrations that support rollback
4. Document rollback procedures for each deployment

## Security Considerations

1. Keep dependencies updated:

   ```bash
   npm audit fix
   ```

2. Use environment variables for sensitive information
3. Implement rate limiting:

   ```typescript
   import { APP_GUARD } from '@nestjs/core';
   import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

   @Module({
     imports: [
       ThrottlerModule.forRoot({
         ttl: 60,
         limit: 10,
       }),
     ],
     providers: [
       {
         provide: APP_GUARD,
         useClass: ThrottlerGuard,
       },
     ],
   })
   export class AppModule {}
   ```

4. Implement proper CORS settings:

   ```typescript
   const app = await NestFactory.create(AppModule);
   app.enableCors({
     origin: ['https://yourdomain.com'],
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     credentials: true,
   });
   ```

5. Set security headers:

   ```typescript
   import * as helmet from 'helmet';

   const app = await NestFactory.create(AppModule);
   app.use(helmet());
   ```
