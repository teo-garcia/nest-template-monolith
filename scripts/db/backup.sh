#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/db/backup.sh [options] [backup-name]"
  echo ""
  echo "Create a backup of the database."
  echo ""
  echo "Options:"
  echo "  -h, --help         Show this help message"
  echo "  -l, --list         List existing backups"
  echo "  -d, --directory    Specify backup directory (default: ./backups)"
  echo ""
  echo "If no backup name is provided, a timestamp will be used."
  echo ""
  exit 0
}

# Parse command line options
LIST_BACKUPS=""
BACKUP_DIR="./backups"

while (( "$#" )); do
  case "$1" in
    -h|--help)
      show_help
      ;;
    -l|--list)
      LIST_BACKUPS="true"
      shift
      ;;
    -d|--directory)
      BACKUP_DIR="$2"
      shift 2
      ;;
    -*|--*=)
      echo "Error: Unsupported flag $1" >&2
      echo "Use -h or --help for usage information"
      exit 1
      ;;
    *)
      BACKUP_NAME="$1"
      shift
      ;;
  esac
done

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# List backups if requested
if [ -n "$LIST_BACKUPS" ]; then
  echo "=== Database Backups ==="
  echo "Location: $BACKUP_DIR"
  echo ""
  
  if [ -z "$(ls -A "$BACKUP_DIR")" ]; then
    echo "No backups found."
  else
    # List backups with details
    echo "Available backups:"
    echo "----------------------------------------"
    echo "Name                     | Size    | Date"
    echo "----------------------------------------"
    for backup in "$BACKUP_DIR"/*.sql.gz; do
      if [ -f "$backup" ]; then
        filename=$(basename "$backup")
        size=$(du -h "$backup" | cut -f1)
        date=$(date -r "$backup" "+%Y-%m-%d %H:%M:%S")
        echo "$filename | $size | $date"
      fi
    done
    echo "----------------------------------------"
  fi
  
  exit 0
fi

# If no backup name provided, use timestamp
if [ -z "$BACKUP_NAME" ]; then
  BACKUP_NAME=$(date +"%Y%m%d_%H%M%S")
fi

# Ensure backup name has .sql.gz extension
if [[ "$BACKUP_NAME" != *".sql.gz" ]]; then
  BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"
else
  BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME"
fi

echo "=== Database Backup ==="

# Load environment variables
if [ -f .env ]; then
  echo "→ Loading environment variables"
  set -a
  source .env
  set +a
else
  echo "Warning: .env file not found, using default values"
  DATABASE_USER=${DATABASE_USER:-postgres}
  DATABASE_NAME=${DATABASE_NAME:-nest_monolith}
fi

# Create backup
echo "→ Creating database backup: $BACKUP_FILE"

# Check if we're running in Docker or locally
if docker-compose ps db | grep -q "Up"; then
  echo "→ Backing up from Docker container"
  docker-compose exec -T db pg_dump -U "$DATABASE_USER" -d "$DATABASE_NAME" | gzip > "$BACKUP_FILE"
else
  echo "→ Backing up from local database"
  pg_dump -U "$DATABASE_USER" -d "$DATABASE_NAME" | gzip > "$BACKUP_FILE"
fi

# Verify backup was created successfully
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  size=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✓ Backup completed successfully: $BACKUP_FILE ($size)"
else
  echo "✗ Backup failed"
  exit 1
fi 