# 06. Sitio Web — Stack, Páginas y Estrategia SEO

> **Plataforma de Despliegue:** Vercel (Edge Network con SSR / SSG).  
> **Dominios:** `https://www.agendaculturalloja.com` (Canónico) con redirección 301 permanente desde `https://agendacultural-loja.com`.  
> **Framework:** Next.js 16 (App Router con Turbopack).  
> **ORM & Base de Datos:** Prisma 7 con `@prisma/adapter-mariadb` sobre MariaDB / MySQL (StackCP).

---

## 1. Arquitectura de Rutas y Páginas (`app/`)

| Ruta | Tipo | Características Principales |
|---|---|---|
| `/` (`app/page.tsx`) | Dinámica / ISR | Portada principal: Hero con Banners administrables, buscador interactivo, eventos destacados, carrusel de categorías y acceso rápido. |
| `/eventos` | Dinámica / SSR | Cartelera completa con filtro reactivo por fecha (Hoy, Esta Semana, Este Mes), categoría y parroquia/cantón. |
| `/eventos/[slug]` | Dinámica / ISR | **Ficha de Evento (Núcleo SEO)**: Metadatos OpenGraph dinámicos, **Schema.org `Event` (JSON-LD)**, mapa interactivo Google Maps, carrusel multimedia y botón de compartir. |
| `/eventos/categoria/[categoria]` | Dinámica | Landing pages indexables por categoría temática (`musica`, `teatro`, `arte-y-exposiciones`, `ferias`, `artes-vivas`). |
| `/eventos/zona/[zona]` | Dinámica | Landing pages indexables por parroquia o cantón provincial. |
| `/publicar` | Cliente | Formulario público de eventos con IA asistente de clasificación (Groq) y subida directa a Bunny CDN. |
| `/admin` | Dinámica | Panel de moderación general (autenticado con `ADMIN_PASSWORD`). |
| `/superadmin` | Dinámica | Panel Super Admin exclusivo con cookie `superadmin_token` (gestión de Aliados Comerciales y CRM analítico). |

---

## 2. Estrategia SEO y Requisitos Técnicos de Indexación

### 1. Schema.org JSON-LD (`Event`)
Cada ficha `/eventos/[slug]` genera datos estructurados válidos:
- `@context`: `https://schema.org`
- `@type`: `Event`
- `name`: Nombre oficial del evento.
- `startDate`: Fecha en formato ISO UTC-5.
- `location`: Objeto `Place` con dirección física y ciudad en la provincia de Loja.
- `image`: URL absoluta en Bunny CDN en alta resolución.
- `eventAttendanceMode`: `OfflineEventAttendanceMode`.

### 2. Ciclo de Vida de Eventos Pasados (No 404)
- **Política Invariante:** Cuando un evento concluye su fecha, **su URL `/eventos/[slug]` NO se elimina ni genera error 404**.
- La página permanece indexada indicando el estado `FINALIZADO / PASADO`, preservando la autoridad del enlace (link equity) y recomendando eventos similares activos.

### 3. Actualización de Sitemap e Indexación en Google
- El sitemap dinámico se expone en `/sitemap.xml`.
- **Aviso a Google:** En lugar del método deprecado de ping HTTP (retirado por Google), la actualización de nuevos eventos se canaliza mediante la llamada `sitemaps.submit` de la API de Search Console desde el VPS con las credenciales de la cuenta de servicio.

### 4. Internacionalización (i18n)
- Traducción dinámica en tiempo real de títulos y descripciones a 6 idiomas mediante Groq y caché hash en memoria.
- *Nota de SEO:* Las URLs actuales se mantienen en la estructura canónica en español; la indexación por idioma específico (subrutas `/en/`, `/fr/` con tags `hreflang`) se encuentra planificada en el roadmap de internacionalización.
