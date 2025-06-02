#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/db/init-db.sh [options]"
  echo ""
  echo "One-time initialization of PostgreSQL database and Redis from zero state."
  echo "Creates database, superuser, application user, and sets up proper permissions."
  echo ""
  echo "Prerequisites:"
  echo "  - Docker and Docker Compose must be installed and running"
  echo "  - .env file must exist with database configuration"
  echo ""
  echo "Options:"
  echo "  -h, --help       Show this help message"
  echo "  -f, --force      Force initialization without confirmation"
  echo "  --no-redis       Skip Redis setup"
  echo ""
  exit 0
}

# Parse command line options
FORCE=""
SKIP_REDIS=""

while (( "$#" )); do
  case "$1" in
    -h|--help)
      show_help
      ;;
    -f|--force)
      FORCE="true"
      shift
      ;;
    --no-redis)
      SKIP_REDIS="true"
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

# Check for .env file
if [ ! -f .env ]; then
  echo "⚠️ .env file not found. Please run ./scripts/dev/env-setup.sh first."
  exit 1
fi

# Source .env file to get environment variables
set -a
source .env
set +a

# Set default values if not defined in .env
DB_USER=${DATABASE_USER:-postgres}
DB_PASSWORD=${DATABASE_PASSWORD:-postgres}
DB_NAME=${DATABASE_NAME:-nest_monolith}
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
APP_USER=${APP_DATABASE_USER:-app_user}
APP_PASSWORD=${APP_DATABASE_PASSWORD:-app_password}
REDIS_PASSWORD=${REDIS_PASSWORD:-""}

# Show warning and ask for confirmation
if [ -z "$FORCE" ]; then
  echo "=== Database Initialization ==="
  echo "This script will initialize the PostgreSQL database and Redis from scratch."
  echo "It will create:"
  echo "  1. Database: $DB_NAME"
  echo "  2. Superuser: $DB_USER"
  echo "  3. Application user: $APP_USER with restricted permissions"
  if [ -z "$SKIP_REDIS" ]; then
    echo "  4. Redis setup with password protection"
  fi
  echo ""
  echo "Prerequisites:"
  echo "  1. Docker and Docker Compose must be installed and running"
  echo "  2. Current user must have permission to execute Docker commands"
  echo ""
  echo "⚠️ WARNING: This will reset any existing database with the same name."
  echo ""
  
  read -p "Continue? (y/N) " response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Initialization cancelled."
    exit 0
  fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "⚠️ Docker daemon is not running. Please start Docker and try again."
  exit 1
fi

echo "=== Initializing Database From Zero State ==="

# Start PostgreSQL container if not running
echo "→ Checking if PostgreSQL container is running"
if ! docker ps | grep -q "nest_monolith_db"; then
  echo "→ Starting PostgreSQL container"
  docker-compose up -d db
  
  # Wait for PostgreSQL to be ready
  echo "→ Waiting for PostgreSQL to be ready"
  sleep 5
  MAX_RETRIES=30
  RETRIES=0
  
  until docker exec nest_monolith_db pg_isready -U postgres > /dev/null 2>&1 || [ $RETRIES -eq $MAX_RETRIES ]; do
    echo "   Waiting for database connection... ($((++RETRIES))/$MAX_RETRIES)"
    sleep 2
  done
  
  if [ $RETRIES -eq $MAX_RETRIES ]; then
    echo "⚠️ Failed to connect to PostgreSQL after $MAX_RETRIES attempts. Please check the container logs:"
    echo "   docker logs nest_monolith_db"
    exit 1
  fi
  
  echo "✓ PostgreSQL is ready"
else
  echo "✓ PostgreSQL container is already running"
fi

# Create application database user with restricted permissions
echo "→ Creating application database user ($APP_USER)"
docker exec nest_monolith_db psql -U $DB_USER -c "DO \$\$ 
BEGIN
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
  
  -- Drop app user if exists
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
END \$\$;" || { echo "⚠️ Error creating application user"; exit 1; }

# Set up application user permissions on the database
echo "→ Setting up application user permissions"
docker exec nest_monolith_db psql -U $DB_USER -d $DB_NAME -c "
  -- Connect to the database and grant schema permissions
  GRANT USAGE, CREATE ON SCHEMA public TO $APP_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $APP_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO $APP_USER;
  
  -- Grant permissions on existing tables
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $APP_USER;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;
  
  -- Grant additional permissions needed for Prisma migrations
  ALTER USER $APP_USER WITH CREATEDB;
  GRANT ALL PRIVILEGES ON SCHEMA public TO $APP_USER;" || { echo "⚠️ Error setting up permissions"; exit 1; }

echo "✓ PostgreSQL database and users set up successfully"

# Set up Redis if not skipped
if [ -z "$SKIP_REDIS" ]; then
  echo "→ Setting up Redis"
  
  # Start Redis container if not running
  if ! docker ps | grep -q "nest_monolith_redis"; then
    echo "→ Starting Redis container"
    docker-compose up -d redis
    
    # Wait for Redis to be ready
    echo "→ Waiting for Redis to be ready"
    sleep 2
    MAX_RETRIES=10
    RETRIES=0
    
    until docker exec nest_monolith_redis redis-cli ping > /dev/null 2>&1 || [ $RETRIES -eq $MAX_RETRIES ]; do
      echo "   Waiting for Redis connection... ($((++RETRIES))/$MAX_RETRIES)"
      sleep 1
    done
    
    if [ $RETRIES -eq $MAX_RETRIES ]; then
      echo "⚠️ Failed to connect to Redis after $MAX_RETRIES attempts. Please check the container logs:"
      echo "   docker logs nest_monolith_redis"
      exit 1
    fi
    
    echo "✓ Redis is ready"
  else
    echo "✓ Redis container is already running"
  fi

  # Configure Redis password if specified
  if [ -n "$REDIS_PASSWORD" ]; then
    echo "→ Configuring Redis password"
    docker exec nest_monolith_redis redis-cli CONFIG SET requirepass "$REDIS_PASSWORD" > /dev/null 2>&1 || { echo "⚠️ Error setting Redis password"; exit 1; }
    echo "✓ Redis password configured"
  fi

  echo "✓ Redis setup completed"
fi

# Update DATABASE_URL and add SHADOW_DATABASE_URL in .env file
echo "→ Updating database URLs in .env file"
# Create a backup of the .env file
cp .env .env.backup

# Set up the database URLs
APP_DB_URL="postgresql://$APP_USER:$APP_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
SHADOW_DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/${DB_NAME}_shadow?schema=public"

# Update the DATABASE_URL in the .env file
if grep -q "^DATABASE_URL=" .env; then
  sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=$APP_DB_URL|g" .env && rm .env.bak
  echo "✓ DATABASE_URL updated to use application user"
else
  # If DATABASE_URL doesn't exist, append it
  echo "DATABASE_URL=$APP_DB_URL" >> .env
  echo "✓ DATABASE_URL added to .env file"
fi

# Update or add SHADOW_DATABASE_URL
if grep -q "^SHADOW_DATABASE_URL=" .env; then
  sed -i.bak "s|^SHADOW_DATABASE_URL=.*|SHADOW_DATABASE_URL=$SHADOW_DB_URL|g" .env && rm .env.bak
  echo "✓ SHADOW_DATABASE_URL updated"
else
  # If SHADOW_DATABASE_URL doesn't exist, append it
  echo "SHADOW_DATABASE_URL=$SHADOW_DB_URL" >> .env
  echo "✓ SHADOW_DATABASE_URL added to .env file"
fi

# Create the shadow database
echo "→ Creating shadow database for Prisma migrations"
# Drop shadow database if exists (outside transaction)
docker exec nest_monolith_db psql -U $DB_USER -c "DROP DATABASE IF EXISTS ${DB_NAME}_shadow;" || echo "⚠️ Warning: Could not drop shadow database"
# Create shadow database
docker exec nest_monolith_db psql -U $DB_USER -c "CREATE DATABASE ${DB_NAME}_shadow;" || { echo "⚠️ Error creating shadow database"; exit 1; }
# Grant permissions to app user on shadow database
docker exec nest_monolith_db psql -U $DB_USER -c "GRANT CONNECT ON DATABASE ${DB_NAME}_shadow TO $APP_USER;
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME}_shadow TO $APP_USER;" || { echo "⚠️ Warning: Could not grant permissions on shadow database"; }
echo "✓ Shadow database created"

echo ""
echo "=== Database Initialization Complete ==="
echo ""
echo "PostgreSQL database '$DB_NAME' has been set up with:"
echo "  - Superuser: $DB_USER"
echo "  - Application user: $APP_USER (with restricted permissions)"
if [ -z "$SKIP_REDIS" ]; then
  echo "Redis has been configured"
  if [ -n "$REDIS_PASSWORD" ]; then
    echo "  - Password protection enabled"
  fi
fi
echo ""
echo "Next steps:"
echo "  1. Update your Prisma schema if needed"
echo "  2. Run migrations with: ./scripts/db/migrate.sh init"
echo "  3. Generate Prisma client with: npx prisma generate"
echo ""
echo "For more information on database operations, see docs/05_OPERATIONAL_SCRIPTS.md" 