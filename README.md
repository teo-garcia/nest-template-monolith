# NestJS Monolith Template

Production-ready NestJS monolith with health checks, metrics, structured
logging, and comprehensive DevOps tooling.

## Requirements

- Node 22+
- pnpm 9
- Docker & Docker Compose

## Installation

1. Get the template:

```bash
npx degit teo-garcia/templates/nest-template-monolith my-app
cd my-app
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure environment:

```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start services:

```bash
docker-compose up -d
pnpm db:migrate
pnpm start:dev
```

## Features

- **NestJS** - Progressive Node.js framework
- **Prisma ORM** - Type-safe database access with migrations
- **Health Checks** - `/health`, `/health/live`, `/health/ready` endpoints
- **Prometheus Metrics** - `/metrics` endpoint for monitoring
- **Request Tracing** - Request ID propagation for distributed tracing
- **Structured Logging** - JSON logs with context
- **Docker** - Multi-stage production builds
- **GitHub Actions** - CI/CD with testing and security scanning

## Scripts

```bash
pnpm start:dev      # Development with hot reload
pnpm build          # Production build
pnpm start:prod     # Run production build
pnpm test           # Run unit tests
pnpm test:e2e       # Run e2e tests
pnpm lint:es        # ESLint check
pnpm lint:ts        # TypeScript type check
pnpm format         # Format code with Prettier
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Run database migrations
```

## Docker

```bash
# Development
docker-compose up

# Production build
docker build -f docker/Dockerfile -t my-app .
docker run -p 3000:3000 my-app
```

## Project Structure

```
src/
├── config/              # Environment configuration
├── shared/
│   ├── filters/         # Global exception handling
│   ├── health/          # Health check endpoints
│   ├── interceptors/    # Request/response transformation
│   ├── logger/          # Structured logging
│   ├── metrics/         # Prometheus metrics
│   ├── pipes/           # Input validation
│   └── prisma/          # Database access
└── modules/
    ├── auth/            # Authentication
    └── users/           # User management
```

## Endpoints

- `GET /health` - Comprehensive health status
- `GET /health/live` - Liveness probe (Kubernetes)
- `GET /health/ready` - Readiness probe (checks DB, Redis)
- `GET /metrics` - Prometheus metrics

## License

MIT
