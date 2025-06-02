#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/docker/prune.sh [options]"
  echo ""
  echo "Clean up Docker resources including containers, volumes, and networks."
  echo ""
  echo "Options:"
  echo "  -h, --help       Show this help message"
  echo "  -f, --force      Force cleanup without confirmation"
  echo "  -a, --all        Remove all unused data (including volumes)"
  echo "  --project-only   Only clean up resources from this project"
  echo ""
  exit 0
}

# Parse command line options
FORCE=""
ALL=""
PROJECT_ONLY=""

while (( "$#" )); do
  case "$1" in
    -h|--help)
      show_help
      ;;
    -f|--force)
      FORCE="true"
      shift
      ;;
    -a|--all)
      ALL="true"
      shift
      ;;
    --project-only)
      PROJECT_ONLY="true"
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "⚠️ Docker daemon is not running. Please start Docker and try again."
  exit 1
fi

# Show warning and ask for confirmation
if [ -z "$FORCE" ]; then
  echo "=== Docker Cleanup ==="
  
  if [ -n "$ALL" ]; then
    echo "⚠️ WARNING: This will remove ALL unused Docker resources:"
    echo "  - All stopped containers"
    echo "  - All networks not used by at least one container"
    echo "  - All dangling images"
    echo "  - All build cache"
    echo "  - All volumes not used by at least one container"
    echo ""
    echo "This action CANNOT be undone and may delete data you want to keep!"
  elif [ -n "$PROJECT_ONLY" ]; then
    echo "This will clean up Docker resources related to this project only:"
    echo "  - Stop and remove project containers"
    echo "  - Remove project volumes"
    echo "  - Remove project networks"
  else
    echo "This will clean up unused Docker resources:"
    echo "  - All stopped containers"
    echo "  - All networks not used by at least one container"
    echo "  - All dangling images"
    echo "  - All build cache"
  fi
  echo ""
  
  read -p "Continue? (y/N) " response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Cleanup cancelled."
    exit 0
  fi
fi

echo "=== Cleaning Up Docker Resources ==="

# Project-only cleanup
if [ -n "$PROJECT_ONLY" ]; then
  echo "→ Stopping and removing project containers"
  docker-compose down -v
  echo "✓ Project containers and networks removed"
  
  # Remove any lingering project volumes
  PROJECT_VOLUMES=$(docker volume ls --filter name=nest-template-monolith -q)
  if [ -n "$PROJECT_VOLUMES" ]; then
    echo "→ Removing project volumes"
    docker volume rm $PROJECT_VOLUMES
    echo "✓ Project volumes removed"
  else
    echo "→ No project volumes found"
  fi
  
  echo "✓ Project cleanup complete"
  exit 0
fi

# General Docker cleanup
if [ -n "$ALL" ]; then
  echo "→ Removing all unused Docker resources including volumes"
  docker system prune -af --volumes
  echo "✓ All unused Docker resources removed"
else
  echo "→ Removing unused Docker resources (excluding volumes)"
  docker system prune -f
  echo "✓ Unused Docker resources removed"
fi

echo ""
echo "=== Docker Cleanup Complete ==="
if [ -n "$ALL" ]; then
  echo "All unused Docker resources have been removed, including volumes."
else
  echo "Unused Docker resources have been removed."
  echo "To remove volumes as well, use the -a or --all flag." 