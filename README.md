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

```bash
pnpm install
cp .env.example .env
cp .env.test.example .env.test
docker compose up -d db redis
pnpm db:generate
pnpm db:migrate
pnpm dev
```

The app starts on `http://localhost:3000`. API docs are available at `/docs`
when `DOCS_ENABLED=true`.

---

## Scripts

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `pnpm dev`         | Start with hot reload                  |
| `pnpm build`       | Create production build                |
| `pnpm check`       | Run lint, typecheck, format, and tests |
| `pnpm start:prod`  | Run production server                  |
| `pnpm test`        | Run unit tests                         |
| `pnpm test:e2e`    | Run E2E tests                          |
| `pnpm test:cov`    | Run tests with coverage                |
| `pnpm lint:es`     | Lint and fix with ESLint               |
| `pnpm lint:ts`     | TypeScript type checking               |
| `pnpm format`      | Format with Prettier                   |
| `pnpm db:migrate`  | Run database migrations                |
| `pnpm db:generate` | Generate Prisma client                 |
| `pnpm db:seed`     | Seed deterministic sample data         |
| `pnpm db:studio`   | Open Prisma Studio                     |
| `pnpm db:deploy`   | Deploy migrations (production)         |

---

## Migration Safety

Run Prisma migrations as a pre-deploy step with `pnpm db:deploy` before the new
application version starts. Do not run migrations from application startup,
request handlers, seed scripts, or tests that point at a shared database.

Production migrations must be backward-compatible with the currently running
version. Use expand-contract changes: add nullable columns, new tables, and new
indexes before code depends on them; backfill explicitly when needed; deploy
code that stops reading the old shape; then remove or narrow schema in a later
release.

`pnpm db:deploy` is safe to re-run when there are no pending migrations.
Production rollback is a database backup restore plus compatible code, or a
forward-fix migration. Prisma does not provide a governed production
`db:rollback` command in this template; `pnpm db:reset` is local/test-only.

Avoid destructive one-step migrations, renaming columns without a compatibility
window, adding non-null columns without defaults/backfills, and combining schema
contraction with the first code release that stops using the old shape.

---

## Health and Observability

| Endpoint            | Description                                    |
| ------------------- | ---------------------------------------------- |
| `GET /health/live`  | Liveness probe                                 |
| `GET /health/ready` | Readiness probe (checks Redis + DB)            |
| `GET /health`       | Full dependency health summary                 |
| `GET /metrics`      | Prometheus metrics when `METRICS_ENABLED=true` |

Structured JSON logs via Winston with daily rotation and request ID tracking.

---

## Environment Variables

| Variable             | Description                             | Default     |
| -------------------- | --------------------------------------- | ----------- |
| `PORT`               | Application port                        | `3000`      |
| `HTTP_PORT`          | Nginx host port in production compose   | `8080`      |
| `API_PREFIX`         | Versioned API route prefix              | `/api/v1`   |
| `DOCS_ENABLED`       | Enables Swagger UI at `/docs`           | env-based   |
| `OPENAPI_SERVER_URL` | Server URL advertised in OpenAPI output | local URL   |
| `DATABASE_URL`       | PostgreSQL connection string            | Required    |
| `DATABASE_POOL_MAX`  | Maximum PostgreSQL pool size            | `10`        |
| `REDIS_HOST`         | Redis server host                       | `localhost` |
| `REDIS_PORT`         | Redis server port                       | `6379`      |
| `METRICS_ENABLED`    | Enables `/metrics` and metric recording | `true`      |
| `LOG_LEVEL`          | Logging verbosity                       | `debug`     |

See `.env.example` for the full list.

### Environment Promotion

Use `.env.example` as the complete variable inventory, then review values before
promoting beyond local development:

- Set `NODE_ENV=production`, `LOG_LEVEL=info`, and `LOG_OUTPUT=json`.
- Set `DOCS_ENABLED=false` unless protected docs are intentionally exposed.
- Replace local Postgres, Redis, and pgAdmin defaults; pgAdmin is local-only.
- Set `CORS_ORIGIN` to the deployed frontend origin. Do not use wildcards.
- Keep `DATABASE_SYNCHRONIZE=false`; production schema changes go through
  `pnpm db:deploy`.
- Use `docker-compose.prod.yml` for a production-like local smoke test:
  `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build`.
  Nginx is the public entry point on `HTTP_PORT`; the app, Postgres, and Redis
  ports are internal to the Compose network.

---

## Project Structure

| Path                  | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `src/modules/tasks/`  | Sample tasks domain with controllers and services    |
| `src/shared/health/`  | Health checks and readiness probes                   |
| `src/shared/metrics/` | Prometheus instrumentation                           |
| `src/config/`         | Environment, Swagger, logger, and application config |
| `prisma/`             | Prisma schema, migrations, and seed data             |
| `test/`               | E2E coverage                                         |
| `docker/`             | Development and production container files           |

---

## Shared Configs

| Package                              | Role                |
| ------------------------------------ | ------------------- |
| `@teo-garcia/eslint-config-shared`   | ESLint rules        |
| `@teo-garcia/prettier-config-shared` | Prettier formatting |
| `@teo-garcia/tsconfig-shared`        | TypeScript settings |

---

## Shared Governance

| Area               | Tooling                                             |
| ------------------ | --------------------------------------------------- |
| Dependency updates | Renovate                                            |
| Issue intake       | GitHub issue templates                              |
| Change review      | Pull request template                               |
| CI                 | GitHub Actions for lint, typecheck, build, and test |
| Security           | Trivy, dependency review, `pnpm audit`              |

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
