#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/dev/env-setup.sh [options]"
  echo ""
  echo "Set up environment variables from sample or create new ones."
  echo ""
  echo "Options:"
  echo "  -h, --help       Show this help message"
  echo "  -f, --force      Force overwrite of existing .env file"
  echo "  -s, --source     Specify source file (default: .env.sample)"
  echo ""
  exit 0
}

# Parse command line options
FORCE=""
SOURCE_FILE=".env.sample"

while (( "$#" )); do
  case "$1" in
    -h|--help)
      show_help
      ;;
    -f|--force)
      FORCE="true"
      shift
      ;;
    -s|--source)
      SOURCE_FILE="$2"
      shift 2
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

echo "=== Environment Setup ==="

# Check if .env already exists
if [ -f .env ] && [ -z "$FORCE" ]; then
  echo "→ .env file already exists"
  echo "→ Use -f or --force to overwrite it"
  exit 0
fi

# Check if source file exists
if [ -f "$SOURCE_FILE" ]; then
  echo "→ Creating .env from $SOURCE_FILE"
  cp "$SOURCE_FILE" .env
  echo "✓ Environment file created successfully"
else
  echo "→ Source file $SOURCE_FILE not found, creating new .env file"
  
  # Create a new .env file with default values
  cat > .env << 'EOL'
# ------------------------------------------------------------------------------
# APPLICATION SETTINGS
# ------------------------------------------------------------------------------
# Basic application configuration settings
NODE_ENV=development                     # Options: development, production, test
PORT=3000                                # Port on which the application will run
API_PREFIX=api                           # Prefix for all API routes (e.g., /api/users)
APP_NAME="NestJS Monolith Template"      # Application name used in various places
API_VERSION=1                            # API version number for versioning routes

# ------------------------------------------------------------------------------
# DATABASE CONFIGURATION
# ------------------------------------------------------------------------------
# The main DATABASE_URL is automatically set by the init-db.sh script
# Use a placeholder here - actual connection string will be configured during setup
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nest_monolith?schema=public

# PostgreSQL connection details
DATABASE_HOST=localhost                  # Host where PostgreSQL is running
DATABASE_PORT=5432                       # Port for PostgreSQL server
DATABASE_USER=postgres                   # Superuser for admin operations
DATABASE_PASSWORD=postgres               # CHANGE THIS in production environments
DATABASE_NAME=nest_monolith              # Name of your database
DATABASE_SYNCHRONIZE=false               # Should be false in production to prevent data loss
DATABASE_LOGGING=true                    # Set to false in production for better performance

# Application database user (used by the application to connect)
APP_DATABASE_USER=app_user               # Limited-privilege user for application connection
APP_DATABASE_PASSWORD=app_password       # CHANGE THIS in production environments

# ------------------------------------------------------------------------------
# AUTHENTICATION
# ------------------------------------------------------------------------------
# JWT settings for authentication
# IMPORTANT: Replace these values with secure keys in production!
JWT_SECRET=change_this_secret_in_production  # Generate with: openssl rand -hex 32
JWT_EXPIRATION=1d                        # Token expiration time (1 day)
JWT_REFRESH_EXPIRATION=7d                # Refresh token expiration (7 days)

# ------------------------------------------------------------------------------
# REDIS CACHE
# ------------------------------------------------------------------------------
# Redis configuration for caching - optional but recommended
REDIS_HOST=localhost                     # Host where Redis is running
REDIS_PORT=6379                          # Port for Redis server
REDIS_PASSWORD=                          # Leave empty for no password or set a secure password
REDIS_TTL=3600                           # Time-to-live for cached items in seconds

# ------------------------------------------------------------------------------
# SWAGGER DOCUMENTATION
# ------------------------------------------------------------------------------
# Settings for API documentation
SWAGGER_TITLE="NestJS Monolith API"      # Title shown in Swagger UI
SWAGGER_DESCRIPTION="API Documentation for NestJS Monolith Template"
SWAGGER_VERSION=1.0                      # Swagger docs version (can match API version)
SWAGGER_PATH=docs                        # Path where docs are accessible (e.g., /docs)

# ------------------------------------------------------------------------------
# LOGGING
# ------------------------------------------------------------------------------
# Logging configuration
LOG_LEVEL=debug                          # Options: debug, info, warn, error (use info in production)
LOG_OUTPUT=console                       # Where logs are sent (console, file, etc.)

# ------------------------------------------------------------------------------
# CORS SETTINGS
# ------------------------------------------------------------------------------
# Cross-Origin Resource Sharing configuration
CORS_ENABLED=true                        # Whether CORS is enabled
CORS_ORIGIN=http://localhost:3000        # Allowed origins (comma-separated list in production)

# ------------------------------------------------------------------------------
# RATE LIMITING
# ------------------------------------------------------------------------------
# Protection against brute force attacks
THROTTLE_TTL=60                          # Time window in seconds
THROTTLE_LIMIT=100                       # Max requests per IP in time window
EOL

  # Also create the .env.sample file if it doesn't exist
  if [ ! -f .env.sample ]; then
    echo "→ Creating .env.sample file for version control"
    cp .env .env.sample
    echo "✓ Sample environment file created"
  fi

  echo "✓ New environment file created with default values"
fi

echo ""
echo "→ IMPORTANT: Update security-sensitive values in your .env file before deployment"
echo "→ At minimum, change the following for production environments:"
echo "   - JWT_SECRET (use: openssl rand -hex 32)"
echo "   - DATABASE_PASSWORD"
echo "   - APP_DATABASE_PASSWORD"
echo "   - REDIS_PASSWORD (if using Redis with authentication)" 