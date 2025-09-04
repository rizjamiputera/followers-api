#!/bin/bash

# Simple staging deployment script
# Copies production volumes and starts staging environment

set -e

echo "🚀 Deploying staging environment with production data..."

# Stop staging if running
echo "📋 Stopping existing staging containers..."
docker-compose -f docker-compose-staging.yml down --volumes 2>/dev/null || true

# Start staging with volume copying
echo "🔄 Starting staging environment (this will copy production data)..."
docker-compose -f docker-compose-staging.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if containers are running
if docker ps | grep -q "stg-api-followers" && docker ps | grep -q "stg_followers_bicara_postgre"; then
    echo "✅ Staging environment is now running!"
    echo ""
    echo "🌐 Staging URLs:"
    echo "   - API: http://localhost:5777"
    echo "   - Debug: http://localhost:5888"
    echo ""
    echo "📋 Container status:"
    docker ps --filter "name=stg" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ Something went wrong. Check container logs:"
    echo "docker-compose -f docker-compose-staging.yml logs"
    exit 1
fi