#!/usr/bin/env bash
# backup-prod.sh — production DB dump + files volume tar.
#
# Modes:
#   (default)       Full backup, emits the timestamp on the final stdout line
#                   so sync-prod-to-staging.sh can chain into it.
#   --backup-only   Backup mode for the nightly cron. No timestamp echo.
#
# Outputs:
#   $BACKUP_DIR/YYYYMMDD/prod_db_<timestamp>.sql.gz
#   $BACKUP_DIR/YYYYMMDD/prod_files_<timestamp>.tar.gz
#
# Retention: keeps last 30 of each; prunes empty date folders >1 day old.
#
# Offsite upload (optional): set OFFSITE_REMOTE in .env.production (e.g.
# "r2:followers-backups") — rclone must be installed & configured on the
# VPS. Failures never abort the backup; the local copy is always kept.
#
# Skips gracefully if prod stack is not running / not seeded.

set -euo pipefail

# Auto-source .env.production if it sits next to us (for cron + manual runs).
# Deploy workflow already sources it — this is harmless there.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR%/scripts}/.env.production"
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
fi

PROD_DB_CONTAINER="${PROD_DB_CONTAINER:-prod_followers_bicara_postgre}"
PROD_FILES_VOLUME="${PROD_FILES_VOLUME:-prod_volume_api_followers}"
BACKUP_DIR="${BACKUP_DIR:-$(pwd)/backups}"

# DB credentials come from .env.production (sourced above). We pass them to
# pg_dump from the host instead of relying on $POSTGRES_USER inside the
# container — the running prod container may predate the compose
# `environment:` block and not carry those vars, which makes pg_dump fall
# back to the OS user "root" and fail with `role "root" does not exist`.
DB_USER="${DB_USER:-followersBicaraDong}"
DB_NAME="${DB_NAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

BACKUP_ONLY=false
for arg in "$@"; do
    case "$arg" in
        --backup-only) BACKUP_ONLY=true ;;
        *) echo "Unknown arg: $arg" >&2; exit 1 ;;
    esac
done

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DATE_FOLDER="$(date +%Y%m%d)"
TARGET_DIR="$BACKUP_DIR/$DATE_FOLDER"
mkdir -p "$TARGET_DIR"

DB_OUT="$TARGET_DIR/prod_db_${TIMESTAMP}.sql.gz"
FILES_OUT="$TARGET_DIR/prod_files_${TIMESTAMP}.tar.gz"

log() { echo "$@" >&2; }

# ── Helper: offsite upload (optional, failures non-fatal) ──
offsite_upload() {
    local file="$1"
    [ -z "${OFFSITE_REMOTE:-}" ] && return 0
    [ -f "$file" ] || return 0
    if ! command -v rclone >/dev/null 2>&1; then
        log "    WARN: OFFSITE_REMOTE set but rclone not installed — skipping upload"
        return 0
    fi
    log "    Uploading $(basename "$file") → $OFFSITE_REMOTE/$DATE_FOLDER/"
    if rclone copy "$file" "$OFFSITE_REMOTE/$DATE_FOLDER/" --quiet; then
        log "    Offsite upload OK"
    else
        log "    WARN: offsite upload failed (local copy kept in $BACKUP_DIR)"
    fi
}

log "==> Backup destination: $TARGET_DIR"

# ── DB dump ────────────────────────────────────────────────
if docker ps --format '{{.Names}}' | grep -q "^${PROD_DB_CONTAINER}$"; then
    log "==> Dumping production database..."
    docker exec -e PGPASSWORD="$DB_PASSWORD" "$PROD_DB_CONTAINER" \
        pg_dump -U "$DB_USER" -d "$DB_NAME" \
        | gzip > "$DB_OUT"
    log "    saved: $(basename "$DB_OUT") ($(du -h "$DB_OUT" | cut -f1))"
    if gzip -t "$DB_OUT" 2>/dev/null; then
        log "    integrity check: OK"
    else
        log "    ERROR: DB dump is corrupt — $(basename "$DB_OUT")"
    fi
    offsite_upload "$DB_OUT"
else
    log "==> $PROD_DB_CONTAINER not running — skipping DB backup."
fi

# ── Files volume tar ───────────────────────────────────────
if docker volume inspect "$PROD_FILES_VOLUME" >/dev/null 2>&1; then
    log "==> Archiving production files volume..."
    docker run --rm \
        --user "$(id -u):$(id -g)" \
        -v "$PROD_FILES_VOLUME":/source:ro \
        -v "$TARGET_DIR":/backup \
        alpine tar czf "/backup/prod_files_${TIMESTAMP}.tar.gz" -C /source .
    log "    saved: $(basename "$FILES_OUT") ($(du -h "$FILES_OUT" | cut -f1))"
    if gzip -t "$FILES_OUT" 2>/dev/null; then
        log "    integrity check: OK"
    else
        log "    ERROR: files archive is corrupt — $(basename "$FILES_OUT")"
    fi
    offsite_upload "$FILES_OUT"
else
    log "==> $PROD_FILES_VOLUME not found — skipping files backup."
fi

# ── Retention: keep last 30 of each ───────────────────────
log "==> Pruning old backups (keep last 30 of each)..."
find "$BACKUP_DIR" -name 'prod_db_*.sql.gz' -type f -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | tail -n +31 | cut -d' ' -f2- | xargs -r rm -f
find "$BACKUP_DIR" -name 'prod_files_*.tar.gz' -type f -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | tail -n +31 | cut -d' ' -f2- | xargs -r rm -f
find "$BACKUP_DIR" -type d -empty -mtime +1 -delete 2>/dev/null || true

if [ "$BACKUP_ONLY" = "true" ]; then
    log "==> Backup-only mode complete."
    exit 0
fi

# Emit timestamp on final stdout line for chained callers (sync script).
echo "$TIMESTAMP"
