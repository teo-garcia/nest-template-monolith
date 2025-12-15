#!/bin/bash

# Database initialization script for nest-template-monolith
# Creates the application database user and sets up permissions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  echo "Please copy .env.sample to .env and configure it"
  exit 1
fi

# Source .env file
set -a
source .env
set +a

# Set defaults
DB_USER=${DATABASE_USER:-postgres}
DB_PASSWORD=${DATABASE_PASSWORD:-postgres}
DB_NAME=${DATABASE_NAME:-nest_monolith}
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5433}
APP_USER=${APP_DATABASE_USER:-app_user}
APP_PASSWORD=${APP_DATABASE_PASSWORD:-app_password}

echo -e "${YELLOW}=== Database Initialization ===${NC}"
echo "Creating application user: $APP_USER"
echo "Database: $DB_NAME"
echo ""

# Check if Docker container is running
if ! docker ps | grep -q "nest_monolith_db"; then
  echo -e "${RED}Error: PostgreSQL container (nest_monolith_db) is not running${NC}"
  echo "Please start it with: docker-compose up -d db"
  exit 1
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec nest_monolith_db pg_isready -U $DB_USER > /dev/null 2>&1; do
  echo "  Waiting..."
  sleep 1
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Create application user and set up permissions
echo "Creating application user and setting up permissions..."
docker exec nest_monolith_db psql -U $DB_USER -c "
DO \$\$
BEGIN
  -- Create extension if not exists
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

  -- Drop app user if exists (for clean reinstall)
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_USER') THEN
    DROP ROLE $APP_USER;
  END IF;

  -- Create app user
  CREATE USER $APP_USER WITH PASSWORD '$APP_PASSWORD';

  -- Create database if not exists
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
    CREATE DATABASE $DB_NAME;
  END IF;

  -- Grant privileges to app user
  GRANT CONNECT ON DATABASE $DB_NAME TO $APP_USER;
END \$\$;
" || {
  echo -e "${RED}Error: Failed to create application user${NC}"
  exit 1
}

# Set up application user permissions on the database
docker exec nest_monolith_db psql -U $DB_USER -d $DB_NAME -c "
  -- Grant schema permissions
  GRANT USAGE, CREATE ON SCHEMA public TO $APP_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $APP_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO $APP_USER;

  -- Grant permissions on existing tables (if any)
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $APP_USER;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;

  -- Grant additional permissions needed for Prisma migrations
  ALTER USER $APP_USER WITH CREATEDB;
  GRANT ALL PRIVILEGES ON SCHEMA public TO $APP_USER;
" || {
  echo -e "${RED}Error: Failed to set up permissions${NC}"
  exit 1
}

echo -e "${GREEN}✓ Database initialization complete${NC}"
echo ""
echo "You can now run migrations with: pnpm db:migrate"
