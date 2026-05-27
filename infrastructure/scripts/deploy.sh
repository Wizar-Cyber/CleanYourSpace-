#!/bin/bash
set -e

echo "=== Corecon Deployment Script ==="

cd "$(dirname "$0")/../.."

echo "1. Loading environment..."
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

echo "2. Pulling latest changes..."
DEPLOY_BRANCH="${DEPLOY_BRANCH:-master}"
git pull origin "$DEPLOY_BRANCH"

echo "3. Building and starting containers..."
docker compose -f infrastructure/docker/docker-compose.yml down
docker compose -f infrastructure/docker/docker-compose.yml build
docker compose -f infrastructure/docker/docker-compose.yml up -d

echo "4. Running TypeORM migrations..."
docker compose -f infrastructure/docker/docker-compose.yml exec -T api npx typeorm migration:run -d dist/database/data-source.js

echo "5. Seeding initial data..."
docker compose -f infrastructure/docker/docker-compose.yml exec -T api node dist/database/seed.js 2>/dev/null || echo "Seed script not compiled — skipping (safe to run manually)"

echo "6. Checking health..."
sleep 10

if curl -sf http://localhost:4000/api/v1/health; then
  echo "=== Deployment successful ==="
else
  echo "=== Health check failed ==="
  exit 1
fi
