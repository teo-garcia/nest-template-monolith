#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Display help information
function show_help {
  echo "Usage: ./scripts/dev/reset.sh [options]"
  echo ""
  echo "Reset the development environment to a clean state."
  echo "This script is DESTRUCTIVE and will remove data."
  echo ""
  echo "Actions performed:"
  echo "  1. Stops and removes all project-specific Docker containers."
  echo "  2. Runs Docker prune for project-specific resources (volumes, networks)."
  echo "  3. Optionally removes node_modules and .env file."
  echo ""
  echo "Options:"
  echo "  -h, --help          Show this help message"
  echo "  -f, --force         Force reset without confirmation (DANGEROUS)"
  echo "  --remove-deps       Additionally remove node_modules directory"
  echo "  --remove-env        Additionally remove the .env file"
  echo ""
  exit 0
}

FORCE_RESET=""
REMOVE_DEPS=""
REMOVE_ENV=""

# Parse command line options
while (( "$#" )); do
  case "$1" in
    -h|--help)
      show_help
      ;;
    -f|--force)
      FORCE_RESET="true"
      shift
      ;;
    --remove-deps)
      REMOVE_DEPS="true"
      shift
      ;;
    --remove-env)
      REMOVE_ENV="true"
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

echo "=== Development Environment Reset ==="

if [ -z "$FORCE_RESET" ]; then
  echo ""
  echo "⚠️ WARNING: This script will reset your development environment."
  echo "It will perform the following actions:"
  echo "  - Stop and remove all Docker containers defined in docker-compose.yml for this project."
  echo "  - Prune project-specific Docker volumes and networks."
  if [ -n "$REMOVE_DEPS" ]; then
    echo "  - Remove the node_modules directory."
  fi
  if [ -n "$REMOVE_ENV" ]; then
    echo "  - Remove the .env file."
  fi
  echo ""
  echo "This can lead to data loss (e.g., in database volumes)."
  read -p "Are you absolutely sure you want to continue? (y/N) " response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Reset cancelled."
    exit 0
  fi
fi 

# Step 1: Stop and remove Docker containers
echo "→ Stopping and removing Docker services..."
DOCKER_SCRIPT_PATH="$SCRIPT_DIR/../docker/docker.sh"
if [ -f "$DOCKER_SCRIPT_PATH" ]; then
  "$DOCKER_SCRIPT_PATH" stop --remove
else
  echo "  Warning: $DOCKER_SCRIPT_PATH not found. Attempting direct docker-compose down."
  docker-compose down --remove-orphans
fi

# Step 2: Prune project-specific Docker resources
echo "→ Pruning project-specific Docker resources (volumes, networks)..."
DOCKER_PRUNE_SCRIPT_PATH="$SCRIPT_DIR/../docker/prune.sh"
if [ -f "$DOCKER_PRUNE_SCRIPT_PATH" ]; then
  "$DOCKER_PRUNE_SCRIPT_PATH" --project-only --force
else
  echo "  Warning: $DOCKER_PRUNE_SCRIPT_PATH not found. Attempting direct docker-compose down -v for volume removal."
  docker-compose down -v --remove-orphans # This also removes containers if not already done, and anonymous volumes.
  # For named volumes associated with the project, a more specific command might be needed if prune.sh is missing.
fi

# Step 3: Optionally remove node_modules
if [ -n "$REMOVE_DEPS" ]; then
  echo "→ Removing node_modules directory..."
  if [ -d "node_modules" ]; then
    rm -rf "node_modules"
    echo "✓ node_modules directory removed."
  else
    echo "→ node_modules directory not found."
  fi
fi

# Step 4: Optionally remove .env file
if [ -n "$REMOVE_ENV" ]; then
  echo "→ Removing .env file..."
  if [ -f ".env" ]; then
    rm -f ".env"
    echo "✓ .env file removed."
  else
    echo "→ .env file not found."
  fi
fi

echo "✓ Development environment reset complete."
echo "To set up the environment again, run: ./scripts/dev/setup.sh"

exit 0 