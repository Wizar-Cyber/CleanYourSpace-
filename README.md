# Corecon Cleaning System

Enterprise cleaning services management platform built with clean architecture, offline-first PWA, and real-time capabilities.

## Architecture

```
corecon/
├── apps/
│   ├── cleaner-app/     # Mobile-first PWA (React + Vite)
│   ├── admin-panel/     # Desktop SPA (React + Vite)
│   └── api/             # NestJS REST API + WebSockets
├── packages/
│   ├── ui/              # Shared UI components
│   ├── types/           # Shared TypeScript types/DTOs
│   ├── i18n/            # Internationalization (EN/ES)
│   ├── eslint-config/   # Shared ESLint config
│   └── tsconfig/        # Shared TypeScript configs
├── infrastructure/
│   ├── docker/          # Docker Compose + Dockerfiles
│   ├── nginx/           # Nginx reverse proxy config
│   └── scripts/         # Deployment/backup scripts
└── docs/                # Documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS |
| State | React Query, Dexie.js (offline) |
| Backend | NestJS, TypeORM, PostgreSQL |
| Realtime | Socket.io, Redis, BullMQ |
| Storage | MinIO (S3-compatible) |
| Auth | JWT (access + refresh tokens) |
| PWA | Vite PWA Plugin, Workbox |
| i18n | i18next (English/Spanish) |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure services
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres redis minio

# Copy environment file
cp .env.example .env

# Run database migrations
cd apps/api && pnpm migration:run && cd ../..

# Seed initial data
cd apps/api && pnpm ts-node src/database/seed.ts && cd ../..

# Start development servers
pnpm dev
```

### Development URLs

- **Admin Panel**: http://localhost:5174
- **Cleaner App**: http://localhost:5173
- **API**: http://localhost:4000
- **MinIO Console**: http://localhost:9001

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@corecon.us | Admin123! |
| Cleaner | maria@corecon.us | Cleaner123! |

## Key Features

- **Offline-first Cleaner App**: Full functionality without internet, background sync
- **GPS Validation**: Haversine-based location verification
- **Real-time Tracking**: Socket.io powered live updates
- **Checklist System**: Configurable templates with photo attachments
- **Photo Management**: Client-side compression, MinIO storage, signed URLs
- **Reporting**: Automated weekly PDF/Excel reports via BullMQ
- **Notifications**: In-app and push notifications
- **i18n**: Full English/Spanish support

## Security

- JWT access tokens (15min) + refresh token rotation
- bcrypt (12 rounds) password hashing
- Role-based access control (Admin/Cleaner)
- Ownership validation guards
- Rate limiting via @nestjs/throttler
- Helmet security headers
- Input validation via DTOs
- Signed MinIO URLs for photo uploads

## API Documentation

Once running, API documentation is available at `/api/docs` (Swagger).

### Core Endpoints

```
POST   /api/v1/auth/register     Register new user
POST   /api/v1/auth/login        Login
POST   /api/v1/auth/refresh      Refresh tokens
GET    /api/v1/users             List users (admin)
GET    /api/v1/users/me          Current user profile
GET    /api/v1/services          List services
POST   /api/v1/services          Create service (admin)
GET    /api/v1/assignments       List assignments (admin)
GET    /api/v1/assignments/today Today's assignments (cleaner)
POST   /api/v1/assignments       Create assignment (admin)
POST   /api/v1/assignments/:id/start Start service
POST   /api/v1/assignments/:id/complete Complete service
GET    /api/v1/checklist/assignment/:id Get checklist
PUT    /api/v1/checklist/item/:id Update checklist item
POST   /api/v1/location/log      Log location
POST   /api/v1/location/validate Validate GPS proximity
POST   /api/v1/sync/enqueue      Queue offline sync items
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm --filter @corecon/api test:e2e

# Lint
pnpm lint
```

## Deployment

```bash
# Full production deployment
bash infrastructure/scripts/deploy.sh

# Database backup
bash infrastructure/scripts/backup.sh

# SSL renewal
bash infrastructure/scripts/ssl-renew.sh
```

## License

Proprietary - Corecon Cleaning System
