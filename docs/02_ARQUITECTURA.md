# 02. Arquitectura General del Sistema — Agenda Cultural Loja

> **Estado:** PRODUCCIÓN ACTIVA.  
> **Hosting Web:** Vercel (Next.js 16 App Router con Turbopack).  
> **Servidor VPS:** Contabo IP `178.238.238.158` (Ubuntu / Docker Compose).  
> **Base de Datos:** MariaDB / MySQL en StackCP (`mysql.us.stackcp.com:44635`).  
> **Puente de Redes Sociales:** `https://redes-sociales-l5q4.vercel.app` (Meta Graph API).  
> **Proxy Seguro VPS:** Cloudflare Tunnel / Nginx Proxy Inverso con SSL para comunicación cifrada con Vercel.

---

## 1. Diagrama de Infraestructura y Flujo de Comunicación

```
                                  [ USUARIOS & TURISTAS ]
                                             │
                                             ▼ HTTPS (Cloudflare Proxy)
                        ┌──────────────────────────────────────────────┐
                        │        VERCEL: NEXT.JS 16 APP ROUTER         │
                        │      https://www.agendaculturalloja.com      │
                        │  (Redirección 301 desde agendacultural-loja) │
                        └──────────────┬───────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │ Prisma MariaDB Adapter       │ Storage afiches              │ LLM Primario / Fallback
        ▼                              ▼                              ▼
┌──────────────────┐         ┌───────────────────┐         ┌────────────────────┐
│ MariaDB StackCP  │         │     Bunny CDN     │         │ DeepSeek Chat (V3) │
│ Puerto: 44635    │         │ culturallojablog  │         │ Fallback: Groq 70B │
└────────▲─────────┘         └────────▲──────────┘         └────────────────────┘
         │                            │
         │ Conexión MariaDB           │ Subida directa de afiches
         │                            │
┌────────┴────────────────────────────┴─────────────────────────────────────────┐
│                        VPS CONTABO (178.238.238.158)                          │
│                                                                               │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │ Contenedor Docker: evolution-api (127.0.0.1:8080)                     │   │
│   │ - Gateway Socket WhatsApp Multi-device                                │   │
│   │ - Instancia activa: 'agenda-cultural' / 'cesar-comercial'             │   │
│   └───────────────────────────────────┬───────────────────────────────────┘   │
│                                       │ Polling cada 15 min                   │
│   ┌───────────────────────────────────▼───────────────────────────────────┐   │
│   │ Contenedor Docker: whatsapp-worker (127.0.0.1:8083, app-network)      │   │
│   │ - worker.js (Node.js + Puppeteer + Bunny Uploader)                    │   │
│   │ - Gemini Vision (OCR de afiches)                                      │   │
│   │ - Auto-publicación en BD (estado: APROBADO si confianza >= 50%)       │   │
│   │ - Disparador a Puente de Redes Sociales                               │   │
│   └───────────────────────────────────┬───────────────────────────────────┘   │
│                                       │                                       │
│   ┌───────────────────────────────────▼───────────────────────────────────┐   │
│   │ Contenedor Docker: agenda-cultural-bot (127.0.0.1:8092)               │   │
│   │ - Director Hermes: SEO y Analítica (FastAPI / hermes_agenda_brain)    │   │
│   │ - Google Search Console API (gsc_credentials.json)                    │   │
│   │ - Expuesto hacia Vercel únicamente vía Proxy Inverso HTTPS / Tunnel   │   │
│   └───────────────────────────────────┬───────────────────────────────────┘   │
└───────────────────────────────────────┼───────────────────────────────────────┘
                                        │
                                        │ Webhook de Programación y Publicación
                                        ▼
             ┌─────────────────────────────────────────────────────┐
             │       PUENTE DE REDES SOCIALES (VERCEL SCHEDULER)   │
             │        https://redes-sociales-l5q4.vercel.app       │
             │   - Custodia tokens de Meta Graph API               │
             │   - Ejecuta publicación a Facebook e Instagram      │
             │   - Expone métricas y analítica de engagement       │
             └──────────────────────────┬──────────────────────────┘
                                        │ Meta Graph API
                                        ▼
                          [ FACEBOOK & INSTAGRAM ]
```

---

## 2. Flujo Completo de un Evento de Principio a Fin (Caso Real)

### Ejemplo Concreto (Evento #142):
1. **Detección:** En el grupo de WhatsApp entra un flyer del *"Concierto de Temporada de la Orquesta Sinfónica en el Teatro Benjamín Carrión"*.
2. **Extracción y OCR:** El `whatsapp-worker` detecta el mensaje, descarga la imagen y la procesa con Gemini Vision. Extrae: Título, Lugar, Fecha y Organizador con `confianzaIA = 0.88`.
3. **Persistencia CDN:** La imagen se sube a Bunny CDN generando la URL permanente `https://culturallojablog.b-cdn.net/eventos/sinfonica.jpg`.
4. **Deduplicación:** Se genera el hash unificado `SHA256(nombre_normalizado + fecha + lugar)`. Como no existe evento similar en ±24h, procede.
5. **Auto-Aprobación Inmediata:** Al superar el 50% de confianza, se inserta en MariaDB como `APROBADO` con fecha a las 17:00Z (si no traía hora).
6. **Despacho a Redes:** El worker contacta a `https://redes-sociales-l5q4.vercel.app/api/external/agenda-cultural/schedule`.
   - Si el límite estándar de 5 posts/día está lleno pero el evento es para **MAÑANA**, se habilita un cupo de urgencia (con tope duro de 7 posts/día).
   - El puente de Vercel convierte el afiche a **JPEG 4:5** y lo publica en Facebook e Instagram.
7. **Posicionamiento SEO:** Next.js expone la ficha `/eventos/concierto-sinfonica-loja` con metadatos JSON-LD `Schema.org/Event`.
8. **Seguimiento Posterior:** A las 24 horas y 7 días, Hermes consulta al puente de Vercel las métricas (alcance, likes, guardados y clics) y las guarda en la base de datos de aprendizaje.
