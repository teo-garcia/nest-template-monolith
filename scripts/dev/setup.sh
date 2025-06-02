#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/dev/setup.sh [options]"
  echo ""
  echo "Set up the development environment from scratch."
  echo ""
  echo "Options:"
  echo "  -h, --help       Show this help message"
  echo "  -s, --skip-deps  Skip installing dependencies"
  echo "  -d, --skip-db    Skip database setup"
  echo "  -p, --skip-prisma Skip Prisma setup"
  echo "  -e, --skip-env   Skip environment setup"
  echo "  -f, --force      Force setup without confirmation"
  echo "  --init-db        Initialize database from zero state (create users, permissions)"
  echo "  --clean-all      Clean up all Docker resources before setup"
  echo ""
  exit 0
}

# Parse command line options
SKIP_DEPS=""
SKIP_DB=""
SKIP_PRISMA=""
SKIP_ENV=""
FORCE=""
INIT_DB=""
CLEAN_ALL=""

while (( "$#" )); do
  case "$1" in
    -h|--help)
      show_help
      ;;
    -s|--skip-deps)
      SKIP_DEPS="true"
      shift
      ;;
    -d|--skip-db)
      SKIP_DB="true"
      shift
      ;;
    -p|--skip-prisma)
      SKIP_PRISMA="true"
      shift
      ;;
    -e|--skip-env)
      SKIP_ENV="true"
      shift
      ;;
    -f|--force)
      FORCE="true"
      shift
      ;;
    --init-db)
      INIT_DB="true"
      shift
      ;;
    --clean-all)
      CLEAN_ALL="true"
      shift
      ;;
    -*|--*=)
      echo "Error: Unsupported flag $1" >&2
      echo "Use -h or --help for usage information"
      exit 1
      ;;
    *)
      shift
      ;;
  esac
done

# Show warning and ask for confirmation
if [ -z "$FORCE" ]; then
  echo "=== Development Environment Setup ==="
  echo "This script will set up your development environment."
  echo "It may overwrite existing configuration. Make sure you have:"
  echo "  1. Docker and Docker daemon running"
  echo "  2. Node.js and pnpm installed"
  echo ""
  echo "This setup will run Node.js locally and services (DB, Redis) in Docker."
  echo ""
  
  read -p "Continue? (y/N) " response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Setup cancelled."
    exit 0
  fi
fi

echo "=== Setting Up Development Environment ==="

# Step 0: Clean up everything if requested
if [ -n "$CLEAN_ALL" ]; then
  echo "→ Cleaning up all Docker resources before setup"
  if [ -f ./scripts/docker/prune.sh ]; then
    ./scripts/docker/prune.sh --project-only --force
  else
    # Fallback if script doesn't exist
    echo "→ scripts/docker/prune.sh not found, attempting direct docker-compose down -v"
    docker-compose down -v --remove-orphans
    echo "✓ Project Docker resources cleaned up (fallback)"
  fi
fi

# Step 1: Install dependencies
if [ -z "$SKIP_DEPS" ]; then
  echo "→ Installing dependencies with pnpm"
  
  # Check if pnpm is available
  if command -v pnpm &> /dev/null; then
    pnpm install
  else
    echo "⚠️ pnpm is not installed. Please install it:"
    echo "npm install -g pnpm"
    exit 1
  fi
else
  echo "→ Skipping dependencies installation"
fi

# Step 2: Set up environment file
if [ -z "$SKIP_ENV" ]; then
  # Check if env-setup.sh exists
  if [ -f ./scripts/dev/env-setup.sh ]; then
    echo "→ Setting up environment variables"
    # Use force flag if passed to this script
    ENV_FORCE=""
    if [ -n "$FORCE" ]; then
      ENV_FORCE="--force"
    fi
    ./scripts/dev/env-setup.sh $ENV_FORCE
  else
    echo "→ Environment setup script not found, creating basic .env file"
    # Only create if .env doesn't exist or force is enabled
    if [ ! -f .env ] || [ -n "$FORCE" ]; then
      cat > .env << EOL
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nest_monolith?schema=public
SHADOW_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nest_monolith_shadow?schema=public
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nest_monolith
DATABASE_HOST=localhost
DATABASE_PORT=5432
APP_DATABASE_USER=app_user
APP_DATABASE_PASSWORD=app_password
EOL
      echo "✓ Basic .env file created"
    else
      echo "→ .env file already exists"
    fi
  fi
else
  echo "→ Skipping environment setup"
fi

# Step 3: Start Docker containers and initialize database if needed
if [ -z "$SKIP_DB" ]; then
  # Check if Docker is running
  if ! docker info > /dev/null 2>&1; then
    echo "⚠️ Docker daemon is not running. Please start Docker and try again."
    exit 1
  fi

  # Initialize database from zero state if requested
  if [ -n "$INIT_DB" ]; then
    echo "→ Initializing database from zero state"
    if [ -f ./scripts/db/init-db.sh ]; then
      # Use force flag if passed to this script
      DB_INIT_FORCE=""
      if [ -n "$FORCE" ]; then
        DB_INIT_FORCE="--force"
      fi
      ./scripts/db/init-db.sh $DB_INIT_FORCE
    else
      echo "⚠️ Database initialization script ./scripts/db/init-db.sh not found"
      echo "→ Starting Docker containers without full database initialization sequence."
      if [ -f ./scripts/docker/docker.sh ]; then
        ./scripts/docker/docker.sh start -d
      else
        # Fallback if the script doesn't exist
        echo "→ scripts/docker/docker.sh not found, attempting direct docker-compose up -d"
        docker-compose up -d
      fi
    fi
  else
    echo "→ Starting Docker containers (without --init-db flag)"
    if [ -f ./scripts/docker/docker.sh ]; then
      ./scripts/docker/docker.sh start -d
    else
      # Fallback if the script doesn't exist
      echo "→ scripts/docker/docker.sh not found, attempting direct docker-compose up -d"
      docker-compose up -d
    fi
  fi
else
  echo "→ Skipping Docker container startup"
fi

# Step 4: Initialize Prisma
if [ -z "$SKIP_PRISMA" ]; then
  # Create prisma directory if it doesn't exist
  if [ ! -d prisma ]; then
    echo "→ Initializing Prisma"
    mkdir -p prisma
    
    # Create initial schema.prisma file if it doesn't exist
    if [ ! -f prisma/schema.prisma ]; then
      echo "→ Creating initial Prisma schema"
      cat > prisma/schema.prisma << EOL
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Define your models here

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
EOL
    fi
    
    # Generate Prisma client
    echo "→ Generating Prisma client"
    npx prisma generate
  else
    echo "→ Generating Prisma client"
    npx prisma generate
  fi
else
  echo "→ Skipping Prisma setup"
fi

# Step 5: Run initial database migration if needed
if [ -z "$SKIP_DB" ] && [ -z "$SKIP_PRISMA" ]; then
  # Check if migrations directory is empty or doesn't exist
  echo "→ Checking for existing migrations..."
  if [ ! -d prisma/migrations ] || [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "→ No existing migrations found. Creating initial database migration via script."
    if [ -f ./scripts/db/migrate.sh ]; then
      ./scripts/db/migrate.sh dev init
    else
      echo "⚠️ ./scripts/db/migrate.sh not found. Attempting direct Prisma command."
      npx prisma migrate dev --name init
    fi
  else
    echo "→ Existing migrations found. Applying them via script."
    if [ -f ./scripts/db/migrate.sh ]; then
      ./scripts/db/migrate.sh deploy
    else
      echo "⚠️ ./scripts/db/migrate.sh not found. Attempting direct Prisma command."
      npx prisma migrate deploy
    fi
  fi
fi

echo "✓ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review the .env file and update any configuration"
echo "  2. Run the development server with: pnpm start:dev"
echo "  3. Access the application at: http://localhost:3000" 