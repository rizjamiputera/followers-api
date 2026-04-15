#!/usr/bin/env bash
# backup-prod.sh — full production DB dump + files volume tar.
#
# Outputs:
#   $BACKUP_DIR/YYYYMMDD/prod_db_<timestamp>.sql.gz
#   $BACKUP_DIR/YYYYMMDD/prod_files_<timestamp>.tar.gz
#
# Retention: keeps last 10 of each; prunes empty date folders >1 day old.
#
# Skips gracefully if the production stack is not running / not seeded.
# Prints the timestamp on stdout (last line) for callers that chain into restore.

set -euo pipefail

PROD_DB_CONTAINER="${PROD_DB_CONTAINER:-prod_followers_bicara_postgre}"
PROD_FILES_VOLUME="${PROD_FILES_VOLUME:-prod_volume_api_followers}"
BACKUP_DIR="${BACKUP_DIR:-$(pwd)/backups}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DATE_FOLDER="$(date +%Y%m%d)"
TARGET_DIR="$BACKUP_DIR/$DATE_FOLDER"
mkdir -p "$TARGET_DIR"

DB_OUT="$TARGET_DIR/prod_db_${TIMESTAMP}.sql.gz"
FILES_OUT="$TARGET_DIR/prod_files_${TIMESTAMP}.tar.gz"

echo "==> Backup destination: $TARGET_DIR"

# ── DB dump ────────────────────────────────────────────────
if docker ps --format '{{.Names}}' | grep -q "^${PROD_DB_CONTAINER}$"; then
    echo "==> Dumping production database..."
    docker exec "$PROD_DB_CONTAINER" \
        sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
        | gzip > "$DB_OUT"
    echo "    saved: $(basename "$DB_OUT") ($(du -h "$DB_OUT" | cut -f1))"
else
    echo "==> $PROD_DB_CONTAINER not running — skipping DB backup."
fi

# ── Files volume tar ───────────────────────────────────────
if docker volume inspect "$PROD_FILES_VOLUME" >/dev/null 2>&1; then
    echo "==> Archiving production files volume..."
    docker run --rm \
        -v "$PROD_FILES_VOLUME":/source:ro \
        -v "$TARGET_DIR":/backup \
        alpine tar czf "/backup/prod_files_${TIMESTAMP}.tar.gz" -C /source .
    echo "    saved: $(basename "$FILES_OUT") ($(du -h "$FILES_OUT" | cut -f1))"
else
    echo "==> $PROD_FILES_VOLUME not found — skipping files backup."
fi

# ── Retention: keep last 10 of each, across all date folders ───
echo "==> Pruning old backups (keep last 10 of each)..."
find "$BACKUP_DIR" -name 'prod_db_*.sql.gz' -type f -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | tail -n +11 | cut -d' ' -f2- | xargs -r rm -f
find "$BACKUP_DIR" -name 'prod_files_*.tar.gz' -type f -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | tail -n +11 | cut -d' ' -f2- | xargs -r rm -f
find "$BACKUP_DIR" -type d -empty -mtime +1 -delete 2>/dev/null || true

# Emit timestamp on the final stdout line for chained callers.
echo "$TIMESTAMP"
