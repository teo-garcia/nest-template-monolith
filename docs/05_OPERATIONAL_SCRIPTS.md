# Operational Scripts - Complete Reference

This document is the **single source of truth** for all operational scripts in
this project. All script-specific README files should be removed in favor of
this centralized documentation.

## 🎯 Quick Start

**New to the project?** Run this one command:

```bash
./scripts/dev/setup.sh --clean-all --init-db --force
```

**Daily development workflow:**

```bash
# Start your day
./scripts/dev/start.sh

# Work on your code, create migrations as needed
./scripts/db/migrate.sh dev add_new_feature

# End your day
./scripts/dev/stop.sh
```

## 📋 Prerequisites

Before using any scripts, ensure you have:

1. **Docker & Docker Compose** - Must be running
2. **Node.js v22+** and **pnpm v9+** - For application development
3. **Basic shell knowledge** - Understanding of terminal commands

**Check prerequisites:**

```bash
docker --version && docker info
node --version && pnpm --version
```

## 🏗️ Architecture Overview

This template uses a **hybrid development approach**:

- **Application (NestJS)**: Runs locally for better DX (hot reload, debugging)
- **Services (PostgreSQL, Redis)**: Run in Docker for consistency

**Ports used:**

- `3000` - NestJS Application
- `5432` - PostgreSQL Database
- `6379` - Redis Cache
- `5050` - pgAdmin UI

## 📁 Scripts Organization

```
scripts/
├── dev/           # 🛠️ Development workflow automation
│   ├── setup.sh   # Complete environment setup
│   ├── start.sh   # Start development services
│   ├── stop.sh    # Stop development services
│   ├── reset.sh   # Reset environment completely
│   └── env-setup.sh # Environment variables setup
├── docker/        # 🐳 Docker container management
│   ├── docker.sh  # Unified Docker operations
│   └── prune.sh   # Docker cleanup
└── db/            # 🗄️ Database operations
    ├── init-db.sh # Database initialization
    ├── migrate.sh # Migration management
    ├── backup.sh  # Database backups
    └── restore.sh # Database restoration
```

---

## 🛠️ Development Scripts (`scripts/dev/`)

### `setup.sh` - Complete Environment Setup

**Purpose**: One-command setup for new developers or clean environment reset.

**Usage:**

```bash
./scripts/dev/setup.sh [options]
```

**Options:**

- `--clean-all` - Remove all Docker resources before setup
- `--init-db` - Initialize database from zero with proper users/permissions
- `--force` - Skip all confirmation prompts
- `--skip-deps` - Skip `pnpm install`
- `--skip-db` - Skip Docker/database setup
- `--skip-prisma` - Skip Prisma client generation
- `--skip-env` - Skip environment file creation

**What it does:**

1. Cleans Docker resources (if `--clean-all`)
2. Installs dependencies with pnpm
3. Creates `.env` file with defaults
4. Starts Docker services (PostgreSQL, Redis, pgAdmin)
5. Initializes database with proper users (if `--init-db`)
6. Generates Prisma client
7. Runs database migrations

**Examples:**

```bash
# Complete fresh setup (recommended for new developers)
./scripts/dev/setup.sh --clean-all --init-db --force

# Setup without touching existing database
./scripts/dev/setup.sh --skip-db --skip-prisma

# Reset everything and start fresh
./scripts/dev/setup.sh --clean-all --init-db --force
```

### `start.sh` - Start Development Services

**Purpose**: Start Docker services for daily development.

**Usage:**

```bash
./scripts/dev/start.sh [options]
```

**Options:**

- `--rebuild` - Rebuild Docker containers before starting

**What it does:**

- Starts PostgreSQL, Redis, and pgAdmin containers
- Waits for services to be healthy
- Shows connection information

**Note**: This only starts background services. Run `pnpm start:dev` separately
for the NestJS app.

### `stop.sh` - Stop Development Services

**Purpose**: Clean shutdown of all Docker services.

**Usage:**

```bash
./scripts/dev/stop.sh [options]
```

**Options:**

- `--remove` - Remove containers after stopping

### `reset.sh` - Complete Environment Reset

**Purpose**: Nuclear option - reset everything to clean state.

**Usage:**

```bash
./scripts/dev/reset.sh [options]
```

**Options:**

- `--force` - Skip confirmation (DANGEROUS)
- `--remove-deps` - Also remove `node_modules`
- `--remove-env` - Also remove `.env` file

**What it does:**

1. Stops and removes all Docker containers
2. Removes Docker volumes and networks
3. Optionally removes `node_modules` and `.env`

**⚠️ WARNING**: This is destructive and will delete all local data.

### `env-setup.sh` - Environment Configuration

**Purpose**: Create and manage `.env` file.

**Usage:**

```bash
./scripts/dev/env-setup.sh [options]
```

**Options:**

- `--force` - Overwrite existing `.env`
- `--source <file>` - Use custom source file instead of `.env.sample`

---

## 🐳 Docker Scripts (`scripts/docker/`)

### `docker.sh` - Unified Docker Management

**Purpose**: Single script for all Docker operations.

**Usage:**

```bash
./scripts/docker/docker.sh <command> [options] [service-name]
```

**Commands:**

- `start` - Start containers
- `stop` - Stop containers
- `restart` - Restart containers
- `logs` - View container logs
- `shell` - Open shell in container
- `help` - Show detailed help

**Global Options:**

- `service-name` - Target specific service (optional)

**Start/Restart Options:**

- `-d, --detach` - Run in background
- `-r, --rebuild` - Rebuild before starting
- `-c, --clean` - Remove existing containers first

**Stop Options:**

- `--remove` - Remove containers after stopping

**Logs Options:**

- `-f, --follow` - Follow logs in real-time
- `-t, --timestamps` - Show timestamps
- `-n, --lines <num>` - Number of lines to show (default: 100)

**Examples:**

```bash
# Start all services in background
./scripts/docker/docker.sh start -d

# Follow logs for database service
./scripts/docker/docker.sh logs -f db

# Open shell in database container
./scripts/docker/docker.sh shell db

# Restart with rebuild
./scripts/docker/docker.sh restart -r

# Stop and remove specific service
./scripts/docker/docker.sh stop --remove redis
```

### `prune.sh` - Docker Cleanup

**Purpose**: Clean up Docker resources to free disk space.

**Usage:**

```bash
./scripts/docker/prune.sh [options]
```

**Options:**

- `--force` - Skip confirmation prompts
- `--all` - Remove ALL unused data including volumes (DANGEROUS)
- `--project-only` - Only clean this project's resources (SAFE)

**Examples:**

```bash
# Safe cleanup - only this project
./scripts/docker/prune.sh --project-only

# Full cleanup with confirmation
./scripts/docker/prune.sh

# Nuclear option - remove everything (DANGEROUS)
./scripts/docker/prune.sh --all --force
```

---

## 🗄️ Database Scripts (`scripts/db/`)

### `init-db.sh` - Database Initialization

**Purpose**: One-time database setup with proper users and permissions.

**Usage:**

```bash
./scripts/db/init-db.sh [options]
```

**Options:**

- `--force` - Skip confirmation (DANGEROUS)
- `--no-redis` - Skip Redis setup

**What it does:**

1. Ensures PostgreSQL container is running
2. Creates main database (`nest_monolith`)
3. Creates application user with limited permissions
4. Creates shadow database for Prisma migrations
5. Sets up `uuid-ossp` extension
6. Updates `.env` with proper connection strings
7. Configures Redis with password

**⚠️ WARNING**: This will reset your database and lose all data.

### `migrate.sh` - Migration Management

**Purpose**: Wrapper for Prisma migrations with enhanced functionality.

**Usage:**

```bash
./scripts/db/migrate.sh <command> [options] [migration-name]
```

**Commands:**

- `dev <name>` - Create and apply new migration (development)
- `deploy` - Apply pending migrations (production)
- `reset` - Reset database and reapply all migrations (DANGEROUS)
- `status` - Show migration status

**Dev Options:**

- `--dry-run` - Create migration files without applying
- `--skip-gen` - Skip Prisma client generation

**Examples:**

```bash
# Create new migration during development
./scripts/db/migrate.sh dev add_user_roles

# Apply all pending migrations
./scripts/db/migrate.sh deploy

# Check migration status
./scripts/db/migrate.sh status

# Reset database (DANGEROUS)
./scripts/db/migrate.sh reset
```

### `backup.sh` - Database Backup

**Purpose**: Create compressed database backups.

**Usage:**

```bash
./scripts/db/backup.sh [options] [backup-name]
```

**Options:**

- `--list` - List existing backups
- `--directory <path>` - Custom backup directory (default: `./backups`)

**Arguments:**

- `backup-name` - Custom name (optional, defaults to timestamp)

**Examples:**

```bash
# Create timestamped backup
./scripts/db/backup.sh

# Create named backup
./scripts/db/backup.sh before_major_changes

# List existing backups
./scripts/db/backup.sh --list

# Backup to custom directory
./scripts/db/backup.sh --directory /mnt/backups production_snapshot
```

### `restore.sh` - Database Restoration

**Purpose**: Restore database from backup file.

**Usage:**

```bash
./scripts/db/restore.sh [options] <backup-file>
```

**Options:**

- `--list` - List available backup files
- `--directory <path>` - Custom backup directory
- `--force` - Skip confirmation (EXTREMELY DANGEROUS)

**⚠️ WARNING**: This will completely replace your current database.

**Examples:**

```bash
# List available backups
./scripts/db/restore.sh --list

# Restore from specific backup
./scripts/db/restore.sh 20231115_103000.sql.gz

# Restore from custom directory
./scripts/db/restore.sh --directory /mnt/backups production_snapshot.sql.gz
```

---

## 🔄 Common Workflows

### New Developer Onboarding

```bash
# 1. Clone repository
git clone <repo-url>
cd nest-template-monolith

# 2. One-command setup
./scripts/dev/setup.sh --clean-all --init-db --force

# 3. Start development
pnpm start:dev
```

### Daily Development

```bash
# Start your day
./scripts/dev/start.sh

# Make schema changes, then create migration
./scripts/db/migrate.sh dev add_new_feature

# View logs if issues arise
./scripts/docker/docker.sh logs -f

# End your day
./scripts/dev/stop.sh
```

### Before Major Changes

```bash
# Create backup
./scripts/db/backup.sh before_feature_x

# Make changes...

# If something goes wrong, restore
./scripts/db/restore.sh before_feature_x.sql.gz
```

### Environment Issues

```bash
# Reset everything
./scripts/dev/reset.sh --force --remove-deps --remove-env

# Fresh setup
./scripts/dev/setup.sh --clean-all --init-db --force
```

### Docker Issues

```bash
# Clean up Docker resources
./scripts/docker/prune.sh --project-only --force

# Restart with rebuild
./scripts/docker/docker.sh restart -r
```

---

## 🚨 Troubleshooting

### Port Conflicts

If ports 3000, 5432, 6379, or 5050 are in use:

```bash
# Find what's using the ports
lsof -i :3000 :5432 :6379 :5050

# Kill processes
kill -9 $(lsof -ti:3000)

# Or modify .env to use different ports
PORT=3001
DATABASE_PORT=5433
REDIS_PORT=6380
PGADMIN_PORT=5051
```

### Docker Issues

```bash
# Check Docker is running
docker info

# Restart Docker daemon
# macOS: Restart Docker Desktop
# Linux: sudo systemctl restart docker

# Clean slate
./scripts/docker/prune.sh --all --force
```

### Database Connection Issues

```bash
# Check database is running
./scripts/docker/docker.sh logs db

# Reinitialize database
./scripts/db/init-db.sh --force

# Check connection string in .env
cat .env | grep DATABASE_URL
```

### Permission Issues

```bash
# Make scripts executable
chmod +x scripts/**/*.sh

# Fix ownership (if needed)
sudo chown -R $USER:$USER .
```

---

## 📝 Script Development Guidelines

When creating new scripts:

1. **Use the existing patterns** - Follow the structure of existing scripts
2. **Add help functions** - Every script should have `--help`
3. **Include error handling** - Use `set -e` and proper error messages
4. **Document in this file** - Don't create separate READMEs
5. **Test thoroughly** - Test with different options and edge cases

**Script template:**

```bash
#!/bin/bash
set -e

function show_help {
  echo "Usage: $0 [options]"
  echo "Description of what this script does"
  # ... help content
}

# Parse options
while (( "$#" )); do
  case "$1" in
    -h|--help) show_help ;;
    # ... other options
  esac
done

# Main script logic
echo "→ Doing something..."
# ... implementation
echo "✓ Done!"
```

This documentation is the authoritative source for all script usage. Individual
script README files should be removed to avoid duplication and inconsistency.
