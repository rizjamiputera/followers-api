#!/usr/bin/env bash
# sync-prod-to-staging.sh — take a fresh prod backup and restore it into
# the staging DB + staging files volume. Full dump / full restore (wipes
# current staging data).
#
# Assumes the staging containers (stg_followers_bicara_postgre,
# stg-api-followers) are already up.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PROD_FILES_VOLUME="${PROD_FILES_VOLUME:-prod_volume_api_followers}"
STG_DB_CONTAINER="${STG_DB_CONTAINER:-stg_followers_bicara_postgre}"
STG_FILES_VOLUME="${STG_FILES_VOLUME:-stg_volume_api_followers}"
DB_SCHEMA="${DB_SCHEMA:-followers}"
BACKUP_DIR="${BACKUP_DIR:-$(pwd)/backups}"

# ── Step 1 — create a fresh backup (prints timestamp on last line) ──
echo "==> Creating fresh prod backup before sync..."
TIMESTAMP=$(BACKUP_DIR="$BACKUP_DIR" bash "$SCRIPT_DIR/backup-prod.sh" | tee /dev/stderr | tail -n 1)
DATE_FOLDER="${TIMESTAMP%_*}"
DB_DUMP="$BACKUP_DIR/$DATE_FOLDER/prod_db_${TIMESTAMP}.sql.gz"

# ── Step 2 — wait for staging DB ready ─────────────────────
echo "==> Waiting for $STG_DB_CONTAINER to be ready..."
for i in $(seq 1 30); do
    if docker exec "$STG_DB_CONTAINER" \
        sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
        echo "    staging DB ready"
        break
    fi
    sleep 2
    if [ "$i" = "30" ]; then
        echo "ERROR: staging DB not ready after 60s" >&2
        exit 1
    fi
done

# ── Step 3 — restore DB ────────────────────────────────────
if [ -f "$DB_DUMP" ]; then
    echo "==> Wiping staging schema '$DB_SCHEMA'..."
    docker exec "$STG_DB_CONTAINER" \
        sh -c "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c 'DROP SCHEMA IF EXISTS $DB_SCHEMA CASCADE;'"

    echo "==> Restoring $(basename "$DB_DUMP") into staging DB..."
    gunzip -c "$DB_DUMP" | docker exec -i "$STG_DB_CONTAINER" \
        sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=0' \
        > /dev/null
    echo "    DB restore complete"
else
    echo "==> No DB dump found at $DB_DUMP — skipping DB restore."
fi

# ── Step 4 — sync files volume ─────────────────────────────
if docker volume inspect "$PROD_FILES_VOLUME" >/dev/null 2>&1 \
   && docker volume inspect "$STG_FILES_VOLUME" >/dev/null 2>&1; then
    echo "==> Copying prod files volume → staging files volume..."
    docker run --rm \
        -v "$PROD_FILES_VOLUME":/source:ro \
        -v "$STG_FILES_VOLUME":/target \
        alpine sh -c 'find /target -mindepth 1 -delete 2>/dev/null; cp -a /source/. /target/'
    echo "    files sync complete"
else
    echo "==> Prod or staging files volume missing — skipping files sync."
fi

# ── Step 5 — restart staging API so it sees fresh data ─────
if docker ps --format '{{.Names}}' | grep -q '^stg-api-followers$'; then
    echo "==> Restarting stg-api-followers..."
    docker restart stg-api-followers >/dev/null
fi

echo "==> Prod → staging sync complete."
