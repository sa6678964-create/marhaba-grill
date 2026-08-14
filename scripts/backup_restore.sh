#!/usr/bin/env bash
# scripts/backup_restore.sh
# Example backup (logical) and restore commands for a Postgres / Supabase database.
# Ensure DATABASE_URL is set in the environment or replace it inline.

set -euo pipefail

if [ "$1" = "backup" ]; then
  OUT=${2:-"marhaba_backup_$(date +%F_%H%M%S).sql"}
  echo "Backing up database to $OUT"
  pg_dump $DATABASE_URL -Fc -f "$OUT"
  echo "Backup written: $OUT"
  exit 0
fi

if [ "$1" = "restore" ]; then
  FILE=${2:?"usage: $0 restore <backup-file>")}
  echo "Restoring $FILE to database"
  pg_restore -d $DATABASE_URL -c "$FILE"
  echo "Restore completed"
  exit 0
fi

cat <<EOF
Usage: $0 <backup|restore> [file]
Example: $0 backup mydump.sql
EOF
