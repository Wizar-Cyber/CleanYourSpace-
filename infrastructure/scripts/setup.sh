#!/bin/bash
set -e

echo "=== Corecon Initial Setup ==="

echo "1. Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Node.js is required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Installing pnpm..."; npm install -g pnpm; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }

echo "2. Installing dependencies..."
pnpm install

echo "3. Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file - please update with your values"
fi

echo "4. Starting infrastructure services..."
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres redis minio

echo "5. Waiting for database..."
sleep 5

echo "6. Running migrations..."
cd apps/api && npx typeorm migration:run -d src/database/data-source.ts && cd ../..

echo "7. Seeding initial data..."
cd apps/api && npx ts-node src/database/seed.ts && cd ../..

echo "=== Setup completed ==="
echo "Run 'pnpm dev' to start development servers"
