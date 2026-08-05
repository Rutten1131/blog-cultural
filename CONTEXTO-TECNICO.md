# Agenda Cultural Loja — Contexto técnico para desarrollo

> Este documento es la única fuente de verdad técnica del proyecto. No modificar sin confirmación explícita.

## Qué es el proyecto
Sitio web (agendaculturalloja.com) que agrega eventos culturales de Loja. Gestores culturales publican sus propios eventos vía un formulario público. El sitio los clasifica, genera una página SEO por evento, y los muestra en una agenda pública organizada por categoría y zona.

## Stack confirmado
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- ESLint

## Reglas de alcance para el MVP
- **Sin login/autenticación.** El formulario de carga es público, sin cuentas de usuario.
- **Sin sistema de reseñas ni QR.** Queda explícitamente fuera del MVP. No crear tablas, campos ni endpoints para esto todavía.
- **Sin multi-idioma activo.** Se puede dejar la estructura de rutas preparada (`/es/`, `/en/`) pero no se construye contenido en inglés ahora.

## Taxonomía fija (no inventar categorías nuevas)

**Categorías:**
- Arte y exposiciones
- Teatro
- Música
- Ferias
- Artes Vivas (categoría propia — evento ancla del proyecto)

**Zonas:** por parroquia de Loja (lista de parroquias a definir como catálogo cerrado, editable solo desde el backend/admin, no por el usuario final).

## Flujo de publicación de un evento
1. Gestor llena formulario público con: nombre del evento, fecha, lugar, descripción (texto libre), imagen.
2. El sistema genera automáticamente:
   - Slug/URL amigable — **determinista, sin IA** (ej. `nombre-evento-fecha-lugar`, normalizado: sin tildes, minúsculas, guiones).
   - Sugerencia de categoría y zona — **con IA**, a partir del texto libre de la descripción, eligiendo únicamente entre las opciones cerradas de la taxonomía de arriba.
   - Metadatos SEO y marcado estructurado `Event` (Schema.org).
3. Moderación ligera: un panel de administración muestra el evento con la categoría/zona ya sugerida (editable) — el moderador aprueba o corrige antes de publicar. Nunca se publica automáticamente sin este paso.
4. Al aprobarse, el evento entra a la agenda pública, a su categoría, a su zona y al sitemap.

## Requisitos SEO no negociables (aplican desde el primer commit)
- Cada evento = URL propia e indexable.
- Datos estructurados Schema.org tipo `Event`.
- Renderizado server-side o estático — no todo client-side.
- Sitemap dinámico.
- URLs limpias y semánticas.

## Modelo de datos — punto de partida (a confirmar en el Paso 2)
- **Evento:** id, nombre, slug, fecha, lugar (texto), zona (parroquia), categoría, descripción, imagen, estado (pendiente/aprobado), nombre del gestor (texto libre, sin relación a cuenta de usuario).
- **Categoría:** catálogo cerrado, editable solo desde admin.
- **Zona/Parroquia:** catálogo cerrado, editable solo desde admin.

## Fuera de alcance explícito (no construir aunque parezca lógico)
- Cuentas de usuario / login de gestores.
- Reseñas, fotos de asistentes, códigos QR.
- Perfiles de organizador verificado.
- Cualquier capa de monetización (destacados, patrocinios).
- Contenido en inglés.
