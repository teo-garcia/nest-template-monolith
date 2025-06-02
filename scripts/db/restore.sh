#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/db/restore.sh [options] <backup-file-name>"
  echo ""
  echo "Restore database from a specified backup file."
  echo "The backup file should be a .sql.gz file located in the backup directory."
  echo ""
  echo "Options:"
  echo "  -h, --help         Show this help message"
  echo "  -l, --list         List available backups to restore from"
  echo "  -d, --directory    Specify backup directory (default: ./backups)"
  echo "  -f, --force        Force restore without confirmation (DANGEROUS)"
  echo ""
  echo "Example:"
  echo "  ./scripts/db/restore.sh 20231027_153000.sql.gz"
  echo "  ./scripts/db/restore.sh -l   # List backups first"
  echo ""
  exit 0
}

# Default values
BACKUP_DIR="./backups"
LIST_BACKUPS=""
FORCE_RESTORE=""
BACKUP_FILE_ARG=""

# Parse command line options
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
    -f|--force)
      FORCE_RESTORE="true"
      shift
      ;;
    -*|--*=)
      echo "Error: Unsupported flag $1" >&2
      show_help
      exit 1
      ;;
    *)
      if [ -z "$BACKUP_FILE_ARG" ]; then
        BACKUP_FILE_ARG="$1"
        shift
      else
        echo "Error: Too many arguments. Specify only one backup file name." >&2
        show_help
        exit 1
      fi
      ;;
  esac
done

# Ensure backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Backup directory '$BACKUP_DIR' not found." >&2
  echo "Please create it or specify a different directory with -d."
  exit 1
fi

# List backups if requested
if [ -n "$LIST_BACKUPS" ]; then
  echo "=== Available Database Backups ==="
  echo "Location: $BACKUP_DIR"
  echo ""
  
  if [ -z "$(ls -A "$BACKUP_DIR"/*.sql.gz 2>/dev/null)" ]; then
    echo "No .sql.gz backups found in $BACKUP_DIR."
  else
    echo "Available backups (files ending with .sql.gz):"
    echo "-----------------------------------------------------------------"
    printf "%s | %s | %s\n" "Name" "Size" "Date Modified"
    echo "-----------------------------------------------------------------"
    for backup in "$BACKUP_DIR"/*.sql.gz; do
      if [ -f "$backup" ]; then
        filename=$(basename "$backup")
        size=$(du -h "$backup" | cut -f1)
        date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || date -r "$backup" "+%Y-%m-%d %H:%M:%S") # macOS vs Linux date
        printf "%-40s | %-7s | %s\n" "$filename" "$size" "$date"
      fi
    done
    echo "-----------------------------------------------------------------"
  fi
  exit 0
fi

# Check if backup file name was provided
if [ -z "$BACKUP_FILE_ARG" ]; then
  echo "Error: Backup file name is required." >&2
  show_help
  exit 1
fi

TARGET_BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE_ARG"

# Verify the backup file exists and is a .sql.gz file
if [[ "$BACKUP_FILE_ARG" != *.sql.gz ]]; then
    echo "Error: Backup file name must end with .sql.gz" >&2
    exit 1
fi
if [ ! -f "$TARGET_BACKUP_FILE" ]; then
  echo "Error: Backup file '$TARGET_BACKUP_FILE' not found." >&2
  echo "Use -l or --list to see available backups."
  exit 1
fi

echo "=== Database Restore ==="

# Load environment variables for database connection
if [ -f .env ]; then
  echo "→ Loading environment variables from .env"
  set -a
  source .env
  set +a
else
  echo "⚠️ Warning: .env file not found. Database connection might fail or use defaults."
  # Define critical vars with defaults if not found, though restore usually needs specific target
  DATABASE_SUPERUSER=${DATABASE_USER:-postgres} # For dropping/creating DB, use superuser
  DATABASE_NAME=${DATABASE_NAME:-nest_monolith}
  # APP_DATABASE_USER will be set by the restored DB
fi

DB_MAIN_USER=${DATABASE_USER:-postgres} # User with rights to drop/create DB if necessary. Usually the main PG superuser.
DB_TARGET_NAME=${DATABASE_NAME:-nest_monolith}

# Confirmation prompt
if [ -z "$FORCE_RESTORE" ]; then
  echo ""
  echo "⚠️ WARNING: This will restore the database '$DB_TARGET_NAME' from the backup file:"
  echo "  $TARGET_BACKUP_FILE"
  echo ""
  echo "This operation will typically involve:
  1. Stopping application connections (recommended, but not enforced by this script).
  2. DROPPING the existing database '$DB_TARGET_NAME'.
  3. RECREATING the database '$DB_TARGET_NAME'.
  4. Restoring data from the backup file.
This will OVERWRITE all current data in '$DB_TARGET_NAME'." >&2
  echo ""
  read -p "Are you absolutely sure you want to continue? (y/N) " response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Restore cancelled."
    exit 0
  fi
fi

# Determine if running in Docker or locally
IS_DOCKER_DB_RUNNING=false
if docker-compose ps db 2>/dev/null | grep -q "Up"; then
  IS_DOCKER_DB_RUNNING=true
fi

echo "→ Preparing to restore database '$DB_TARGET_NAME' from '$TARGET_BACKUP_FILE'"

# Commands to drop and recreate the database
# Note: Terminating connections is important before dropping the database.
# This script assumes the user handles this or the impact is understood.
CMD_DROP_DB="DROP DATABASE IF EXISTS \"$DB_TARGET_NAME\";"
CMD_CREATE_DB="CREATE DATABASE \"$DB_TARGET_NAME\";"
# For PostgreSQL, it's often better to connect to a different DB (e.g., postgres, template1) to drop/create another.

if $IS_DOCKER_DB_RUNNING; then
  echo "→ Using Docker for restore operation."
  echo "  Stopping existing connections (best effort by dropping and recreating DB)..."
  docker-compose exec -T db psql -U "$DB_MAIN_USER" -d postgres -c "$CMD_DROP_DB"
  docker-compose exec -T db psql -U "$DB_MAIN_USER" -d postgres -c "$CMD_CREATE_DB"
  
  echo "→ Restoring database from backup..."
  gunzip < "$TARGET_BACKUP_FILE" | docker-compose exec -T db psql -U "$DB_MAIN_USER" -d "$DB_TARGET_NAME"
else
  echo "→ Using local psql for restore operation."
  echo "  Stopping existing connections (best effort by dropping and recreating DB)..."
  psql -U "$DB_MAIN_USER" -d postgres -c "$CMD_DROP_DB"
  psql -U "$DB_MAIN_USER" -d postgres -c "$CMD_CREATE_DB"
  
  echo "→ Restoring database from backup..."
  gunzip < "$TARGET_BACKUP_FILE" | psql -U "$DB_MAIN_USER" -d "$DB_TARGET_NAME"
fi

echo "✓ Database restore completed from '$TARGET_BACKUP_FILE' to '$DB_TARGET_NAME'."
echo "Important: Ensure your application (e.g., via .env DATABASE_URL) is configured to use the correct user for this database."
echo "The original users and permissions from the backup should now be in place."
echo "You might need to restart your application services."

exit 0 