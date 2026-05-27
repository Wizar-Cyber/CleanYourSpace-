#!/bin/bash
set -e

echo "=== Corecon Deployment Script ==="

cd "$(dirname "$0")/../.."

echo "1. Loading environment..."
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "2. Pulling latest changes..."
git pull origin main

echo "3. Building and starting containers..."
docker compose -f infrastructure/docker/docker-compose.yml down
docker compose -f infrastructure/docker/docker-compose.yml build
docker compose -f infrastructure/docker/docker-compose.yml up -d

# First-time setup: seed creates schema + data (safe to re-run)
echo "4. Running database migrations..."
docker compose -f infrastructure/docker/docker-compose.yml exec -T api node dist/database/migrations/1779850685448-CreateAllTables.js 2>/dev/null || true
docker compose -f infrastructure/docker/docker-compose.yml exec -T api node dist/database/migrations/1779850877577-DropTimeRecordUpdatedAt.js 2>/dev/null || true

echo "5. Running TypeORM migrations..."
docker compose -f infrastructure/docker/docker-compose.yml exec -T api node dist/database/data-source.js 2>/dev/null && \
docker compose -f infrastructure/docker/docker-compose.yml exec -T api npx typeorm migration:run -d dist/database/data-source.js || true

echo "6. Seeding initial data..."
docker compose -f infrastructure/docker/docker-compose.yml exec -T api node dist/database/seed.js 2>/dev/null || echo "Seed script not compiled — skipping (safe to run manually)"

echo "6. Checking health..."
sleep 10

if curl -sf http://localhost:4000/api/v1/health; then
  echo "=== Deployment successful ==="
else
  echo "=== Health check failed ==="
  exit 1
fi
