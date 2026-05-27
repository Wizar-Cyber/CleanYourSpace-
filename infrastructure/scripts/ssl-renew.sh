#!/bin/bash
set -e

echo "=== SSL Certificate Renewal ==="

docker run --rm \
  -v corecon_certbot_data:/etc/letsencrypt \
  -v corecon_certbot_data:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot renew --quiet

echo "Reloading nginx..."
docker exec corecon-nginx nginx -s reload

echo "=== SSL renewal completed ==="
