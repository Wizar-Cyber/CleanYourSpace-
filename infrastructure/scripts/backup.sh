#!/bin/bash
set -e

BACKUP_DIR="/backups/corecon"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-corecon}"
DB_USER="${DB_USER:-corecon}"

echo "=== Corecon Database Backup ==="

mkdir -p "$BACKUP_DIR"

echo "Backing up PostgreSQL..."
docker exec corecon-postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

echo "Backing up Redis..."
docker exec corecon-redis redis-cli SAVE
docker cp corecon-redis:/data/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"

echo "Cleaning backups older than 7 days..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "redis_*.rdb" -mtime +7 -delete

echo "=== Backup completed: $TIMESTAMP ==="
