#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Default values
DETACHED=""
REBUILD=""
CLEAN_START="" # For 'start' command
REMOVE_STOP="" # For 'stop' command
FOLLOW_LOGS=""
LOG_TIMESTAMPS=""
LOG_LINES="100"
SERVICE_NAME="" # Specific service to target

# Display help information
function show_help {
  echo "Usage: ./scripts/docker/docker.sh <command> [options] [service-name]"
  echo ""
  echo "Manage Docker containers defined in docker-compose.yml."
  echo ""
  echo "Commands:"
  echo "  start         Start containers. Options: -d (detach), -r (rebuild), -c (clean start)"
  echo "  stop          Stop containers. Options: --remove (remove after stopping)"
  echo "  restart       Restart containers. Options: -d (detach), -r (rebuild), -c (clean start)"
  echo "  logs          View logs. Options: -f (follow), -t (timestamps), -n <lines> (number of lines)"
  echo "  shell         Open a shell into a running service (requires service-name)"
  echo "  help          Show this help message"
  echo ""
  echo "Options for 'start'/'restart':"
  echo "  -d, --detach    Run containers in the background"
  echo "  -r, --rebuild   Rebuild containers before starting"
  echo "  -c, --clean     Remove existing containers before starting (for 'start'/'restart')"
  echo ""
  echo "Options for 'stop':"
  echo "  --remove        Remove containers after stopping"
  echo ""
  echo "Options for 'logs':"
  echo "  -f, --follow     Follow log output"
  echo "  -t, --timestamps Show timestamps"
  echo "  -n, --lines <num> Number of lines to show (default: 100)"
  echo ""
  echo "Argument:"
  echo "  service-name   Optional: specify a service name for 'start', 'stop', 'restart', 'logs', 'shell'"
  echo "                 If not provided, the command applies to all services in docker-compose.yml"
  echo ""
  echo "Examples:"
  echo "  ./scripts/docker/docker.sh start -d app          # Start 'app' service in detached mode"
  echo "  ./scripts/docker/docker.sh stop --remove db    # Stop and remove 'db' service"
  echo "  ./scripts/docker/docker.sh restart -r          # Rebuild and restart all services"
  echo "  ./scripts/docker/docker.sh logs -f app           # Follow logs for 'app' service"
  echo "  ./scripts/docker/docker.sh shell web           # Open shell in 'web' service"
  echo "  ./scripts/docker/docker.sh help                # Show this help message"
  echo ""
  exit 0
}

COMMAND=$1
shift || true # Shift even if no arguments after command, to avoid issues if only command is passed

# Parse command-specific options and service name
while (( "$#" )); do
  case "$1" in
    -h|--help) # Global help, though command-specific help is better handled by main help
      show_help 
      ;;
    # Start/Restart options
    -d|--detach)
      DETACHED="--detach"
      shift
      ;;
    -r|--rebuild)
      REBUILD="--build"
      shift
      ;;
    -c|--clean) # Option for start/restart
      CLEAN_START="true"
      shift
      ;;
    # Stop options
    --remove) # Option for stop
      REMOVE_STOP="true"
      shift
      ;;
    # Logs options
    -f|--follow)
      FOLLOW_LOGS="--follow"
      shift
      ;;
    -t|--timestamps)
      LOG_TIMESTAMPS="--timestamps"
      shift
      ;;
    -n|--lines)
      if [[ -n "$2" && "$2" != -* ]]; then
        LOG_LINES="$2"
        shift 2
      else
        echo "Error: -n or --lines requires a number." >&2
        exit 1
      fi
      ;;
    # Catch-all for unsupported flags or service name
    -*)
      echo "Error: Unsupported flag $1 for command '$COMMAND'" >&2
      echo "Use './scripts/docker/docker.sh help' for usage information."
      exit 1
      ;;
    *) # Assume it's the service name
      if [ -z "$SERVICE_NAME" ]; then
        SERVICE_NAME="$1"
        shift
      else
        echo "Error: Too many arguments. Specify only one service name." >&2
        exit 1
      fi
      ;;
  esac
done

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "⚠️  Docker daemon is not running. Please start Docker and try again."
  exit 1
fi

# Execute command
case "$COMMAND" in
  start)
    echo "=== Docker Start ($SERVICE_NAME) ==="
    if [ -n "$CLEAN_START" ]; then
      echo "→ Removing existing containers for ($SERVICE_NAME) before starting..."
      docker-compose down --remove-orphans $SERVICE_NAME # Service name might not work well with down, consider full down
    fi
    echo "→ Starting Docker containers for ($SERVICE_NAME)..."
    docker-compose up $DETACHED $REBUILD $SERVICE_NAME
    if [ -z "$DETACHED" ]; then
      echo "✓ Docker containers for ($SERVICE_NAME) stopped (foreground mode)"
    else
      echo "✓ Docker containers for ($SERVICE_NAME) started in background"
    fi
    ;;
  stop)
    echo "=== Docker Stop ($SERVICE_NAME) ==="
    if [ -n "$REMOVE_STOP" ]; then
      echo "→ Stopping and removing project containers for ($SERVICE_NAME)..."
      docker-compose down $SERVICE_NAME
      echo "✓ Project containers for ($SERVICE_NAME) stopped and removed"
    else
      echo "→ Stopping project containers for ($SERVICE_NAME)..."
      docker-compose stop $SERVICE_NAME
      echo "✓ Project containers for ($SERVICE_NAME) stopped"
    fi
    ;;
  restart)
    echo "=== Docker Restart ($SERVICE_NAME) ==="
    if [ -n "$CLEAN_START" ]; then
      echo "→ Removing existing containers for ($SERVICE_NAME) before restarting..."
      docker-compose down --remove-orphans $SERVICE_NAME
    else
      echo "→ Stopping project containers for ($SERVICE_NAME)..."
      docker-compose stop $SERVICE_NAME
    fi
    echo "→ Starting Docker containers for ($SERVICE_NAME)..."
    docker-compose up $DETACHED $REBUILD $SERVICE_NAME
    if [ -z "$DETACHED" ]; then
      echo "✓ Docker containers for ($SERVICE_NAME) stopped (foreground mode after restart)"
    else
      echo "✓ Docker containers for ($SERVICE_NAME) restarted in background"
    fi
    ;;
  logs)
    echo "=== Docker Logs ($SERVICE_NAME) ==="
    echo "→ Viewing logs for service: ${SERVICE_NAME:-all services}"
    docker-compose logs $FOLLOW_LOGS $LOG_TIMESTAMPS --tail=$LOG_LINES $SERVICE_NAME
    if [ -z "$FOLLOW_LOGS" ]; then
      echo ""
      echo "→ To follow logs in real-time, use the -f or --follow option."
    fi
    ;;
  shell)
    echo "=== Docker Shell ($SERVICE_NAME) ==="
    if [ -z "$SERVICE_NAME" ]; then
        echo "Error: 'shell' command requires a service name." >&2
        echo "Example: ./scripts/docker/docker.sh shell app" >&2
        exit 1
    fi
    echo "→ Opening shell into service: $SERVICE_NAME..."
    # Common shells, trying sh if bash isn't available
    docker-compose exec "$SERVICE_NAME" /bin/bash || docker-compose exec "$SERVICE_NAME" /bin/sh
    ;;
  help)
    show_help
    ;;
  *)
    echo "Error: Unknown command '$COMMAND'" >&2
    echo "Use './scripts/docker/docker.sh help' for available commands." >&2
    exit 1
    ;;
esac

exit 0 