# Agenda Cultural Loja

Directorio público de eventos artísticos y culturales de Loja, Ecuador. Gestores publican, la IA clasifica, un moderador aprueba, y el evento aparece en la agenda pública organizada por categoría y parroquia.

**Sitio**: [https://agendacultural-loja.com](https://agendacultural-loja.com)

---

## Stack

- **Next.js 16.3** (App Router, Turbopack) + React 19
- **TypeScript** + Tailwind CSS 4
- **Prisma 7** + MariaDB (driver adapter)
- **Groq** (`llama-3.3-70b-versatile`) para clasificación automática de categoría y zona
- **Bunny CDN** para imágenes

Ver [`CONTEXTO-TECNICO.md`](CONTEXTO-TECNICO.md) para el detalle técnico completo, modelo de datos, reglas de alcance y la **regla crítica de zona horaria** (Ecuador = UTC-5).

---

## Quick start

### 1. Variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales reales
```

Requeridas:

- `DATABASE_URL` — connection string MariaDB
- `GROQ_API_KEY` — para clasificación IA
- `ADMIN_PASSWORD` — password del panel admin (default dev: `admin123_loja`)
- `BUNNY_*` — credenciales CDN

Opcional pero recomendado:

- `TZ=America/Guayaquil` — para que los logs del proceso sean consistentes con la zona horaria de Loja.

### 2. Instalar y preparar la BD

```bash
npm install
npx prisma migrate deploy
npm run db:seed          # catálogos (5 categorías + 19 zonas)
npx tsx prisma/seed-50.ts  # opcional: 50 eventos demo
```

### 3. Desarrollo

```bash
npm run dev
# http://localhost:3000
```

### 4. Build de producción

```bash
npm run build
npm start
```

---

## Estructura

```
app/                  # App Router (rutas públicas + admin + API)
  publicar/           # Formulario público para gestores
  admin/              # Panel de moderación (password)
  eventos/            # Agenda pública (home, categorías, zonas, ficha)
  api/upload/         # Subida de imágenes a Bunny CDN

components/           # Componentes compartidos
lib/
  fechas.ts           # ⚠️ ÚNICA fuente de verdad para manejo de fechas
  prisma.ts           # Cliente Prisma + MariaDB adapter
  clasificarEvento.ts # IA Groq
  utils.ts            # generarSlug + SITE_CONFIG
  actions/            # Server actions

prisma/
  schema.prisma       # Modelo de datos
  seed.ts             # Seed de catálogos
  seed-50.ts          # Seed de eventos demo

scripts/              # Scripts CLI de diagnóstico
```

---

## Scripts útiles

```bash
npm run dev                     # Desarrollo con Turbopack
npm run build                   # Build de producción
npm run lint                    # ESLint
npm run db:seed                 # Cargar catálogos (idempotente)

# Diagnóstico
npx tsx scripts/ver-eventos.ts          # Lista todos los eventos
npx tsx scripts/diagnostico-evento.ts   # Posición de un evento en queries
```

---

## Cómo publicar un evento (gestor)

1. Visitar `/publicar`
2. Completar: nombre, fecha, lugar, descripción, al menos una imagen
3. Enviar → estado `PENDIENTE` + clasificación IA en background
4. Un moderador revisa y aprueba desde `/admin`

## Cómo moderar (admin)

1. Login en `/admin/login` con `ADMIN_PASSWORD`
2. Ver lista de pendientes en `/admin`
3. Corregir categoría/zona si la IA sugirió mal (badge ⚠️ si confianza < 0.6)
4. Aprobar o rechazar

---

## Convenciones

- **Fechas**: usar siempre funciones de `lib/fechas.ts`. Está prohibido `new Date(fechaString)` fuera de ese archivo.
- **Slugs**: deterministas vía `generarSlug(nombre, fecha, lugar)`. No incluir IA en este paso.
- **Taxonomía**: 5 categorías + 19 zonas son catálogos cerrados. No añadir sin respaldo oficial.
- **Sin login de gestores**: la identidad es solo texto libre (`nombreGestor`).

---

## Documentación adicional

- [`CONTEXTO-TECNICO.md`](CONTEXTO-TECNICO.md) — fuente única de verdad técnica
- [`AGENTS.md`](AGENTS.md) — reglas para agentes IA (auto-generado por Next 16)
- [`CLAUDE.md`](CLAUDE.md) — redirección a AGENTS.md