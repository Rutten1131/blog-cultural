# 08. Integraciones Externas, Scopes y Credenciales

> **Política de Seguridad:** Este documento lista las APIs conectadas, variables de entorno requeridas, scopes de permisos y mecanismos de renovación. **NO contiene secretos ni tokens en texto plano.**

---

## 1. Matriz de APIs y Servicios Conectados

| Servicio / API | Variables de Entorno | Scopes / Permisos Requeridos | Caducidad / Renovación |
|---|---|---|---|
| **MariaDB (StackCP)** | `DATABASE_URL` | CRUD completo en base de datos `lojaculturalsof-...` (Puerto 44635). | Permanente (credenciales de servidor gestionado). |
| **Puente Meta Graph (Vercel)** | `REDES_SOCIALES_WEBHOOK_URL`<br>`REDES_SOCIALES_API_KEY` | `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`, **`instagram_manage_insights`** (para métricas de guardados y alcance). | Token de Página de Larga Duración (60 días o permanente con System User de Meta Business). |
| **Google Search Console (GSC)** | `gsc_credentials.json` | `https://www.googleapis.com/auth/webmasters` (Lectura de impresiones/clics y envío de sitemaps vía `sitemaps.submit`). | Cuenta de Servicio Google Cloud con permisos `chmod 600`. |
| **Google Analytics 4 (GA4)** | `NEXT_PUBLIC_GA_ID` | Medición de tráfico en la web, eventos y conversiones hacia fichas de eventos con parámetros UTM. | Token Web Stream permanente. |
| **Evolution API v2** | `EVOLUTION_API_URL`<br>`EVOLUTION_API_KEY`<br>`EVOLUTION_INSTANCE` | Lectura de mensajes de grupo (`findMessages`) y envío de mensajes de texto/multimedia (`sendText`, `sendMedia`). | Sesión multi-device persistida en volumen Docker de Evolution. |
| **Bunny CDN (Storage & Pull)** | `BUNNY_STORAGE_ZONE`<br>`BUNNY_API_KEY`<br>`BUNNY_PULL_ZONE_URL` | Escritura y lectura de archivos en zona de almacenamiento global. | API Key estática de Bunny CDN. |
| **Google Gemini API** | `GEMINI_API_KEYS`<br>`GEMINI_MODELOS` | Modelos de visión y texto (`gemini-2.5-flash`). | Claves de Google AI Studio con rotación por cuota. |
| **DeepSeek API** | `DEEPSEEK_API_KEY` | Modelo `deepseek-chat` (V3) para inferencia conversacional. | Clave prepago de plataforma DeepSeek. |
| **Groq API** | `GROQ_API_KEY` | Modelo `llama-3.3-70b-versatile` para traducción y fallback. | Clave API de Groq Cloud. |
| **OpenStreetMap Nominatim** | N/A (Endpoint REST libre) | Geocodificación inversa con User-Agent identificativo. | Libre (sujeto a política de uso de OSM). |

---

## 2. Puntos de Contacto Internos y Puertos del VPS

- **`http://127.0.0.1:8083`**: Worker de WhatsApp (restringido a loopback interna).
- **`http://127.0.0.1:8080`**: Evolution API.
- **`http://127.0.0.1:8092`**: Hermes Agent (FastAPI).
- **Túnel Seguro Vercel ↔ VPS:**
  - El contenedor de Hermes se expone hacia Vercel únicamente mediante Cloudflare Tunnel o proxy inverso Nginx con certificado SSL/TLS y validación de token `HERMES_WEBHOOK_SECRET`.
  - El flag `PAUSA_EMERGENCIA` en la tabla `sistema_config` es verificado por el Worker y el Puente antes de iniciar cualquier ciclo de publicación.
