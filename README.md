<div align="center">

# NestJS Template Monolith

**Production-ready NestJS monolith with Prisma, Redis caching, health checks,
and metrics**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9+-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://prisma.io)

Part of the [@teo-garcia/templates](https://github.com/teo-garcia/templates)
ecosystem

</div>

---

## Features

| Category          | Technologies                                          |
| ----------------- | ----------------------------------------------------- |
| **Framework**     | NestJS 11 with modular architecture                   |
| **Database**      | Prisma ORM with PostgreSQL                            |
| **Cache**         | Redis for caching                                     |
| **Observability** | Health checks, Prometheus metrics, structured logging |
| **Type Safety**   | TypeScript with strict mode                           |
| **Testing**       | Jest for unit and E2E tests                           |
| **Code Quality**  | ESLint, Prettier, Husky, Commitlint                   |
| **DevOps**        | Docker, GitHub Actions CI/CD                          |

## Requirements

- Node.js 22+
- pnpm 9+
- Docker & Docker Compose

## Quick Start

```bash
# Clone the template
npx degit teo-garcia/nest-template-monolith my-api
cd my-api

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env

# Start infrastructure
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development server
pnpm start:dev
```

Open [http://localhost:3000](http://localhost:3000) to see your API.

## Project Structure

```
src/
├── config/                 # Environment configuration with validation
├── modules/
│   └── tasks/              # Example CRUD module
│       ├── dto/            # Data transfer objects
│       ├── tasks.controller.ts
│       ├── tasks.service.ts
│       └── tasks.module.ts
└── shared/
    ├── filters/            # Global exception handling
    ├── health/             # Health check endpoints (DB + Redis)
    ├── interceptors/       # Request/response transformation
    ├── logger/             # Structured logging (Winston)
    ├── metrics/            # Prometheus metrics
    ├── pipes/              # Input validation
    ├── prisma/             # Database client
    └── redis/              # Redis caching service
```

## Example Module: Tasks

The template includes a complete `TasksModule` demonstrating:

- Full CRUD operations with Prisma
- Input validation with class-validator
- Proper error handling (404 for not found)
- Query filtering (by status, priority)

### API Endpoints

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| POST   | `/api/tasks`     | Create a task       |
| GET    | `/api/tasks`     | List all tasks      |
| GET    | `/api/tasks/:id` | Get a specific task |
| PATCH  | `/api/tasks/:id` | Update a task       |
| DELETE | `/api/tasks/:id` | Delete a task       |

### Task Schema

```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(PENDING)
  priority    Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## Scripts

| Command            | Description              |
| ------------------ | ------------------------ |
| `pnpm start:dev`   | Start with hot reload    |
| `pnpm build`       | Create production build  |
| `pnpm start:prod`  | Run production server    |
| `pnpm test`        | Run unit tests           |
| `pnpm test:e2e`    | Run E2E tests            |
| `pnpm lint:es`     | Lint and fix with ESLint |
| `pnpm lint:ts`     | TypeScript type checking |
| `pnpm format`      | Format with Prettier     |
| `pnpm db:migrate`  | Run database migrations  |
| `pnpm db:generate` | Generate Prisma client   |
| `pnpm db:studio`   | Open Prisma Studio       |

## Health & Metrics

| Endpoint            | Description                |
| ------------------- | -------------------------- |
| `GET /health`       | Full health status         |
| `GET /health/live`  | Kubernetes liveness probe  |
| `GET /health/ready` | Kubernetes readiness probe |
| `GET /metrics`      | Prometheus metrics         |

## Configuration

Environment variables are validated at startup. Key configuration:

| Variable         | Description               | Default   |
| ---------------- | ------------------------- | --------- |
| `PORT`           | Application port          | 3000      |
| `DATABASE_URL`   | PostgreSQL connection URL | Required  |
| `REDIS_HOST`     | Redis host                | localhost |
| `REDIS_PORT`     | Redis port                | 6379      |
| `REDIS_PASSWORD` | Redis password            | (none)    |
| `REDIS_TTL`      | Cache TTL in seconds      | 3600      |
| `LOG_LEVEL`      | Logging level             | debug     |

## Shared Configs

This template uses standardized configurations from the ecosystem:

- [`@teo-garcia/eslint-config-shared`](https://github.com/teo-garcia/eslint-config-shared) -
  ESLint rules
- [`@teo-garcia/prettier-config-shared`](https://github.com/teo-garcia/prettier-config-shared) -
  Prettier formatting
- [`@teo-garcia/tsconfig-shared`](https://github.com/teo-garcia/tsconfig-shared) -
  TypeScript settings

## Related Templates

| Template                                                                               | Description                    |
| -------------------------------------------------------------------------------------- | ------------------------------ |
| [nest-template-microservice](https://github.com/teo-garcia/nest-template-microservice) | NestJS microservice with Redis |
| [react-template-next](https://github.com/teo-garcia/react-template-next)               | Next.js frontend               |
| [react-template-rr](https://github.com/teo-garcia/react-template-rr)                   | React Router SPA               |

## License

MIT

---

<div align="center">
  <sub>Built by <a href="https://github.com/teo-garcia">teo-garcia</a></sub>
</div>
