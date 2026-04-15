# Rollback — followers-api

Incident playbook. Scenarios are ordered from least to most destructive —
always try the top one first.

---

## Scenario 1 — Image rollback (most common)

Roll back to any previously-pushed tag without rebuilding. Data is untouched.

```bash
cd /opt/followers/followers-api

PREV=v1.8.0           # any tag already pushed to GHCR
git fetch --tags
git checkout "$PREV"

set -a; . ./.env.production; set +a
export API_IMAGE_TAG="$PREV"

docker compose -f docker-compose-production.yml pull prod-api-followers
docker compose -f docker-compose-production.yml up -d

curl -fsS http://localhost:5333/health | jq
```

**When this is NOT enough**: a migration ran before rollback — see Scenario 2.

---

## Scenario 2 — Bad migration (image + DB restore)

Prisma migrations are forward-only. If the new release shipped a broken
migration, rolling the image back alone leaves the schema ahead of the code.
You must restore the DB from the pre-deploy backup.

```bash
cd /opt/followers/followers-api

# 1. Capture the broken state for forensics (optional)
TS=$(date +%Y%m%d_%H%M%S)
docker exec prod_followers_bicara_postgre \
    sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
    | gzip > "backups/prod_broken_${TS}.sql.gz"

# 2. Find the most recent pre-deploy backup (created by deploy-prod.yml)
ls -lht backups/*/prod_db_*.sql.gz | head -5
BACKUP=backups/20260415/prod_db_20260415_141830.sql.gz    # <- pick yours

# 3. Drop + restore
docker exec prod_followers_bicara_postgre \
    sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA IF EXISTS followers CASCADE;"'

gunzip -c "$BACKUP" | docker exec -i prod_followers_bicara_postgre \
    sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# 4. Roll the image back (as in Scenario 1)
PREV=v1.8.0
git fetch --tags && git checkout "$PREV"
set -a; . ./.env.production; set +a
export API_IMAGE_TAG="$PREV"
docker compose -f docker-compose-production.yml pull prod-api-followers
docker compose -f docker-compose-production.yml up -d

# 5. Verify
curl -fsS http://localhost:5333/health | jq
```

**Data loss window**: all writes between pre-deploy backup and rollback are
lost. Coordinate with users if the window is non-trivial.

---

## Scenario 3 — Corrupted file uploads

If bad code overwrote avatars/photos, restore the files volume tar.

```bash
cd /opt/followers/followers-api

# Find the most recent files backup
LATEST_FILES=$(ls -t backups/*/prod_files_*.tar.gz | head -1)
echo "Restoring: $LATEST_FILES"

# Wipe staging volume and untar
docker run --rm \
    -v prod_volume_api_followers:/target \
    -v "$(pwd)/$(dirname "$LATEST_FILES")":/backup:ro \
    alpine sh -c "find /target -mindepth 1 -delete && tar xzf /backup/$(basename "$LATEST_FILES") -C /target"
```

---

## Scenario 4 — Full disaster recovery (VPS loss)

**Prerequisite**: offsite backup to R2 is active (`OFFSITE_REMOTE` set and
rclone installed — see DEPLOY.md). Without offsite, recovery is not possible
from a total VPS loss.

```bash
# On the new VPS, after bootstrap (see DEPLOY.md § VPS bootstrap):
cd /opt/followers/followers-api

# 1. Pull latest DB + files backup from R2
rclone copy r2:followers-backups/prod_db_LATEST.sql.gz     backups/restore/
rclone copy r2:followers-backups/prod_files_LATEST.tar.gz  backups/restore/

# (Pick the exact filenames with: rclone ls r2:followers-backups/ | sort)

# 2. Bring up postgres first (empty DB)
set -a; . ./.env.production; set +a
docker compose -f docker-compose-production.yml up -d prod_followers_bicara_postgre

# 3. Restore DB
gunzip -c backups/restore/prod_db_*.sql.gz | docker exec -i prod_followers_bicara_postgre \
    sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# 4. Restore files volume
docker run --rm \
    -v prod_volume_api_followers:/target \
    -v "$(pwd)/backups/restore":/backup:ro \
    alpine sh -c 'tar xzf /backup/prod_files_*.tar.gz -C /target'

# 5. Pull API image and start
export API_IMAGE_TAG=v1.8.0   # last known-good tag
docker compose -f docker-compose-production.yml pull prod-api-followers
docker compose -f docker-compose-production.yml up -d

curl -fsS http://localhost:5333/health | jq
```

**RTO** (Recovery Time Objective): ~2h assuming fresh VPS, DNS already
points correctly, and offsite backup is recent.

---

## Debugging a failed rollback

```bash
docker compose -f docker-compose-production.yml logs --tail=200 prod-api-followers
docker inspect prod-api-followers --format '{{.State.Health.Status}}'
curl -sS http://localhost:5333/health | jq
```

Common gotchas:
- Schema mismatch → Prisma migrate errors at boot; need DB restore (Scenario 2).
- GHCR auth expired → `docker login ghcr.io -u rizjamiputera`.
- Env file changed between tags → reload with `set -a; . ./.env.production; set +a`.
