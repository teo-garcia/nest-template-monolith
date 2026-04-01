<div align="center">

# NestJS Template Monolith

**Production-ready NestJS monolith with Prisma, Redis caching, health checks,
and metrics**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-24+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-10+-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
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
| **Code Quality**  | ESLint, Prettier, Husky, commitlint                   |
| **DevOps**        | Docker, GitHub Actions CI/CD                          |

---

## Requirements

- Node.js 24+
- pnpm 10+
- Docker and Docker Compose
- PostgreSQL
- Redis

---

## Quick Start

Clone the template, install dependencies, copy `.env.example` to `.env`, start
infrastructure with Docker Compose, run database migrations, and start the dev
server on port 3000.

---

## Scripts

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `pnpm dev`         | Start with hot reload          |
| `pnpm build`       | Create production build        |
| `pnpm start:prod`  | Run production server          |
| `pnpm test`        | Run unit tests                 |
| `pnpm test:e2e`    | Run E2E tests                  |
| `pnpm test:cov`    | Run tests with coverage        |
| `pnpm lint:es`     | Lint and fix with ESLint       |
| `pnpm lint:ts`     | TypeScript type checking       |
| `pnpm format`      | Format with Prettier           |
| `pnpm db:migrate`  | Run database migrations        |
| `pnpm db:generate` | Generate Prisma client         |
| `pnpm db:studio`   | Open Prisma Studio             |
| `pnpm db:deploy`   | Deploy migrations (production) |

---

## Health and Observability

| Endpoint            | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `GET /health/live`  | Liveness probe                                       |
| `GET /health/ready` | Readiness probe (checks Redis + DB)                  |
| `GET /health`       | Full health summary with memory metrics              |
| `GET /metrics`      | Prometheus metrics (request count, duration, memory) |

Structured JSON logs via Winston with daily rotation and request ID tracking.

---

## Environment Variables

| Variable       | Description                  | Default     |
| -------------- | ---------------------------- | ----------- |
| `PORT`         | Application port             | `3000`      |
| `DATABASE_URL` | PostgreSQL connection string | Required    |
| `REDIS_HOST`   | Redis server host            | `localhost` |
| `REDIS_PORT`   | Redis server port            | `6379`      |
| `LOG_LEVEL`    | Logging verbosity            | `debug`     |

See `.env.example` for the full list.

---

## Shared Configs

| Package                              | Role                |
| ------------------------------------ | ------------------- |
| `@teo-garcia/eslint-config-shared`   | ESLint rules        |
| `@teo-garcia/prettier-config-shared` | Prettier formatting |
| `@teo-garcia/tsconfig-shared`        | TypeScript settings |

---

## Related Templates

| Template                     | Description                 |
| ---------------------------- | --------------------------- |
| `nest-template-microservice` | NestJS event-driven service |
| `react-template-next`        | Next.js frontend            |
| `react-template-rr`          | React Router SPA            |
| `fastapi-template-monolith`  | FastAPI equivalent          |

---

## License

MIT

---

<div align="center">
  <sub>Built by <a href="https://github.com/teo-garcia">teo-garcia</a></sub>
</div>
