# 10. Estado Actual del Sistema y Hoja de Ruta (Roadmap)

> **Auditoría Técnica:** 2026-09-29  
> **Criterio de Honestidad Técnica:** Se distingue estrictamente entre lo verificado en código/producción, lo implementado pendiente de despliegue y lo planificado.

---

## 1. Matriz de Estado Real de Componentes

| Componente / Funcionalidad | Estado Real | Notas de Auditoría |
|---|---|---|
| **Sitio Web Next.js 16 (Vercel)** | ✅ OPERATIVO | Cartelera provincial completa, diseño responsive, SSR/ISR con revalidación y dominios con redirección 301. |
| **SEO: Schema.org Event JSON-LD** | ✅ OPERATIVO | Fichas de evento generan datos estructurados para Google Rich Snippets. |
| **Asistente Virtual Turístico (Chat)** | ✅ OPERATIVO | DeepSeek Chat con fallback a Groq, geocodificación Nominatim y recomendación orgánica por Haversine. |
| **WhatsApp Worker (Extracción)** | ✅ OPERATIVO | Polling cada 15 min en VPS, extracción con Gemini Vision, bypass de carruseles de Instagram y subida a Bunny CDN. |
| **Subida Multimedia Bunny CDN** | ✅ OPERATIVO | Almacenamiento permanente en `culturallojablog.b-cdn.net`. |
| **Auto-publicación Web (Confianza ≥ 50%)** | ✅ OPERATIVO | Eventos con información completa pasan directo a `APROBADO` en MariaDB. |
| **Puente de Redes Sociales (Vercel)** | ✅ OPERATIVO | Servicio `redes-sociales-l5q4.vercel.app` conectado con Meta Graph API. |
| **Disparo a Redes desde Worker** | ✅ OPERATIVO | Módulo `redes-sociales-worker.js` en producción enlazado a la auto-publicación del worker. |
| **Regla de Urgencia (Tope 7 posts/día)** | ✅ OPERATIVO | Habilitación de cupos adicionales para eventos de mañana con límite estricto de 7. |
| **Director Hermes (SEO y GSC)** | 🟡 EN INTEGRACIÓN | Script `agenda-cultural-bot-v2.py` configurado; lectura real de Search Console en fase de homologación. |
| **Generación Automática de Reels (FFmpeg)** | 🔴 PENDIENTE | Planeado para compilar flyers en videos cortos MP4 (9:16) con audio. |
| **Actualización de Sitemap vía API GSC** | 🟡 PENDIENTE DE AUTOMATIZAR | Sitemap generado en web; llamada `sitemaps.submit` programada desde VPS. |
| **Tablas de Memoria y Aprendizaje** | 🟡 EN MIGRACIÓN PRISMA | Modelos definidos (`MetricaPublicacion`, `ModeracionLog`, `SistemaConfig`, `HallazgoSemanal`). |

---

## 2. Hoja de Ruta Priorizada (Hacia el Hermes 100% Autónomo)

### Fase 1: Blindaje Operativo y Redes Sociales (Completada / En Operación)
- Verificado: Puente de Redes activo en Vercel con reglas de imagen JPEG 4:5 y tope de 7 posts.
- Verificado: Puertos del VPS enlazados a interfaz loopback `127.0.0.1`.

### Fase 2: Consolidación de Métricas y Aprendizaje
- Ejecutar migración de las tablas de métricas y configuración global (`npx prisma db push`).
- Conectar la lectura periódica (24h y 7 días) de engagement de Facebook e Instagram para alimentar los prompts de Hermes.

### Fase 3: Páginas Evergreen y Dominio de Google
- Generar páginas de alto tráfico: "Qué hacer en Loja este fin de semana", "Eventos culturales en Loja".
- Monitoreo continuo de clics, impresiones y palabras clave vía Search Console.
