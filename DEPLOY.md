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

For rollback procedures (image rollback, DB restore, disaster recovery)
see [ROLLBACK.md](./ROLLBACK.md).

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

## Daily backup cron

Pre-deploy backups happen automatically, but only when deploys run. For
days without a deploy, add a nightly cron so you always have a ≤24h-old
backup.

```bash
crontab -e
```

Add:
```cron
# Daily DB + files backup at 02:00 — retention handled by the script
0 2 * * * cd /opt/followers/followers-api && BACKUP_DIR=/opt/followers/followers-api/backups bash scripts/backup-prod.sh --backup-only >> /var/log/followers-backup.log 2>&1
```

Verify after the first run:
```bash
tail -f /var/log/followers-backup.log
ls -lh /opt/followers/followers-api/backups/$(date +%Y%m%d)/
```

## Offsite backup (Cloudflare R2)

Local backups don't help if the VPS disk dies — push to external object
storage. We share the Cloudflare R2 account already used by quran.

### One-time setup on the VPS

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure R2 (interactive; use the same R2 creds as quran)
rclone config
# n) New remote
# name> r2
# Storage> s3
# provider> Cloudflare
# access_key_id> <from Cloudflare R2 dashboard>
# secret_access_key> <from Cloudflare R2 dashboard>
# endpoint> https://<accountid>.r2.cloudflarestorage.com
# region> auto
```

Create a new bucket for followers (separate from quran-backups):
1. Cloudflare dashboard → R2 → Create bucket → `followers-backups`
2. Region: auto

Test write:
```bash
echo "hello" > /tmp/test.txt
rclone copy /tmp/test.txt r2:followers-backups/
rclone ls r2:followers-backups/
rclone delete r2:followers-backups/test.txt
```

### Enable in followers

Edit `.env.production` on the VPS:
```bash
OFFSITE_REMOTE=r2:followers-backups
```

Both the nightly cron and the pre-deploy backup will now upload each dump
to R2. Failures are non-fatal (local copy is always kept) and log a
`WARN` line.

Verify after the next run:
```bash
rclone ls r2:followers-backups/ | tail -5
```

**R2 free tier**: 10 GB storage + unlimited egress — plenty for 30 daily
dumps.

## Monitoring (Uptime Kuma)

Reuse the existing `quran-uptime-kuma` container running on the VPS at
`127.0.0.1:3030`. SSH-tunnel to the UI:

```bash
ssh -L 3030:127.0.0.1:3030 deploy@VPS_HOST
# open http://localhost:3030
```

Add two HTTP(S) monitors:

| Name | URL | Interval |
|---|---|---|
| followers-api prod | `https://api.followersbicara.com/health` | 60s |
| followers-api stg  | `https://stg-api.followersbicara.com/health` | 300s |

Both expect HTTP 200; Kuma will alert if `/health` returns 503 (DB down)
or the endpoint is unreachable.

## Debugging a failed deploy

```bash
docker compose -f docker-compose-production.yml logs --tail=200 prod-api-followers
docker inspect prod-api-followers --format '{{.State.Health.Status}}'
curl -sS http://localhost:5333/health | jq
```

Common causes:
- `.env.production` missing or empty key → pre-flight fails before pull.
- Migration failed on boot → container crashloops; see ROLLBACK.md § Scenario 2.
- `docker login` to GHCR expired (private package) → `docker login ghcr.io` again.
