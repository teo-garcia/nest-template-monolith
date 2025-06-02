#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Display help information
function show_help {
  echo "Usage: ./scripts/dev/stop.sh [options]"
  echo ""
  echo "Stop all Docker services for the development environment."
  echo ""
  echo "Options:"
  echo "  -h, --help    Show this help message"
  echo "  --remove      Remove Docker containers after stopping"
  echo ""
  exit 0
}

REMOVE_FLAG=""

# Parse command line options
while (( "$#" )); do
  case "$1" in
    -h|--help)
      show_help
      ;;
    --remove)
      REMOVE_FLAG="--remove"
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

echo "=== Stopping Development Environment Services ==="

# Check if Docker is running (optional, as stop might be called even if already stopped)
# if ! docker info > /dev/null 2>&1; then
#   echo "⚠️  Docker daemon is not running."
#   # exit 1 # Or just proceed, docker-compose stop will likely fail gracefully
# fi

# Path to the docker management script
DOCKER_SCRIPT_PATH="$SCRIPT_DIR/../docker/docker.sh"

if [ ! -f "$DOCKER_SCRIPT_PATH" ]; then
  echo "Error: Docker script not found at $DOCKER_SCRIPT_PATH" >&2
  echo "Attempting direct docker-compose command as a fallback."
  if [ -n "$REMOVE_FLAG" ]; then
    docker-compose down --remove-orphans # More thorough than just 'stop' then 'rm'
  else
    docker-compose stop
  fi
  echo "✓ Docker services stopped (using fallback docker-compose command)."
  exit 0
fi

if [ -n "$REMOVE_FLAG" ]; then
  echo "→ Stopping and removing Docker services..."
  "$DOCKER_SCRIPT_PATH" stop --remove
else
  echo "→ Stopping Docker services..."
  "$DOCKER_SCRIPT_PATH" stop
fi

echo "✓ Development services stopped."

exit 0 