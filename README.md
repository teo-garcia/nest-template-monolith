# NestJS Monolith Template

A comprehensive template for building scalable monolithic applications with
NestJS. This template provides a production-ready foundation with PostgreSQL
database, Redis cache, and automated development setup.

## Features

- **Database**: PostgreSQL with Prisma ORM and data models for Users and Books
- **Caching**: Redis for performance optimization
- **Architecture**: Clean, modular structure with best practices
- **API**: Built-in Swagger documentation and validation
- **Authentication**: JWT-based auth with role-based access control
- **Logging & Error Handling**: Comprehensive system included
- **Testing**: Complete Jest setup for all test types
- **DevOps**: Docker-based development with automated scripts
- **Deployment**: CI/CD configuration included

## Quick Setup

### Prerequisites

- Docker and Docker Compose
- Node.js (v22+) and pnpm (v9+)

### One-Command Setup

```bash
# Complete setup from scratch (database, Redis, app)
./scripts/dev/setup.sh --clean-all --init-db --force
```

### Start Development Server

```bash
# Start the application in development mode
pnpm start:dev
```

## 📚 Documentation

For detailed information, see the documentation in the `docs/` folder:

- **[01_DESIGN.md](./docs/01_DESIGN.md)** - Architecture and design principles
- **[02_DEVELOPMENT.md](./docs/02_DEVELOPMENT.md)** - Development workflow
- **[03_TESTING.md](./docs/03_TESTING.md)** - Testing strategy
- **[04_DEPLOYMENT.md](./docs/04_DEPLOYMENT.md)** - Deployment guidelines
- **[05_OPERATIONAL_SCRIPTS.md](./docs/05_OPERATIONAL_SCRIPTS.md)** - **Complete
  scripts reference** 📋
- **[06_DATA_MODELS.md](./docs/06_DATA_MODELS.md)** - Database models

> **📋 All script documentation is centralized in
> [05_OPERATIONAL_SCRIPTS.md](./docs/05_OPERATIONAL_SCRIPTS.md)** This is the
> single source of truth for all operational scripts usage, options, and
> workflows.

## 🚀 Scalability

This template is designed to scale from **starter apps to robust enterprise
applications**:

- **Modular Architecture**: Add features without breaking existing code
- **Docker Containerization**: Easy horizontal scaling
- **Database Migrations**: Versioned schema evolution
- **Caching Layer**: Redis for performance optimization
- **Monitoring Ready**: Structured logging and health checks
- **Type Safety**: TypeScript prevents runtime errors at scale

## 🛠️ Scripts Overview

All operational scripts are located in `scripts/` and organized by purpose:

```
scripts/
├── dev/           # 🛠️ Development workflow automation
├── docker/        # 🐳 Docker container management
└── db/            # 🗄️ Database operations
```

**Most common commands:**

```bash
# Complete setup (new developers)
./scripts/dev/setup.sh --clean-all --init-db --force

# Daily workflow
./scripts/dev/start.sh          # Start services
./scripts/dev/stop.sh           # Stop services

# Database operations
./scripts/db/migrate.sh dev add_feature  # Create migration
./scripts/db/backup.sh                   # Create backup
```

**📖 For complete script documentation, see
[docs/05_OPERATIONAL_SCRIPTS.md](./docs/05_OPERATIONAL_SCRIPTS.md)**
