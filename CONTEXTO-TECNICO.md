# Agenda Cultural Loja — Contexto técnico para desarrollo

> Este documento es la **única fuente de verdad técnica** del proyecto. No modificar sin confirmación explícita del responsable. Última auditoría completa: **2026-09-17**.

---

## 1. Qué es el proyecto

Sitio web oficial y plataforma cultural/turística (`https://agendacultural-loja.com` y `https://www.agendaculturalloja.com`) que centraliza la cartelera cultural, eventos, turismo cantonal y red de aliados de Loja, Ecuador. 

El ecosistema integra:
- **Agenda pública colaborativa:** Gestores culturales publican eventos vía formulario público. La IA (Groq / Llama 3.3) clasifica la categoría y parroquia (zona), requiere aprobación humana y los publica en cartelera organizada.
- **Asistente Virtual Turístico Inteligente:** Chatbot conversacional con IA para orientar al ciudadano o turista sobre qué hacer, eventos, sitios turísticos cantonales y aliados comerciales (hoteles, gastronomía, cafeterías). Incluye **geolocalización en tiempo real** por OpenStreetMap Nominatim.
- **CRM del Chatbot en tiempo real:** Auditoría analítica de conversaciones, detección de procedencia geográfica de visitantes, estadísticas de zonas más demandadas y registro de aliados sugeridos.
- **Ecosistema Administrativo Dual:**
  - **Panel de Moderación General (`/admin`):** Aprobación de eventos, categorización, sugerencias ciudadanas, gestión de banners del Hero, números de notificación y cuentas de instituciones culturales asociadas.
  - **Super Admin Exclusivo (`/superadmin`):** Acceso seguro con clave única para la gestión central de **Aliados Comerciales** y monitoreo analítico del **CRM del Chatbot**.
- **Notificaciones automáticas y Redes:** Notificaciones vía WhatsApp (Evolution API) y difusión automática de eventos hacia el VPS del agente Hermes.

El proyecto tiene cinco perfiles y audiencias diferenciadas:
1. **Visitante público / Turista:** Consulta la agenda, categorías, parroquias, fichas con Google Maps interactivo, multimedia (carruseles y videos embed) y conversa con el chatbot turístico para recomendaciones personalizadas a su ubicación.
2. **Gestor cultural:** Envía eventos vía formulario público sin registro previo.
3. **Moderador (`/admin`):** Revisa, edita, aprueba/rechaza eventos y administra contenidos generales y banners.
4. **Institución asociada:** Cuentas institucionales para seguimiento de eventos vinculados.
5. **Super Administrador (`/superadmin`):** Acceso administrativo con clave directa para CRM conversacional y negocios/aliados comerciales.

---

## 2. Stack confirmado

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.3.0 | Turbopack habilitado. `next.config.ts` optimizado. |
| UI | React | 19.2.8 | Server + Client Components |
| Lenguaje | TypeScript | 5.x | `strict` habilitado |
| Estilos | Tailwind CSS | 4.x | vía `@tailwindcss/postcss` |
| ORM | Prisma | 7.9.1 | **con driver adapter MariaDB** (`@prisma/adapter-mariadb`) |
| Base de Datos | MariaDB / MySQL | 10+ | Conexión pooling vía `DATABASE_URL` |
| Motor IA Clasificación | Groq API | Llama 3.3 70b | Clasificación rápida y estructurada de eventos |
| Motor IA Chatbot | Groq / DeepSeek | Chatbot contextual | RAG dinámico con agenda, aliados y atractivos |
| Geolocalización | OpenStreetMap Nominatim | API REST | Reverse geocoding gratuito y sin API key |
| CDN Multimedia | Bunny CDN | — | Upload directo vía `app/api/upload/route.ts` |
| WhatsApp Bot API | Evolution API | v2 | Instancia `agenda-cultural` para alertas a administradores |
| VPS Webhook Agente | Hermes Engine | VPS REST | Notificación y posteo automatizado en redes sociales |

⚠️ **Decisión Prisma 7**: El cliente Prisma se instancia con `new PrismaMariaDb({ host, port, user, password, database })` parseando `DATABASE_URL`. Esto vive en `lib/prisma.ts`. No cambiar a `PrismaClient` tradicional sin adapter.

⚠️ **Next.js 16**: Reglas estrictas en App Router y `node_modules/next/dist/docs/`. Respetar la compatibilidad y no introducir librerías obsoletas del Pages Router.

---

## 3. Arquitectura de Acceso y Seguridad

- **Formulario de Publicación (`/publicar`):** Completamente público. No requiere registro previo del gestor.
- **Panel Admin Tradicional (`/admin`):** Acceso vía `/admin/login` autenticado mediante contraseña (`ADMIN_PASSWORD`, por defecto `admin123_loja` o institucional). Gestiona moderación de eventos, banners, recomendaciones ciudadanas y números de WhatsApp.
- **Super Admin Exclusivo (`/superadmin`):** 
  - Login en `/superadmin/login` con clave única: **`Contraseña123.`**
  - No requiere usuario, solo el password maestro.
  - Guarda una cookie `httpOnly` llamada `superadmin_token` con expiración de 8 horas.
  - Interfaz dedicada exclusivamente a:
    1. 🤝 **Aliados Comerciales** (Hoteles, Restaurantes, Cafés, etc.), con **coordenadas GPS (Latitud/Longitud)** para recomendación por cercanía.
    2. 📊 **CRM del Chatbot** (Auditoría completa de chats, geolocalización de visitantes y analítica).

---

## 4. Chatbot Inteligente y Sistema de Geolocalización

Ubicado en el frontend global mediante el componente `components/ChatbotWidget.tsx`.

### 4.1 Geolocalización en tiempo real
1. Al abrir el chat, un banner amigable consulta: *"¿Quieres recomendaciones según tu zona en Loja?"*.
2. Si el visitante acepta, se activa `navigator.geolocation.getCurrentPosition`.
3. El frontend envía la latitud/longitud a `/api/geo-decode`.
4. La API realiza reverse geocoding con **OpenStreetMap Nominatim** y extrae:
   - Ciudad / Cantón (Loja, Catamayo, Paltas, Saraguro, etc.)
   - Parroquia / Barrio / Zona urbana o rural
   - Provincia y País
5. El bot envía un saludo confirmando la zona y adapta el contexto de la IA para priorizar sitios, hoteles y eventos cercanos a su localización real.
6. Si el usuario omite o rechaza, el asistente funciona con recomendaciones generales de Loja.

### 4.2 Arquitectura RAG del Chatbot (`/api/chat`)
- Recibe el array de mensajes, `sessionId` (persistido en `localStorage`) y `ubicacion`.
- **Motor de Clasificación y Extracción Semántica:**
  - Extrae intenciones de búsqueda: temporalidad (hoy, rango de fechas, histórico/pasados) y palabras clave temáticas (ej: "rock", "teatro", "infantil", "feria", etc.).
  - Realiza consultas multivariables a la base de datos (Prisma/MySQL) sobre `nombre`, `descripcion` y `lugar`.
- Inyecta en el prompt del sistema:
  - Fecha y hora actual en Ecuador (`America/Guayaquil`).
  - Ubicación geográfica detectada del usuario (`lat`/`lng` + zona textual).
  - **Estado temporal explícito de cada evento:** Clasificado como `¡HOY!`, `PRÓXIMO` o `FINALIZADO / PASADO` para que el bot pueda dar resúmenes cronológicos precisos sin alucinar.
  - **Cálculo de Proximidad Inteligente (Fórmula Haversine):** Compara la ubicación del usuario con las coordenadas `ubicacionLat`/`ubicacionLng` de cada aliado comercial registrado, ordenándolos por cercanía y especificando la distancia exacta (ej. *"a 320 metros de distancia"* o *"a 1.8 km"*).
  - Catálogo de Atractivos Cantonales (turismo cruzado B2G).
  - **Regla Estricta Anti-Alucinación:** Si el usuario consulta por un género o tema inexistente en la cartelera, la IA tiene instrucción imperativa de aclarar con honestidad que no hay eventos de ese tipo programados y ofrecer alternativas reales vigentes.
- Devuelve respuesta conversacional formateada + tarjetas interactivas de eventos, aliados comerciales (con botones de WhatsApp/Web/Google Maps) y rutas turísticas.
- En background (asíncrono sin retrasar la respuesta al cliente), almacena o actualiza la sesión en `chat_sessions` y registra los mensajes en `chat_messages`.

---

## 5. Taxonomía Fija y Parroquias

### Categorías (5, catálogo cerrado)
- `arte-y-exposiciones` → Arte y exposiciones
- `teatro` → Teatro
- `musica` → Música
- `ferias` → Ferias
- `artes-vivas` → Artes Vivas (categoría ancla cultural del cantón)

### Zonas / Parroquias (19 del cantón Loja)
- **Urbanas (6):** El Sagrario, Sucre, El Valle, San Sebastián, Punzara, Carigán.
- **Rurales (13):** Chantaco, Chuquiribamba, El Cisne, Gualel, Jimbilla, Malacatos, Quinara, San Lucas, San Pedro de Vilcabamba, Santiago, Taquil, Vilcabamba, Yangana.

---

## 6. Zona Horaria — REGLA CRÍTICA INVARIANTE

Ecuador continental es **UTC-5 todo el año** (`America/Guayaquil`).

1. Todas las fechas en la base de datos se guardan en `DateTime` UTC.
2. Toda conversión y formateo de fechas vive exclusivamente en **`lib/fechas.ts`**.
3. **Prohibido** usar `new Date(fechaString)` arbitrariamente sin pasar por los helpers de `lib/fechas.ts`.
4. Los inputs de fecha tipo `date` sin hora se interpretan como **mediodía Ecuador (17:00 UTC)** para evitar desfases de día anterior.
5. Formateo oficial: siempre con `formatFechaLoja()` o `formatFechaHoraLoja()`.

---

## 7. Modelo de Datos Completo (`prisma/schema.prisma`)

### Catálogos y Eventos
- **`categorias`**: `id`, `slug`, `nombre`.
- **`zonas`**: `id`, `nombre`, `tipo` (`URBANA` | `RURAL`).
- **`eventos`**:
  - `id`, `nombre`, `slug` (determinista), `fecha`, `fechaFin`.
  - `lugar`, `descripcion`, `imagenUrl`, `multimedia` (Json con array de imágenes).
  - `videoUrl` (FB, IG, TikTok, YouTube, Vimeo con iframe/thumbnail propio).
  - `mapaUrl` (enlace interactivo a Google Maps).
  - `estado` (`PENDIENTE`, `APROBADO`, `RECHAZADO`).
  - `nombreGestor`, `institucionRelacionada`, `confianzaClasificacion`.
  - Relaciones FK con `categoriaId` y `zonaId`.

### Módulos Institucionales y Notificaciones
- **`instituciones`**: Cuentas con login para entidades culturales aliadas (`nombre`, `slug`, `password`, `activa`).
- **`numeros_notificacion`**: Teléfonos WhatsApp con formato internacional para recibir alertas cuando entra un evento nuevo.
- **`recomendaciones`**: Buzón ciudadano de sugerencias y comentarios.
- **`banners_hero`**: Banners administrables para el carrusel principal (`titulo`, `subtitulo`, `link`, `imagenDesktop`, `imagenMobile`, `orden`, `activo`).

### Comercial B2B y Turismo Cantonal
- **`aliados`**: Directorio de patrocinadores y aliados comerciales (`nombre`, `tipo`, `descripcion`, `ubicacion`, `mapaUrl`, `rangoPrecio`, `servicios`, `cuartos`, `telefono`, `websiteUrl`, `redesUrl`, `imagenUrl`, `destacado`, `activo`).
  - Tipos: `HOSPEDAJE`, `GASTRONOMIA`, `EXPERIENCIA`, `TRANSPORTE`, `CANTON_GAD`, `CULTURA_ARTE`, `COMERCIO`, `OTRO`.
- **`atractivos_cantonales`**: Rutas y atractivos de la provincia (`nombre`, `canton`, `descripcion`, `distancia`, `ruta`, `imagenUrl`, `mapaUrl`, `activo`).

### CRM Chatbot y Geolocalización
- **`chat_sessions`**:
  - `id`, `sessionId` (VarChar 64, UNIQUE).
  - `ubicacionLat`, `ubicacionLng` (coordenadas GPS del usuario).
  - `zonaDetectada` (barrio/parroquia amigable para el frontend).
  - `direccionDetallada` (dirección física detallada/completa para auditoría en SuperAdmin).
  - `ciudad`, `provincia`, `pais`.
  - `userAgent`, `ipAddress`, `totalMensajes`.
  - `createdAt`, `updatedAt`.
- **`chat_messages`**:
  - `id`, `sessionId` (FK hacia `chat_sessions`).
  - `sender` (`user` | `bot`).
  - `contenido` (texto completo del mensaje).
  - `aliadosIds`, `eventosIds`, `atractivosIds` (Json arrays con IDs recomendados).
  - `createdAt`.

---

## 8. Integraciones Externas

### 8.1 Notificaciones WhatsApp (Evolution API)
- Ubicación: `lib/whatsappNotificaciones.ts`.
- Endpoint: `EVOLUTION_API_URL` (`http://178.238.238.158:8080`).
- Instancia: `agenda-cultural`.
- Envía mensaje automático a los números de `numeros_notificacion` cuando un gestor cultural envía un evento nuevo para moderación.

### 8.2 Automatización Redes Sociales (Agente Hermes VPS)
- Ubicación: `lib/actions/moderacionEvento.ts` y helpers de webhook.
- Endpoint: `HERMES_WEBHOOK_URL` (`http://178.238.238.158:3000/webhook/evento`).
- Al aprobar un evento en el panel admin, se despacha un webhook firmado con `HERMES_WEBHOOK_SECRET` para que el agente en el VPS cree copys y publique en redes sociales.

### 8.3 Bunny CDN
- Ubicación: `app/api/upload/route.ts` y `app/api/upload/direct-url/route.ts`.
- Sube afiches, galerías y banners optimizados con Sharp directamente al almacenamiento en la nube de Bunny.

---

## 9. Rutas de la Aplicación

```
software/
├── app/
│   ├── page.tsx                           # Portada: Hero, Banners, Eventos destacados, Categorías
│   ├── layout.tsx                         # Layout global con ChatbotWidget y Navbar
│   ├── sobre-el-proyecto/page.tsx         # Manifiesto y propósito cultural
│   ├── publicar/page.tsx                  # Formulario público de eventos con galería y videos
│   │
│   ├── eventos/
│   │   ├── page.tsx                       # Cartelera completa con buscador y filtros
│   │   ├── [slug]/page.tsx                # Ficha de evento con Schema.org, Maps y Multimedia
│   │   ├── categoria/[categoria]/page.tsx # Eventos por categoría con SEO enriquecido
│   │   └── zona/[zona]/page.tsx           # Eventos por parroquia
│   │
│   ├── admin/                             # Panel de moderación general
│   │   ├── login/page.tsx                 # Autenticación con ADMIN_PASSWORD
│   │   └── page.tsx                       # Bandeja de revisión, banners, buzón y WhatsApp
│   │
│   ├── superadmin/                        # Super Admin exclusivo
│   │   ├── layout.tsx                     # Verificación de cookie superadmin_token
│   │   ├── login/page.tsx                 # Login con clave "Contraseña123."
│   │   ├── page.tsx                       # Carga de datos SSR
│   │   ├── superadmin-dashboard-client.tsx# Switcher de pestañas Aliados / CRM
│   │   └── superadmin-crm.tsx             # Dashboard CRM de conversaciones y geolocalización
│   │
│   └── api/
│       ├── chat/route.ts                  # Motor IA del chatbot + guardado CRM
│       ├── geo-decode/route.ts            # Reverse geocoding Nominatim
│       ├── upload/route.ts                # Subida de imágenes a Bunny CDN
│       ├── media/resolve/route.ts         # Resolución de miniaturas de video
│       ├── superadmin/auth/route.ts       # Endpoint de login/logout SuperAdmin
│       └── superadmin/sessions/route.ts   # Paginación y analítica de sesiones de chat
```

---

## 10. Variables de Entorno

Configuradas en `.env` y `.env.local`:

```env
DATABASE_URL="mysql://usuario:password@host:port/basededatos"
GROQ_API_KEY="gsk_..."
DEEPSEEK_API_KEY="sk-..."
ADMIN_PASSWORD="admin123_loja"
BUNNY_STORAGE_ZONE="culturallojablog"
BUNNY_API_KEY="..."
BUNNY_PULL_ZONE_URL="https://culturallojablog.b-cdn.net"

# Notificaciones WhatsApp — Evolution API
EVOLUTION_API_URL="http://178.238.238.158:8080"
EVOLUTION_API_KEY="42a447c1-3d74-4b52-9571-042c174f7621"
EVOLUTION_INSTANCE="agenda-cultural"
NEXT_PUBLIC_APP_URL="https://www.agendaculturalloja.com"

# Agente Hermes VPS — Automatización Redes Sociales
HERMES_WEBHOOK_URL="http://178.238.238.158:3000/webhook/evento"
HERMES_WEBHOOK_SECRET="hermes_agenda_loja_secret_2026"
HERMES_BUSINESS_ID="agenda_cultural_loja"
```

---

## 11. Comandos de Verificación y Compilación

- **Compilación TypeScript estricta:** `npx tsc --noEmit`
- **Generación de Prisma Client:** `npx prisma generate`
- **Sincronización de Base de Datos:** `npx prisma db push`
- **Build de producción Next.js:** `npm run build`
- **Ejecución local en desarrollo:** `npm run dev`

---

## 12. Historial de Cambios del Documento

- **2026-08-14** — Creación del documento técnico inicial: Prisma 7 MariaDB adapter, regla crítica de fechas UTC-5, categorización IA con Groq y estructura de moderación.
- **2026-09-17** — **Actualización integral del ecosistema:**
  - Incorporación del **Super Admin exclusivo** (`/superadmin`) con clave única `Contraseña123.` y cookie HttpOnly.
  - Implementación del **CRM del Chatbot en tiempo real** con métricas de zonas y analítica de sesiones (`chat_sessions`, `chat_messages`).
  - Implementación de **Geolocalización nativa y reverse geocoding con Nominatim** (`/api/geo-decode`) en el chatbot (`ChatbotWidget.tsx`).
  - Documentación de **Aliados Comerciales** y **Atractivos Cantonales** para turismo cruzado B2B y B2G.
  - Integración de **WhatsApp con Evolution API** e integración con **Agente Hermes en VPS** para distribución en redes.
  - Documentación de campos multimedia (`multimedia`, `videoUrl`, `mapaUrl`, `fechaFin`).