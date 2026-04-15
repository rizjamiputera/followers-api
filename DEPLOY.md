# Deploy — followers-api

Tag-based deploy to a VPS. GitHub Actions builds the image and pushes to
GHCR; the VPS pulls and rolls the container. No build happens on the VPS.

## How it deploys

| Tag pattern | Target | Workflow | Image tag |
|---|---|---|---|
| `v*` (e.g. `v1.8.0`) | Production | `deploy-prod.yml` | `ghcr.io/rizjamiputera/followers-api:v1.8.0` + `:latest` |
| `stg-*` (e.g. `stg-0.1.0`) | Staging | `deploy-stg.yml` | `ghcr.io/rizjamiputera/followers-api:stg-0.1.0` + `:stg-latest` |

Flow per deploy: lint/build → build+push image → SSH to VPS → pre-flight
env check → `backup-prod.sh` (prod only) or `sync-prod-to-staging.sh`
(staging) → `docker compose pull && up -d` → poll `/health`.

## Release commands

```bash
# Production
git checkout main && git pull
git tag v1.8.1 && git push origin v1.8.1

# Staging
git checkout stg && git pull
git tag stg-0.1.0 && git push origin stg-0.1.0
```

## VPS bootstrap (one-time per environment)

```bash
# Prod
sudo mkdir -p /opt/followers/followers-api
sudo chown $USER:$USER /opt/followers/followers-api
cd /opt/followers/followers-api
git clone git@github.com:rizjamiputera/followers-api.git .

cp .env.production.example .env.production
# edit .env.production — set real JWTSECRET, DB_PASSWORD, EMAIL_PASSWORD
```

For staging, repeat with `.env.staging`. JWT secrets and DB password MUST
differ from prod (the stg workflow rejects identical env files).

GHCR access: if the package is private, run once on the VPS:
```bash
echo $GHCR_PAT | docker login ghcr.io -u rizjamiputera --password-stdin
```

## Required GitHub secrets

| Secret | Value |
|---|---|
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | `deploy` (or the user who owns `/opt/followers`) |
| `VPS_SSH_KEY` | private SSH key |
| `VPS_PORT` | `22` |
| `PROJECT_DIR` | optional; defaults to `/opt/followers/followers-api` |

## Rollback

Roll back to any previously-pushed tag without rebuilding.

```bash
# On VPS
cd /opt/followers/followers-api

PREV=v1.8.0         # <- target tag (any tag already pushed to GHCR)
git fetch --tags
git checkout "$PREV"

set -a; . ./.env.production; set +a
export API_IMAGE_TAG="$PREV"

docker compose -f docker-compose-production.yml pull prod-api-followers
docker compose -f docker-compose-production.yml up -d

curl -fsS http://localhost:5333/health
```

Same pattern for staging — use `docker-compose-staging.yml`,
`.env.staging`, `STG_API_IMAGE_TAG`, port `5777`.

### Database rollback

If a failed deploy ran a migration that needs reverting, restore from the
most recent pre-deploy backup (auto-created by `backup-prod.sh`, retained
as the last 10):

```bash
cd /opt/followers/followers-api
LATEST=$(ls -t backups/*/prod_db_*.sql.gz | head -1)
echo "Restoring: $LATEST"

gunzip -c "$LATEST" | docker exec -i prod_followers_bicara_postgre \
    sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Full file-volume restore (rare):
```bash
LATEST_FILES=$(ls -t backups/*/prod_files_*.tar.gz | head -1)
docker run --rm \
    -v prod_volume_api_followers:/target \
    -v "$(pwd)/$(dirname $LATEST_FILES)":/backup:ro \
    alpine sh -c "find /target -mindepth 1 -delete; tar xzf /backup/$(basename $LATEST_FILES) -C /target"
```

## Debugging a failed deploy

```bash
# Recent deploy logs from GH Actions → re-run with SSH into the job
docker compose -f docker-compose-production.yml logs --tail=200 prod-api-followers
docker inspect prod-api-followers --format '{{.State.Health.Status}}'
curl -sS http://localhost:5333/health | jq
```

Common causes:
- `.env.production` missing or empty key → pre-flight fails before pull.
- Migration failed on boot → container crashloops; check logs for Prisma error, then use DB rollback above.
- `docker login` to GHCR expired (private package) → `docker login ghcr.io` again.
