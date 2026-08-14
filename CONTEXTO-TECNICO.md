# Agenda Cultural Loja — Contexto técnico para desarrollo

> Este documento es la **única fuente de verdad técnica** del proyecto. No modificar sin confirmación explícita del responsable. Última auditoría: **2026-08-14**.

---

## 1. Qué es el proyecto

Sitio web (`https://agendacultural-loja.com`) que agrega eventos culturales de Loja, Ecuador. Gestores culturales publican sus propios eventos vía un formulario público. El sitio los clasifica con IA, requiere aprobación humana, y los muestra en una agenda pública organizada por categoría y parroquia (zona).

El proyecto tiene tres audiencias diferenciadas:

- **Visitante público**: consulta la agenda (home + páginas de categoría/zona + ficha de evento).
- **Gestor cultural**: envía eventos vía formulario público sin autenticarse.
- **Moderador (admin)**: revisa, corrige categoría/zona sugeridas por la IA, y aprueba o rechaza.

---

## 2. Stack confirmado

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.3.0 | Turbopack habilitado. `next.config.ts` mínimo. |
| UI | React | 19.2.8 | Server + Client Components |
| Lenguaje | TypeScript | 5.x | `strict` habilitado |
| Estilos | Tailwind CSS | 4.x | vía `@tailwindcss/postcss` |
| ORM | Prisma | 7.9.1 | **con driver adapter MariaDB** (Prisma 7 ya no soporta `mysql` nativo, requiere adapter explícito) |
| BD | MariaDB | 10+ | conexión via `DATABASE_URL` en `.env.local` |
| Imágenes | Bunny CDN | — | vía `app/api/upload/route.ts` |
| Linting | ESLint | 9.x | `eslint-config-next` |
| Utilidades | sharp, dotenv, mariadb | — | ver `package.json` |

⚠️ **Decisión Prisma 7**: el cliente Prisma se instancia con `new PrismaMariaDb({ host, port, user, password, database })` parseando `DATABASE_URL`. Esto está en `lib/prisma.ts` y replicado en scripts. **No cambiar** a `PrismaClient` sin adapter — Prisma 7 rompe sin él.

⚠️ **Next.js 16**: leer `node_modules/next/dist/docs/` antes de escribir código; tiene breaking changes vs training data.

---

## 3. Reglas de alcance del MVP

- **Sin login/autenticación para gestores.** El formulario `/publicar` es público. La identidad del gestor es solo un campo de texto (`nombreGestor`).
- **Panel admin SÍ tiene password** (`/admin/login`) pero usa cookie `httpOnly` simple, no OAuth ni cuentas.
- **Sin sistema de reseñas ni QR.** Explícitamente fuera del MVP. No crear tablas ni endpoints.
- **Sin multi-idioma activo.** Estructura de rutas queda en español. No traducir.

---

## 4. Taxonomía fija

### Categorías (5, catálogo cerrado)

Slug canónico → Nombre mostrado:

- `arte-y-exposiciones` → Arte y exposiciones
- `teatro` → Teatro
- `musica` → Música
- `ferias` → Ferias
- `artes-vivas` → Artes Vivas (categoría ancla del proyecto)

### Zonas (19, catálogo cerrado = parroquias oficiales del cantón Loja)

6 urbanas + 13 rurales. Lista exacta en `lib/constants.ts` → array `ZONAS`. **No añadir, no quitar, no renombrar** sin respaldo de la División parroquial oficial del Municipio.

---

## 5. Zona horaria — REGLA CRÍTICA

Ecuador continental es **UTC-5 todo el año** (no usa horario de verano).

**Invariantes:**

1. La aplicación **debe** tratar todas las fechas en zona horaria de Loja (`America/Guayaquil`).
2. Toda fecha almacenada en BD es `DateTime` UTC (MariaDB lo requiere). La conversión a "fecha de evento en Loja" es responsabilidad del código de aplicación.
3. Toda utilidad de fecha vive en **`lib/fechas.ts`** (fuente única de verdad). **Está prohibido** hacer `new Date(fechaString)` directamente en cualquier archivo fuera de `lib/fechas.ts`.
4. Para inputs sin hora explícita (`type="date"` legacy), se interpreta como **mediodía Ecuador = 17:00 UTC**. Nunca como medianoche UTC (esto causa off-by-one de un día).
5. Formateo: usar siempre `formatFechaLoja()` / `formatFechaHoraLoja()` con `Intl.DateTimeFormat("es-EC", { timeZone: "America/Guayaquil", ... })`. **Nunca** `toLocaleDateString()` directo (depende de la TZ del proceso Node).

Justificación del invariante #4: `new Date("2026-08-14")` en JS devuelve `2026-08-14T00:00:00Z` (UTC midnight) = `2026-08-13 19:00 hora Ecuador` = **día anterior**. Esto es exactamente el bug que se detectó el 2026-08-14 con el evento "Noches de ferias" — la fecha quedó guardada como 13/08 19:00 EC cuando el gestor quiso publicar el 14/08.

---

## 6. Modelo de datos (estado actual)

Definido en `prisma/schema.prisma`. Migraciones en `prisma/migrations/`.

### `categorias` (Catálogo cerrado)
- `id` (Int, PK, auto)
- `slug` (VarChar 50, UNIQUE)
- `nombre` (VarChar 100)
- → relación 1-N con `eventos`

### `zonas` (Catálogo cerrado)
- `id` (Int, PK, auto)
- `nombre` (VarChar 100, UNIQUE)
- `tipo` (Enum `TipoZona`: `URBANA` | `RURAL`)
- → relación 1-N con `eventos`

### `eventos`
- `id` (Int, PK, auto)
- `nombre` (VarChar 255)
- `slug` (VarChar 300, UNIQUE) — **determinista**, generado por `generarSlug(nombre, fecha, lugar)`. Ver `lib/utils.ts`.
- `fecha` (DateTime) — **almacenado UTC**. Interpretar como Ecuador al mostrar/comparar (ver §5).
- `lugar` (VarChar 255) — texto libre
- `descripcion` (Text) — texto libre
- `imagenUrl` (VarChar 500, opcional) — URL del afiche principal en Bunny CDN
- `multimedia` (Json, opcional) — array de URLs adicionales para galería
- `videoUrl` (VarChar 500, opcional) — link a FB/IG/TikTok/YT/Vimeo (parseado por `lib/mediaUtils.ts`)
- `estado` (Enum `EstadoEvento`: `PENDIENTE` | `APROBADO` | `RECHAZADO`, default `PENDIENTE`)
- `nombreGestor` (VarChar 200) — texto libre, sin relación a usuario
- `confianzaClasificacion` (Float, opcional) — 0..1, output de la IA
- `createdAt` (DateTime, default `now()`)
- `categoriaId` (Int, FK opcional) — null hasta que la IA o el moderador la asignen
- `zonaId` (Int, FK opcional) — idem

### Enums
- `EstadoEvento { PENDIENTE, APROBADO, RECHAZADO }` — **3 valores** (no 2 como en el doc anterior).
- `TipoZona { URBANA, RURAL }`.

---

## 7. Motor de clasificación (IA)

Módulo: `lib/clasificarEvento.ts`.

- Proveedor: **Groq** (`https://api.groq.com/openai/v1/chat/completions`).
- Modelo: `llama-3.3-70b-versatile`.
- API key: `GROQ_API_KEY` en `.env.local`.
- Input: `nombre`, `lugar`, `descripcion` del evento.
- Output: `{ categoriaSlug, zonaNombre, confianza }` — cada uno validado contra los catálogos cerrados.
- Si falla la API o no hay key: devuelve `{ null, null, null }` y el evento queda sin clasificar (el moderador debe asignar manualmente desde el panel).

⚠️ **Cualquier mención a "API de Anthropic" en prompts o código está desactualizada**. La clasificación usa Groq exclusivamente.

### Flujo de clasificación
1. Server action `crearEvento` crea el evento en estado `PENDIENTE` con `categoriaId` y `zonaId` = null.
2. Inmediatamente después (en background, sin bloquear la respuesta al usuario) llama a `clasificarEvento()`.
3. Si la IA devuelve categoría/zona válidas, actualiza el evento con `categoriaId`, `zonaId`, `confianzaClasificacion`.
4. El panel admin muestra el evento con badges si `confianzaClasificacion === null` o `< 0.6` → ⚠️ Revisar sugerencia.

---

## 8. Flujo de publicación

1. Gestor visita `/publicar`, completa el formulario (nombre, fecha, hora opcional, lugar, descripción, galería de imágenes, video URL opcional, su nombre).
2. Server action `crearEvento` valida, genera el slug determinista, guarda el evento en estado `PENDIENTE` y dispara la clasificación IA en background.
3. **Moderador** entra a `/admin/login` (password en `ADMIN_PASSWORD` env var, default `admin123_loja` para dev), ve los pendientes en `/admin`, puede corregir categoría/zona, y hace clic en **Aprobar y Publicar** o **Rechazar**.
4. Al aprobar: evento pasa a `APROBADO`, queda visible en:
   - Hero de la home (`/`)
   - Sección por categoría (`/eventos/categoria/[slug]`)
   - Sección por zona (`/eventos/zona/[slug]`)
   - Listado completo (`/eventos`)
   - Ficha individual (`/eventos/[slug]`)
   - Sitemap dinámico (`/sitemap.xml`)
   - Schema.org JSON-LD `Event`

---

## 9. Caché y revalidación

- Todas las páginas públicas usan **`export const revalidate = 60`** (ISR, revalidación cada 60s).
- El admin usa **`export const dynamic = "force-dynamic"`** (sin caché).
- **Cada server action** debe invalidar TODAS las rutas afectadas:
  - `crearEvento`: `/`, `/admin`, `/eventos`, `/eventos/categoria/[slug]*`, `/eventos/zona/[slug]*`, `/eventos/[slug]*`, `/sitemap.xml`
  - `aprobarEvento` y `rechazarEvento`: mismas rutas + `/eventos/[slug]` específico
- Helper sugerido: ver `lib/actions/revalidate.ts` para `revalidateAll()`.

---

## 10. SEO (requisitos no negociables)

- Cada evento = URL propia e indexable: `/eventos/[slug]`.
- Datos estructurados Schema.org `Event` con `startDate`, `location`, `organizer`, `image`, `eventStatus`, `eventAttendanceMode`.
- Renderizado server-side o estático — no todo client-side.
- Sitemap dinámico (`app/sitemap.ts`) con home, categorías, zonas y eventos aprobados.
- `robots.ts` permite todo y apunta al sitemap.
- Open Graph + Twitter Cards por evento.
- Metadata por página de categoría con preguntas SEO (formato H2 + respuesta corta).
- Canonical siempre apunta a `https://agendacultural-loja.com` (con guion). **No** `agendaculturalloja.com`.

---

## 11. Estructura del proyecto

```
software/
├── app/                      # App Router (Next.js 16)
│   ├── page.tsx              # Home con hero + secciones por categoría
│   ├── layout.tsx            # Layout raíz
│   ├── globals.css           # Estilos globales + CSS variables
│   ├── robots.ts             # robots.txt dinámico
│   ├── sitemap.ts            # sitemap.xml dinámico
│   ├── publicar/             # Formulario público de envío
│   ├── admin/                # Panel de moderación (protegido)
│   │   ├── login/            # Password simple
│   │   └── page.tsx          # Lista de pendientes
│   ├── eventos/              # Páginas públicas
│   │   ├── page.tsx          # Listado completo
│   │   ├── [slug]/           # Ficha individual
│   │   ├── categoria/[categoria]/
│   │   └── zona/[zona]/
│   └── api/upload/           # Subida de imágenes a Bunny CDN
│
├── components/               # Componentes compartidos (cliente y servidor)
│
├── lib/
│   ├── prisma.ts             # Singleton del PrismaClient con MariaDB adapter
│   ├── fechas.ts             # ⚠️ ÚNICA fuente de verdad para manejo de fechas
│   ├── constants.ts          # ZONAS + re-export de CATEGORIAS
│   ├── utils.ts              # generarSlug + SITE_CONFIG
│   ├── mediaUtils.ts         # Parser de video URLs (FB/IG/TT/YT/Vimeo)
│   ├── clasificarEvento.ts   # IA Groq para clasificar
│   └── actions/              # Server actions
│       ├── crearEvento.ts
│       ├── moderacionEvento.ts
│       └── authAdmin.ts
│
├── prisma/
│   ├── schema.prisma         # Modelo de datos
│   ├── seed.ts               # Seed de catálogos (idempotente)
│   ├── seed-50.ts            # Seed de 50 eventos demo
│   └── migrations/           # Historial de migraciones
│
├── scripts/                  # Scripts CLI (no parte de la app)
│   ├── ver-eventos.ts        # Diagnóstico: lista todos los eventos
│   └── diagnostico-evento.ts # Diagnóstico: posición de un evento en queries
│
├── types/index.ts            # Tipos compartidos (CATEGORIAS, CategoriaSlug)
│
├── middleware.ts             # Protección de /admin/*
├── next.config.ts            # Config Next (mínima)
├── prisma.config.ts          # Carga .env.local para Prisma CLI
├── eslint.config.mjs
├── tsconfig.json
├── package.json
├── .env / .env.local / .env.example
├── README.md
├── CONTEXTO-TECNICO.md       # ← Este archivo
└── AGENTS.md / CLAUDE.md     # Reglas auto-generadas para agentes IA
```

---

## 12. Variables de entorno

Ver `.env.example`. Requeridas:

- `DATABASE_URL` — connection string MariaDB (`mysql://user:pass@host:port/dbname`)
- `GROQ_API_KEY` — API key de Groq para clasificación IA
- `ADMIN_PASSWORD` — password del panel admin (default dev: `admin123_loja`)
- `BUNNY_*` — credenciales del CDN de imágenes (ver `app/api/upload/route.ts`)

Opcionales:

- `TZ` — recomendado `America/Guayaquil` en dev/CI para que los logs/formatos del proceso sean consistentes.

---

## 13. Fuera de alcance explícito (no construir)

- Cuentas de usuario / login de gestores.
- Reseñas, fotos de asistentes, códigos QR.
- Perfiles de organizador verificado.
- Cualquier capa de monetización.
- Contenido en inglés.
- Multi-idioma activo.

---

## 14. Historial de cambios del documento

- **2026-08-14** — Auditoría completa. Se actualizó:
  - Stack con Prisma 7 + MariaDB adapter (faltaba).
  - Sección 5 nueva: **Zona horaria** (bug crítico detectado).
  - Modelo `evento` con `multimedia`, `videoUrl`, `confianzaClasificacion` (faltaban).
  - Enum `EstadoEvento` con 3 valores (antes decía 2).
  - Sección 9 nueva: Caché y revalidación.
  - Sección 11: Estructura completa del proyecto.
  - Dominio canónico corregido: `agendacultural-loja.com` (con guion).
  - Scripts CLI documentados.