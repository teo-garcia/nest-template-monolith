#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Display help information
function show_help {
  echo "Usage: ./scripts/dev/start.sh [options]"
  echo ""
  echo "Start all necessary services for the development environment."
  echo "This typically includes Docker containers (database, Redis, etc.)."
  echo ""
  echo "Options:"
  echo "  -h, --help    Show this help message"
  echo "  --rebuild     Rebuild Docker containers before starting"
  echo ""
  echo "This script will start services in detached mode."
  echo "To start the NestJS application, run 'pnpm start:dev' in a separate terminal."
  echo ""
  exit 0
}

REBUILD_FLAG=""

# Parse command line options
while (( "$#" )); do
  case "$1" in
    -h|--help)
      show_help
      ;;
    --rebuild)
      REBUILD_FLAG="--rebuild"
      shift
      ;;
    -*|--*=)
      echo "Error: Unsupported flag $1" >&2
      show_help
      exit 1
      ;;
    *)
      echo "Error: Unknown argument $1" >&2
      show_help
      exit 1
      ;;
  esac
done

echo "=== Starting Development Environment Services ==="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "⚠️  Docker daemon is not running. Please start Docker and try again."
  exit 1
fi

# Path to the docker management script
DOCKER_SCRIPT_PATH="$SCRIPT_DIR/../docker/docker.sh"

if [ ! -f "$DOCKER_SCRIPT_PATH" ]; then
  echo "Error: Docker script not found at $DOCKER_SCRIPT_PATH" >&2
  echo "Attempting direct docker-compose command as a fallback."
  if [ -n "$REBUILD_FLAG" ]; then
    docker-compose up --build -d
  else
    docker-compose up -d
  fi
  echo "✓ Docker services started (using fallback docker-compose command)."
  exit 0
fi

if [ -n "$REBUILD_FLAG" ]; then
  echo "→ Rebuilding and starting Docker services in detached mode..."
  "$DOCKER_SCRIPT_PATH" start -d --rebuild
else
  echo "→ Starting Docker services in detached mode..."
  "$DOCKER_SCRIPT_PATH" start -d
fi

echo "✓ Development services started."
echo "You can now start the NestJS application with: pnpm start:dev"

exit 0 