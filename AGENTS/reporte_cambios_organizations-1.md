# Reporte de Cambios — Módulo Organizations (v1)

> Fecha: 01/06/2026
> Alcance: Refactorización y conexión con SUNAT Scraper

---

## 1. Resumen de cambios realizados

| # | Archivo | Tipo de cambio | Severidad |
|---|---------|---------------|-----------|
| 1 | `domain/ports/organization.repository.ts` | Renombrar Symbol | 🔴 Alto |
| 2 | `domain/ports/sunat.service.ts` | Renombrar Symbol | 🔴 Alto |
| 3 | `domain/entities/organization.ts` | Nuevo método `updateRuc()` | 🟢 Bajo |
| 4 | `infrastructure/service/sunat-web-scraper.adapter.ts` | **Reescritura completa** | 🔴 Alto |
| 5 | `infrastructure/http/organization.controller.ts` | + Guards JWT + Response DTOs | 🔴 Alto |
| 6 | `infrastructure/http/dtos/organization-response.dto.http.ts` | **Nuevo archivo** | 🟡 Medio |
| 7 | `infrastructure/http/dtos/sunat-company-response.dto.http.ts` | **Nuevo archivo** | 🟡 Medio |
| 8 | `application/use-cases/create-organization.use-case.ts` | Actualizar import Symbol | 🟡 Medio |
| 9 | `application/use-cases/update-organization.use-case.ts` | Actualizar import Symbol + usa `updateRuc()` | 🟡 Medio |
| 10 | `application/use-cases/get-organization-by-id.use-case.ts` | Actualizar import Symbol | 🟢 Bajo |
| 11 | `application/use-cases/get-all-organizations.use-case.ts` | Actualizar import Symbol | 🟢 Bajo |
| 12 | `application/use-cases/query-sunat.use-case.ts` | Actualizar import Symbol | 🟢 Bajo |
| 13 | `organizations.module.ts` | Symbols actualizados | 🟡 Medio |

Adicionalmente: `sunat-app/Dockerfile`, `.env`, `docker-compose.yml`, `AGENTS.md`

---

## 2. Cambio 1 — Symbol `ORGANIZATION_REPOSITORY`

### Archivo: `domain/ports/organization.repository.ts`

**Antes:**
```ts
export const IOrganizationRepository = Symbol('IOrganizationRepository');
```

**Después:**
```ts
export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');
```

**Motivación:** El Symbol compartía nombre con la interfaz `IOrganizationRepository`. Al importar `IOrganizationRepository` se obtenía el valor (Symbol), no el tipo (interfaz). El skill `skills_fundamentals.md` sección 3 establece: *"Symbols must NOT share name with the interface"*.

**Impacto:** Todos los archivos que importaban `IOrganizationRepository` como valor (para `@Inject`) se actualizaron para importar `ORGANIZATION_REPOSITORY` y opcionalmente `type IOrganizationRepository` para el tipo.

---

## 3. Cambio 2 — Symbol `SUNAT_SERVICE`

### Archivo: `domain/ports/sunat.service.ts`

**Antes:**
```ts
export const ISunatService = Symbol('ISunatService');
```

**Después:**
```ts
export const SUNAT_SERVICE = Symbol('SUNAT_SERVICE');
```

**Motivación:** Mismo problema que el anterior — el Symbol opacaba la interfaz.

**Archivos afectados:** `organizations.module.ts`, `query-sunat.use-case.ts`, `update-organization.use-case.ts`, `sunat-web-scraper.adapter.ts`

---

## 4. Cambio 3 — Nuevo método `updateRuc()` en entidad

### Archivo: `domain/entities/organization.ts`

```ts
updateRuc(ruc: string) {
    if (!/^\d{11}$/.test(ruc)) {
        throw new Error('El RUC debe tener 11 dígitos');
    }
    this.ruc = ruc;
    this.updatedAt = new Date();
}
```

**Motivación:** El método `handleRucUpdate()` en `update-organization.use-case.ts` asignaba `organization.ruc = dto.ruc` directamente. Siguiendo DDD, la mutación debe ser a través de un método de la entidad que valide invariantes.

---

## 5. Cambio 4 — Reescritura del adaptador SUNAT

### Archivo: `infrastructure/service/sunat-web-scraper.adapter.ts`

**Problema original:** El adaptador apuntaba a rutas incorrectas del scraper Python:

| Aspecto | Antes (roto) | Después (corregido) |
|---------|-------------|--------------------|
| Ruta RUC | `GET /consulta-ruc/{ruc}` (path param) | `GET /consultar-ruc?ruc=XXXX` (query param) |
| Ruta nombre | `GET /consulta/{nombre}` (path param) | `GET /consultar-nombre?nombre=XXXX` (query param) |
| Response RUC | Esperaba `{ resultados: [...] }` | Objeto directo `{ ruc, nombre, tipo, ... }` |
| Response nombre | Esperaba `{ resultados: [...] }` | Array directo `[{ ruc, nombre, ... }]` |
| Campos usados | `numero_de_ruc`, `tipo_contribuyente` (snake_case) | `ruc`, `tipoContribuyente`, `tipo`, `sector` (camelCase) |
| Lógica de mapeo | `detectEnterpriseType()` manual y limitado | Usa campos pre-mapeados `tipo` y `sector` del scraper Python |

**Detalles de la reescritura:**

```typescript
interface PythonScraperRucResponse {
    ruc?: string;
    nombre?: string;
    tipoContribuyente?: string;
    nombreComercial?: string | null;
    ubicacion?: string | null;
    actividadEconomica?: string | null;
    tipo?: string | null;      // ← pre-mapeado por Python (EnterpriseType)
    sector?: string | null;    // ← pre-mapeado por Python (Sector)
    estado?: string;
    [key: string]: unknown;
}
```

**Mapeo de EnterpriseType:**
```typescript
private mapEnterpriseType(tipo: string | null | undefined): EnterpriseType {
    if (!tipo) return EnterpriseType.EMPRESA_NACIONAL;
    const upper = tipo.toUpperCase() as keyof typeof EnterpriseType;
    if (upper in EnterpriseType) return EnterpriseType[upper];
    return EnterpriseType.EMPRESA_NACIONAL;
}
```

**Manejo de errores mejorado:**
- Status 404 → retorna `null` (RUC no encontrado)
- Status no-OK → log warning + retorna `null`
- Excepción de red → log warning + retorna `null`

**Eliminado:** Método `detectEnterpriseType()` duplicado — el scraper Python ya hace este mapeo.

---

## 6. Cambio 5 — Guards JWT en el Controller

### Archivo: `infrastructure/http/organization.controller.ts`

**Antes:** Sin autenticación — cualquier request podía acceder a todos los endpoints.

**Después:**
```typescript
@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
```

**Todos los endpoints ahora requieren token JWT.** Para obtenerlo:
```
POST /auth/login  { "correo": "admin@bioactiva.com", "password": "AdminPassword123!" }
```

---

## 7. Cambio 6 — Response DTOs

### Archivo nuevo: `infrastructure/http/dtos/organization-response.dto.http.ts`

Mapea la entidad `Organization` a un DTO con anotaciones Swagger. Los endpoints `POST`, `GET`, `GET/:id`, `PATCH/:id` ahora retornan `OrganizationResponseDto` en vez de la entidad de dominio directamente.

### Archivo nuevo: `infrastructure/http/dtos/sunat-company-response.dto.http.ts`

Mapea `SunatCompanyInfo` a un DTO para la respuesta de `GET /organizations/sunat/:query`.

**Endpoint actualizado en el controller:**
```typescript
@Get('sunat/:query')
async querySunat(@Param('query') query: string): Promise<SunatCompanyResponseDto | SunatCompanyResponseDto[]> {
    const result = await this.querySunatUseCase.execute(query);
    // ... manejo de 404 ...
    if (Array.isArray(result)) {
        return result.map((item) => new SunatCompanyResponseDto(item));
    }
    return new SunatCompanyResponseDto(result);
}
```

---

## 8. Estado actual del módulo

### Arquitectura (DDD + Hexagonal)

```
organizations/
├── organizations.module.ts              ✅ Wiring de DI correcto
├── domain/
│   ├── entities/organization.ts         ✅ Métodos de estado (rename, updateRuc, etc.)
│   ├── enums/                           ✅ String-valued enums
│   │   ├── organization-type.ts
│   │   ├── sector.ts
│   │   └── size.ts
│   ├── exceptions/                      ✅ Excepciones de dominio
│   │   ├── invalid-ruc.exception.ts
│   │   └── organization-already-exists.exception.ts
│   └── ports/                           ✅ Interfaces + Symbols separados
│       ├── organization.repository.ts
│       └── sunat.service.ts
├── application/
│   ├── dtos/                            ✅ DTOs de aplicación
│   │   ├── create-organization.dto.ts
│   │   └── update-organization.dto.ts
│   └── use-cases/                       ✅ Inyectan puertos (no implementaciones)
│       ├── create-organization.use-case.ts
│       ├── update-organization.use-case.ts
│       ├── get-organization-by-id.use-case.ts
│       ├── get-all-organizations.use-case.ts
│       └── query-sunat.use-case.ts
└── infrastructure/
    ├── http/
    │   ├── organization.controller.ts    ✅ Guards JWT + DTOs response
    │   └── dtos/                         ✅ DTOs HTTP request/response
    │       ├── create-organization.dto.http.ts
    │       ├── update-organization.dto.http.ts
    │       ├── organization-response.dto.http.ts
    │       └── sunat-company-response.dto.http.ts
    ├── mapper/
    │   └── organization.mapper.ts        ✅ toDomain / toPersistence
    ├── persistance/
    │   └── prisma-organization.repository.ts  ✅ Implementa puerto
    └── service/
        └── sunat-web-scraper.adapter.ts  ✅ Implementa ISunatService
```

### Cumplimiento vs skills_fundamentals.md

| Regla | Estado |
|-------|--------|
| Symbols con nombre distinto a la interfaz | ✅ Corregido |
| Enums string-valued | ✅ `EnterpriseType`, `Sector`, `Size` |
| Controller retorna DTOs, no entidades | ✅ Corregido |
| Use-cases inyectan puertos con `@Inject(SYMBOL)` | ✅ |
| Entidades con métodos de estado | ✅ |
| Repositorio implementa puerto del dominio | ✅ |
| Mapper con `toDomain()`/`toPersistence()` | ✅ |
| DTOs HTTP en `*.dto.http.ts` | ✅ |
| Endpoints protegidos con JWT | ✅ Corregido |
| Excepciones de dominio específicas | ✅ |

---

## 9. Pendientes / Deuda técnica

- [ ] **Tests unitarios** — Los tests existentes en `test/unit/organizations/` no se actualizaron. Error de compilación por los cambios en `Organization` (17 argumentos → 13) y enums.
- [ ] **DTOs de aplicación para `GetAllOrganizationsUseCase` y `GetOrganizationByIdUseCase`** — Actualmente retornan entidades directamente sin DTO.
- [ ] **Inyección de PrismaService** — El repositorio inyecta por clase (`PrismaService`) mientras que `PrismaUserRepository` usa string token (`PRISMA_SERVICE`). Unificar estilo.
- [ ] **Paginación en `GET /organizations`** — No implementada.
