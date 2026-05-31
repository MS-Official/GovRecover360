#!/bin/bash

set -e

ENV_FILE="${1:-.env.demo}"

echo "🚀 GovRecover360 Quick Demo Check"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Missing $ENV_FILE"
  exit 1
fi

docker compose --env-file "$ENV_FILE" up -d --build
docker compose --env-file "$ENV_FILE" ps

echo ""
echo "Checking services..."

curl -i http://localhost:3000
curl -i http://localhost:8000/api/health
curl -i http://localhost/api/health
curl -i http://localhost:8070/api/health
curl -i http://localhost:8243/health
curl -i http://localhost:8243/services/Version
curl -i http://localhost:8243/api/health
curl -i http://localhost:8095/health
curl -i http://localhost:8050/health

echo ""
echo "✅ Quick check completed"