#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Display help information
function show_help {
  echo "Usage: ./scripts/db/migrate.sh <command> [options] [migration-name]"
  echo ""
  echo "Manage Prisma database migrations."
  echo ""
  echo "Commands:"
  echo "  dev <name>      Create a new migration for development and apply it. Requires a migration name."
  echo "                  Alias: create <name>"
  echo "  deploy          Apply all pending migrations. Typically used in staging/production."
  echo "                  Alias: up"
  echo "  reset           Reset the database and reapply all migrations."
  echo "  status          Show the status of migrations."
  echo "  help            Show this help message."
  echo ""
  echo "Options for 'dev' command:"
  echo "  --dry-run       Create migration files without applying them (passes --create-only to Prisma)."
  echo "  --skip-gen      Skip generating Prisma client after migration."
  echo ""
  echo "Examples:"
  echo "  ./scripts/db/migrate.sh dev add_user_email_unique   # Create and apply a new migration"
  echo "  ./scripts/db/migrate.sh dev --dry-run setup_initial_schema"
  echo "  ./scripts/db/migrate.sh deploy                      # Apply pending migrations"
  echo "  ./scripts/db/migrate.sh reset                       # Reset database"
  echo "  ./scripts/db/migrate.sh status                      # Check migration status"
  echo ""
  exit 0
}

COMMAND=$1
shift || true # Shift command

# Default options
DRY_RUN_DEV=""
SKIP_GEN_DEV=""
MIGRATION_NAME=""

# Parse command line options based on command
if [[ "$COMMAND" == "dev" || "$COMMAND" == "create" ]]; then
  while (( "$#" )); do
    case "$1" in
      --dry-run)
        DRY_RUN_DEV="--create-only"
        shift
        ;;
      --skip-gen)
        SKIP_GEN_DEV="true"
        shift
        ;;
      -*|--*=)
        echo "Error: Unsupported flag $1 for command '$COMMAND'" >&2
        show_help
        exit 1
        ;;
      *)
        if [ -z "$MIGRATION_NAME" ]; then
          MIGRATION_NAME="$1"
          shift
        else
          echo "Error: Too many arguments for 'dev' command. Only one migration name is allowed." >&2
          show_help
          exit 1
        fi
        ;;
    esac
  done
  if [ -z "$MIGRATION_NAME" ]; then
    echo "Error: Command '$COMMAND' requires a migration name." >&2
    show_help
    exit 1
  fi
elif [[ "$COMMAND" == "deploy" || "$COMMAND" == "up" || "$COMMAND" == "reset" || "$COMMAND" == "status" ]]; then
  if (( "$#" > 0 )); then
    echo "Error: Command '$COMMAND' does not accept arguments or flags like '$1'" >&2
    show_help
    exit 1
  fi
else # Includes 'help' or unknown commands
  true # Fall through to the main case statement
fi 


echo "=== Prisma Database Migration ==="

case "$COMMAND" in
  dev|create)
    echo "→ Creating and applying development migration: $MIGRATION_NAME"
    npx prisma migrate dev --name "$MIGRATION_NAME" $DRY_RUN_DEV

    if [ -z "$SKIP_GEN_DEV" ]; then
      echo "→ Generating Prisma client"
      npx prisma generate
      echo "✓ Prisma client generated"
    else
      echo "→ Skipped Prisma client generation"
    fi
    echo "✓ Development migration '$MIGRATION_NAME' processed."
    ;;
  deploy|up)
    echo "→ Applying all pending migrations..."
    npx prisma migrate deploy
    echo "✓ Pending migrations applied."

    echo "→ Generating Prisma client"
    npx prisma generate
    echo "✓ Prisma client generated"
    ;;
  reset)
    echo "→ Resetting database and reapplying all migrations..."
    read -p "⚠️ WARNING: This will delete all data in the database. Are you sure? (y/N) " response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
      npx prisma migrate reset --force 
      echo "✓ Database reset and migrations reapplied."
      
      echo "→ Generating Prisma client"
      npx prisma generate
      echo "✓ Prisma client generated"
    else
      echo "Database reset cancelled."
    fi
    ;;
  status)
    echo "→ Checking migration status..."
    npx prisma migrate status
    ;;
  help)
    show_help
    ;;
  *)
    echo "Error: Unknown command '$COMMAND'" >&2
    show_help
    exit 1
    ;;
esac

echo ""
echo "✓ Migration script finished." 