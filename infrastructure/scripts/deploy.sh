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
docker-compose -f infrastructure/docker/docker-compose.yml down
docker-compose -f infrastructure/docker/docker-compose.yml build
docker-compose -f infrastructure/docker/docker-compose.yml up -d

echo "4. Running database migrations..."
docker-compose -f infrastructure/docker/docker-compose.yml exec api npm run migration:run

echo "5. Checking health..."
sleep 5

if curl -f http://localhost:4000/api/v1/auth/health; then
  echo "=== Deployment successful ==="
else
  echo "=== Health check failed ==="
  exit 1
fi
