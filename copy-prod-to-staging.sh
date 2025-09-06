#!/bin/bash

# Script to copy production volumes to staging for safe testing
# This allows testing against real production data without affecting production

set -e

echo "🚀 Starting production to staging volume copy..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if production containers are running
if ! docker ps | grep -q "prod_followers_bicara_postgre"; then
    echo -e "${RED}❌ Production database container not found or not running${NC}"
    echo "Please ensure production containers are running"
    exit 1
fi

if ! docker ps | grep -q "prod-api-followers"; then
    echo -e "${RED}❌ Production API container not found or not running${NC}"
    echo "Please ensure production containers are running"
    exit 1
fi

# Stop staging containers if they're running
echo -e "${YELLOW}📋 Stopping staging containers if running...${NC}"
docker-compose -f docker-compose-staging.yml down --volumes || true

# Create timestamp for backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 1. Copy database data
echo -e "${YELLOW}🗄️  Creating database backup from production...${NC}"
docker exec prod_followers_bicara_postgre pg_dump -U followersBicaraDong -d postgres > "/tmp/staging_db_backup_${TIMESTAMP}.sql"

# 2. Copy file volumes (public files like images)
echo -e "${YELLOW}📁 Creating file backup from production...${NC}"
docker run --rm \
  -v prod_volume_api_followers:/source:ro \
  -v /tmp:/backup \
  alpine tar czf "/backup/staging_files_backup_${TIMESTAMP}.tar.gz" -C /source .

# 3. Start staging database container first
echo -e "${YELLOW}🐘 Starting staging database container...${NC}"
docker-compose -f docker-compose-staging.yml up -d stg_followers_bicara_postgre

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for staging database to be ready...${NC}"
sleep 10

# 4. Restore database to staging
echo -e "${YELLOW}📥 Restoring database to staging...${NC}"
docker exec -i stg_followers_bicara_postgre psql -U followersBicaraDong -d postgres < "/tmp/staging_db_backup_${TIMESTAMP}.sql"

# 5. Restore files to staging
echo -e "${YELLOW}📥 Restoring files to staging...${NC}"
docker run --rm \
  -v stg_volume_api_followers:/target \
  -v /tmp:/backup \
  alpine sh -c "cd /target && tar xzf /backup/staging_files_backup_${TIMESTAMP}.tar.gz"

# 6. Start the full staging environment
echo -e "${YELLOW}🚀 Starting full staging environment...${NC}"
docker-compose -f docker-compose-staging.yml up -d

# 7. Clean up temporary files
echo -e "${YELLOW}🧹 Cleaning up temporary files...${NC}"
rm -f "/tmp/staging_db_backup_${TIMESTAMP}.sql"
rm -f "/tmp/staging_files_backup_${TIMESTAMP}.tar.gz"

# 8. Wait for staging to be ready
echo -e "${YELLOW}⏳ Waiting for staging services to be ready...${NC}"
sleep 15

# 9. Verify staging is running
if docker ps | grep -q "stg-api-followers" && docker ps | grep -q "stg_followers_bicara_postgre"; then
    echo -e "${GREEN}✅ Staging environment is now running with production data!${NC}"
    echo ""
    echo "🌐 Staging URLs:"
    echo "   - API: http://localhost:5777"
    echo "   - Debug: http://localhost:5888"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Update your frontend to point to staging API (localhost:5777)"
    echo "   2. Test your changes against real production data"
    echo "   3. When ready, deploy to production using: docker-compose -f docker-compose-production.yml up -d"
    echo ""
    echo "⚠️  Note: Changes in staging won't affect production data"
else
    echo -e "${RED}❌ Something went wrong. Check container status with: docker ps${NC}"
    exit 1
fi