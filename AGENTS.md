# AGENTS.md — Bioactiva CRM Backend

## Quick start

```bash
# Prerequisites: Docker containers for postgres + redis
docker compose --profile local up -d bioactiva-database bioactiva-redis
# Or, if already running a postgres container, ensure user/DB match .env

npm run start:dev   # nest start --watch (compiles ts on the fly)
```

## Architecture

- **NestJS 11 + TypeScript** (module resolution: `nodenext`)
- **DDD layers** per module: `domain/` (entities, ports, exceptions), `application/` (use-cases, DTOs), `infrastructure/` (http, persistance, services)
- **Prisma 7** with `@prisma/adapter-pg` (native driver, not the engine). Datasource URL is set at runtime via `prisma.config.ts` for CLI and `PrismaService` (env `DATABASE_URL`) for runtime.
- **Path aliases**: `@/` → `src/`, `@modules/` → `src/modules/`, `@shared/` → `src/shared/`
- **DI**: Use custom `@Inject(SYMBOL)` from `@/shared/infrastructure/dependency-inyection/inyect` + `Symbol` in domain port files. Never use `@Injectable()` on use-cases.
- **PrismaModule** is `@Global()` in `AppModule` — no need to import in feature modules.

## Module conventions (see `skills/skills_fundamentals.md`)

```
src/modules/<name>/
├── <name>.module.ts
├── domain/
│   ├── entities/         # Stateful domain entities (methods: activate, deactivate, etc.)
│   ├── ports/            # Interfaces + Symbol for DI
│   └── exceptions/       # Domain-specific error classes
├── application/
│   ├── use-cases/        # Orchestrate ports, throw domain exceptions
│   └── dto/              # Application DTOs
└── infrastructure/
    ├── http/
    │   ├── <name>.controller.ts
    │   └── dtos/          # HTTP request/response DTOs (*.dto.http.ts naming)
    ├── persistance/       # Prisma repositories (implement domain ports)
    ├── mapper/            # toDomain / toPersistence
    └── services/          # External service adapters
```

- **Symbols** must NOT share name with the interface (e.g. `ORGANIZATION_REPOSITORY`, not `IOrganizationRepository` as both value+type).
- **Enums**: Use string-valued enums (`ACTIVO = 'ACTIVO'`), not numeric.
- **Controller returns DTOs**, never domain entities directly.
- **Repositories** inject `PrismaService` via `@Inject(PRISMA_SERVICE)` (string token) or class token.

## Commands

```bash
npm run start:dev    # Dev with watch (lee LOCAL_DATABASE_URL del .env)
npm run build        # Compile
npm run test         # prisma generate + jest
npm run lint         # ESLint
npx prisma generate  # After schema changes
npx prisma migrate deploy   # Apply pending migrations
npx prisma migrate dev      # Create+apply new migration (dev only)
```

**Key package.json insights:**
- `packageManager: pnpm@10.9.0` — este proyecto usa **pnpm** (no npm) como gestor de paquetes
- `test` siempre ejecuta `prisma generate` antes de jest — los tests dependen del Prisma Client generado
- `build` usa `nest build` (TypeScript compilado a `dist/`)
- `start:prod` usa `node -r tsconfig-paths/register dist/main.js` (con resolución de path aliases)
- BullMQ para colas de trabajos asíncronos (reset password, invitations emails)
- Swagger (`@nestjs/swagger`) disponible para documentación API

**Key tsconfig.json insights:**
- `module: nodenext` + `moduleResolution: nodenext` — imports con extensión `.js` requeridos por el compilador de TypeScript (aunque los archivos fuente son `.ts`)
- `target: ES2023` — compila a ES moderno
- `strictNullChecks: true` pero `noImplicitAny: false` — tipos null estrictos, pero `any` implícito permitido
- `decorators` habilitados (`emitDecoratorMetadata`, `experimentalDecorators`)
- Path aliases: `@/` → `src/`, `@modules/` → `src/modules/`, `@shared/` → `src/shared/`

## Key modules

| Module | Path | Notes |
|---|---|---|
| `users` | `src/modules/users/` | User CRUD, admin initializer on startup |
| `auth` | `src/modules/auth/` | JWT login, refresh, guards (JwtAuthGuard, RolesGuard) |
| `organizations` | `src/modules/organizations/` | Org CRUD + SUNAT scraper integration |
| `contacts` | `src/modules/contacts/` | Contact CRUD, linked to organizations |
| `invitations` | `src/modules/invitations/` | User invitation flow with email queue |
| `reset_password` | `src/modules/reset_password/` | Password reset with BullMQ queues + expiration |

## SUNAT scraper (Python)

- **FastAPI app** at `sunat-app/main.py`, port 8000
- Uses **Playwright** (Chromium headless) for web scraping — no API key needed
- Endpoints: `GET /consultar-ruc?ruc=XXXX` and `GET /consultar-nombre?nombre=XXXX`
- Returns camelCase JSON with pre-mapped `tipo` (EnterpriseType) and `sector` (Sector)
- Connection from NestJS via `SunatWebScraperAdapter` in `organizations/infrastructure/service/`
- `PYTHON_SCRAPER_URL` env var configures the base URL
- **Docker build**: `playwright install --with-deps chromium` (omite FFMPEG, ahorra ~200 MB)

## Two modes: Local dev vs Docker

The `.env` has separate variables for each mode:

| Variable | Local (`npm run start:dev`) | Docker (`docker compose up`) |
|---|---|---|
| `DATABASE_URL` | `LOCAL_DATABASE_URL` (localhost:5435) | `DOCKER_DATABASE_URL` (bioactiva-database:5432) |
| `REDIS_URL` | `LOCAL_REDIS_URL` (localhost:6380) | `DOCKER_REDIS_URL` (bioactiva-redis:6379) |
| `PYTHON_SCRAPER_URL` | `localhost:8000` | `bioactiva-sunat-local:8000` |

The default `DATABASE_URL` and `REDIS_URL` in `.env` point to localhost for `npm run start:dev`. Docker compose overrides them with `DOCKER_*` vars.

## Docker

### Development workflow (local)

```bash
# Solo infraestructura (recomendado para dev con hot-reload)
docker compose --profile local up -d bioactiva-database bioactiva-redis bioactiva-sunat-local

# Backend local con watch (hot-reload, compila en caliente)
npm run start:dev
```

### Full stack (todo en Docker, sin hot-reload)

```bash
# Antes de levantar, limpiar contenedores de proyectos anteriores
docker stop backend-bioactiva-database-1 backend-bioactiva-redis-1 bioactiva-db
docker rm backend-bioactiva-database-1 backend-bioactiva-redis-1 bioactiva-db

docker compose --profile local up -d
# Levanta: postgres (5435), redis (6380), sunat (8000), backend (3000)
```

### Production profile (`docker compose --profile prod up -d`)

- **No incluye postgres ni redis** — asume servicios administrados (RDS, ElastiCache)
- Usa `env_file: .env` para cargar toda la configuración
- `container_name: bioactiva-backend-prod` fijo (útil para referencias externas)
- `restart: unless-stopped` para resiliencia
- Requiere red externa `proxy_net` para reverse proxy (Nginx/Traefik con SSL)
- Depende solo de `bioactiva-sunat-prod`
- Base URL del backend: `bioactiva-sunat-prod:8000`

### Database defaults
- `bioactiva-database`: user `app`, password `app`, DB `app` (puerto host 5435)
- `bioactiva-redis`: password `dev` (puerto host 6380)
