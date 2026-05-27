# VPS Deployment

## DNS

Point these records to the VPS public IP before issuing certificates:

- `api.corecon.us`
- `admin.corecon.us`
- `cleaner.corecon.us`

## First-Time Server Setup

Install Docker, Docker Compose plugin, Git, and curl on the VPS. Then clone the repo:

```bash
git clone https://github.com/Wizar-Cyber/CleanYourSpace-.git /opt/corecon
cd /opt/corecon
```

Create the production environment file:

```bash
cp infrastructure/env.vps.example .env
nano .env
```

Use Docker service hostnames in `.env`: `postgres`, `redis`, and `minio`.

## SSL Certificates

Nginx expects certificates in the Docker volume `corecon_certbot_data`.
For a new VPS, issue them before starting the full stack:

```bash
docker volume create corecon_certbot_data

docker run --rm -p 80:80 \
  -v corecon_certbot_data:/etc/letsencrypt \
  -v corecon_certbot_data:/var/lib/letsencrypt \
  certbot/certbot certonly --standalone \
  -d api.corecon.us \
  -d admin.corecon.us \
  -d cleaner.corecon.us \
  --email admin@corecon.us \
  --agree-tos \
  --no-eff-email
```

## Deploy

```bash
bash infrastructure/scripts/deploy.sh
```

The script pulls `origin/master`, builds containers, starts the stack, runs TypeORM migrations, seeds initial data, and checks `http://localhost:4000/api/v1/health`.

## Operations

```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
docker compose -f infrastructure/docker/docker-compose.yml logs -f api
bash infrastructure/scripts/backup.sh
bash infrastructure/scripts/ssl-renew.sh
```

## Public URLs

- API: `https://api.corecon.us/api/v1/health`
- Admin: `https://admin.corecon.us`
- Cleaner: `https://cleaner.corecon.us`
