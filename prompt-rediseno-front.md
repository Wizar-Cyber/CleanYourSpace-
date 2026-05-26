# PROMPT PARA REDISEÑAR FRONTEND - CORECON CLEANING SYSTEM

## Contexto del proyecto
SaaS de gestión de servicios de limpieza. Dos apps: **Admin Panel** (escritorio) y **Cleaner App** (móvil PWA). Backend NestJS + PostgreSQL (no disponible ahora, hay mock server).

## Stack
- React 18 + TypeScript + Vite + TailwindCSS (v3.4)
- React Router v6, TanStack Query, Lucide icons
- Cleaner App usa Dexie.js (IndexedDB) para offline
- Paquete compartido `@corecon/ui` con componentes base (Card, Button, Badge, StatusBadge, Input, Skeleton, SyncIndicator)

## Diseño actual - Colores (MANTENER)
```css
navy:   { dark: '#111E33', DEFAULT: '#1B2A4A', light: '#243A63', lighter: '#2E4A7A' }
gold:   { dark: '#A07830', DEFAULT: '#C9A84C', light: '#E0C070', lighter: '#F0DBA0' }
offwhite: '#F8F7F4'
surface: '#FFFFFF'
success: { DEFAULT: '#1E8449', bg: '#E9F7EF' }
error:   { DEFAULT: '#C0392B', bg: '#FDEDEC' }
warning: { DEFAULT: '#B7770D', bg: '#FEF9E7' }
info:    { DEFAULT: '#1A5276', bg: '#EAF2FF' }
```

## Tipografía
- Display: Outfit (Google Font) - títulos, headers, nav
- Body: Inter (Google Font) - párrafos, labels, tablas
- Tamaños base: 9px (labels/uppercase), 11px (body), 13px (body large), 16px-22px (títulos), 28px-32px (page titles)

## Ya implementado (NO CAMBIAR ESTRUCTURA)
- Sistema de sombras: `shadow-soft`, `shadow-card`, `shadow-elevated`, `shadow-modal`
- Border radius: `rounded-xl` (12px), `rounded-2xl` (24px)
- Layout Admin: sidebar 64px navy + main content scrollable
- Layout Cleaner: sticky header + bottom nav iOS-style + Outlet
- Componentes compartidos en `packages/ui/src/components/`:
  - Card: variants `default` | `elevated` | `glass`, prop `hover`, `onClick`
  - Button: variants `primary` | `secondary` | `outline-gold` | `destructive` | `ghost`, sizes `sm` | `md` | `lg`
  - StatusBadge: mapeo de estados (pending→warning, in_progress→gold, completed→success, etc.)
- Admin pages: Login, Dashboard (bento grid), Services, Cleaners, Assignments, Reports
- Cleaner pages: Login (con mustChangePassword), Dashboard, AssignmentDetail, Checklist, Photos, Profile
- Mock server en puerto 4000 con datos completos

## Archivos a modificar

### Admin Panel (`apps/admin-panel/src/`)
```
pages/Login.tsx          - Página de login con fondo navy gradient + glass card
pages/Dashboard.tsx      - Bento grid con KPI cards, resumen, quick actions
pages/Services.tsx       - Tabla con search + approve/reject + modal
pages/Cleaners.tsx       - Tabla con avatares initials + search + status dots
pages/Assignments.tsx    - Tabla con search
pages/Reports.tsx        - Empty state + tabla de reports
layouts/AdminLayout.tsx  - Sidebar navy con iconos + user section
index.css                - Clases utilitarias (page-container, table-container, etc.)
tailwind.config.js       - Colores, sombras, border-radius, fonts
```

### Cleaner App (`apps/cleaner-app/src/`)
```
pages/Login.tsx          - Login con mustChangePassword flow
pages/Dashboard.tsx      - Lista de assignments con service cards
pages/AssignmentDetail.tsx - Detalle con timer, checklist, photos
pages/Checklist.tsx      - Checklist items con toggle status
pages/Photos.tsx         - Grid de fotos con categorías
pages/Profile.tsx        - Perfil del cleaner
layouts/CleanerLayout.tsx - Header + bottom nav + outlet
index.css                - Clases mobile (service-card, bottom-nav, etc.)
tailwind.config.js       - Mismo que admin-panel
```

### Shared UI (`packages/ui/src/components/`)
```
Card.tsx      - Card, CardHeader, CardTitle, CardContent
Button.tsx    - Button con variants y sizes
StatusBadge.tsx   - Status → color mapping
Badge.tsx     - Badge genérico
Input.tsx     - Input con label + error + helperText
Skeleton.tsx  - Skeleton loading
SyncIndicator.tsx - Online/offline indicator
```

## Lo que queremos lograr
Diseño **moderno, profesional, limpio** tipo SaaS enterprise (ej: Linear, Height, Vercel). 
- Soft UI Evolution: sombras suaves, bordes redondeados, espacio generoso
- Bento grid en dashboard
- Cards con hover elevado
- Tablas limpias con header sutil
- Navegación intuitiva
- Mobile-first para Cleaner App (bottom navigation, gestos, touch targets 48px+)
- Consistencia visual entre ambas apps
- Efectos sutiles: transiciones 150-200ms, hover cards, foco visible

## Endpoints del Mock API (http://localhost:4000)
```
POST /api/v1/auth/login          → { user, tokens }
GET  /api/v1/users/me            → { data: user }
GET  /api/v1/services            → { data: [...], meta }
GET  /api/v1/services/summary    → { data: { pending, inProgress, ... } }
GET  /api/v1/assignments         → { data: [...], meta }
GET  /api/v1/assignments/today   → { data: [...] }
GET  /api/v1/assignments/summary → { data: { pending, inProgress, ... } }
GET  /api/v1/users               → { data: [...], meta }
GET  /api/v1/reports             → { data: [...], meta }
POST /api/v1/services/:id/approve
POST /api/v1/services/:id/reject → body: { rejectionNote }
```

## Cómo probar
```bash
# 1. Asegurar que el mock server corre
node mock-server.mjs

# 2. Iniciar frontends
pnpm --filter @corecon/admin-panel run dev    # http://localhost:5174
pnpm --filter @corecon/cleaner-app run dev   # http://localhost:5173

# 3. Login
# Admin: admin@corecon.us / admin123
# Cleaner: cleaner@corecon.us / password123
```

## Estructura de directorios
```
Cleaner Corecon.us/
├── apps/
│   ├── admin-panel/         # Admin Panel (React + Vite)
│   │   └── src/pages/       # Login, Dashboard, Services, Cleaners, Assignments, Reports
│   └── cleaner-app/         # Cleaner App (React + Vite + PWA)
│       └── src/pages/       # Login, Dashboard, AssignmentDetail, Checklist, Photos, Profile
├── packages/
│   └── ui/src/components/   # Card, Button, Input, Badge, StatusBadge, Skeleton, SyncIndicator
└── mock-server.mjs          # Mock API con datos completos
```
