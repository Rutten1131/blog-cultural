# 📖 Cómo Jala la Data el Chatbot — Guía Técnica Definitiva

> **Propósito de este documento:** Que cualquier desarrollador (o tú mismo en 6 meses) entienda exactamente qué tablas se consultan, qué campos entran al contexto de la IA, bajo qué condiciones se activa cada consulta, y cómo ampliar el sistema a las 3 bases de datos adicionales cuando estén disponibles.

---

## 🗂️ Estructura de Archivos Clave

```
app/api/chat/route.ts        ← Núcleo: orquesta la conversación y el prompt IA
lib/chat/contenidoService.ts ← Capa de Simulación Multi-DB (eventosService, gastronomiaService, turismoService)
lib/prisma.ts               ← Cliente Prisma para la DB principal (Agenda Cultural)
lib/prisma-bot.ts           ← Cliente Prisma para la DB del Bot (sesiones, mensajes, CRM)
prisma/schema.prisma        ← Esquema de la DB principal (eventos, aliados, atractivos)
prisma/schema-bot.prisma    ← Esquema de la DB del Bot (chat_sessions, chat_messages, etc.)
lib/chat/chatMemory.ts      ← Funciones de memoria de sesión (lee/escribe en DB Bot)
lib/chat/chatRouter.ts      ← Clasifica la intención del usuario ANTES de ir a la DB
lib/chat/chatCache.ts       ← Caché en memoria para respuestas repetidas (evita DB hits)
```

---

## 🔑 Las 2 Bases de Datos Activas (Estado Actual)

### DB 1 — DB Principal de Agenda Cultural (`DATABASE_URL`)
- **Contiene:** Eventos, Aliados (hoteles, restaurantes, cafeterías), Atractivos Cantonales
- **Cliente Prisma:** `import { prisma } from "@/lib/prisma"`
- **Host:** Tu MySQL de cPanel / StackCP principal

### DB 2 — DB del Bot (`CHATBOT_DB_URL`)
- **Contiene:** Sesiones de chat, mensajes, resúmenes de memoria, leads y reservas
- **Cliente Prisma:** `import { prismaBot } from "@/lib/prisma-bot"`
- **Host:** `mysql.us.stackcp.com:44521` → `Botempresas-353039368f96`

---

## ⚙️ Cómo Fluye una Petición (Paso a Paso)

```
Usuario escribe mensaje
        │
        ▼
[1] RATE LIMITER → ¿demasiadas peticiones desde esa IP? → 429 Too Many Requests
        │
        ▼
[2] ROUTER DE INTENCIONES (clasificarIntencionUsuario)
    → Clasifica: EVENTOS | VENTA_ALIADO | PLANIFICA_VISITA | WHATSAPP_HANDOFF | AMBIGUO
    → SIN tocar ninguna DB todavía
        │
        ▼
[3] CACHÉ HIT → Si la pregunta es repetida/genérica y hay respuesta guardada:
    → Sí: recupera IDs cacheados → busca entidades frescas por ID → retorna sin consulta completa
    → No: continúa al siguiente paso
        │
        ▼
[4] MEMORIA DE SESIÓN (lee de DB Bot)
    → prismaBot.chat_sessions.findUnique(sessionId)
    → Obtiene: resumen de conversación previa, nombre del usuario, zona GPS
        │
        ▼
[5] CONSULTAS A DB PRINCIPAL (en paralelo con Promise.all donde aplica)
    → Eventos (filtrado por intención: fecha, temática, etc.)
    → Aliados (hoteles + restaurantes, con distancia GPS calculada)
    → Atractivos cantonales
        │
        ▼
[6] FORMATEO DEL CONTEXTO → Arma el "System Prompt" con los datos reales de la DB
        │
        ▼
[7] LLAMADA A IA (DeepSeek primary → Groq fallback)
        │
        ▼
[8] GUARDAR EN DB BOT (en background, no bloquea la respuesta)
    → prismaBot.chat_sessions.upsert(...)
    → prismaBot.chat_messages.create(...)
        │
        ▼
[9] RESPUESTA AL USUARIO (JSON: texto + IDs de eventos/aliados/atractivos)
```

---

## 📋 Qué Datos Extrae de Cada Tabla

### Tabla: `evento` (DB Principal)

**¿Cuándo se consulta?** Siempre que el usuario pregunte algo que no sea una consulta de venta directa de un aliado específico.

**Campos que lee el bot:**
| Campo | Uso en el bot |
|-------|---------------|
| `id` | Se incluye en `eventosRecomendadosIds[]` para que el frontend muestre las tarjetas |
| `nombre` | Nombrar el evento en la respuesta y detectar referencias contextuales |
| `fecha` | Filtrado temporal (hoy, mañana, fin de semana, rango específico) |
| `lugar` | Informar al usuario dónde es el evento |
| `slug` | Construir el enlace `/eventos/[slug]` en la tarjeta |
| `imagenUrl` | Imagen en la tarjeta del frontend |
| `descripcion` | Hasta 600 caracteres enviados al contexto de la IA |
| `estado` | SIEMPRE se filtra: solo se cargan eventos en estado `APROBADO` |

**Tipos de búsqueda (se evalúan en orden, el primero que aplique gana):**

```typescript
// A. PASADOS: usuario pregunta "qué hubo" / "el historial" / "eventos anteriores"
{ estado: "APROBADO", fecha: { lt: hoyInicio } }   // desc, take: 6

// B. TEMÁTICA: palabras clave detectadas (ej: "rock", "teatro", "infantil")
{ estado: "APROBADO", fecha: { gte: hoyInicio },
  OR: palabrasClave.flatMap(p => [
    { nombre: { contains: p } },
    { descripcion: { contains: p } },
    { lugar: { contains: p } },
  ])
}  // asc, take: 6

// C. RANGO DE FECHA: "este fin de semana", "el 18 de noviembre", "en octubre"
{ estado: "APROBADO", fecha: { gte: rangoDesde, lte: rangoHasta } }  // asc, take: 8

// D. GENERAL (fallback): próximos eventos sin filtro temático
{ estado: "APROBADO", fecha: { gte: hoyInicio } }  // asc, take: 6
```

---

### Tabla: `aliado` (DB Principal)

**¿Cuándo se consulta?** En prácticamente TODAS las peticiones (junto con eventos). Contiene restaurantes, cafeterías y hoteles aliados del proyecto.

> **⚠️ Nota Temporal:** Actualmente, los aliados de tipo `HOSPEDAJE`, `GASTRONOMIA` y `CAFETERIA` viven todos en esta misma DB. En el futuro, `GASTRONOMIA`/`CAFETERIA` migrarán a `DB_GASTRO_URL` y `HOSPEDAJE` a `DB_TURISMO_URL`. Ver sección "Simulación Multi-DB" más abajo.

**Campos que lee el bot:**
| Campo | Uso en el bot |
|-------|---------------|
| `id` | Se incluye en `aliadosRecomendadosIds[]` |
| `nombre` | Nombrarlo en la respuesta y detectar menciones del usuario |
| `tipo` | Filtra por `HOSPEDAJE`, `GASTRONOMIA`, `CAFETERIA` según el contexto |
| `ubicacion` | Dirección en texto plano para la respuesta |
| `ubicacionLat` / `ubicacionLng` | Cálculo de distancia Haversine desde el GPS del usuario |
| `descripcion` | Hasta ~300 chars al contexto |
| `estrellas` | Categoría del hotel/restaurante |
| `numeroCuartos` | Solo para hoteles (`HOSPEDAJE`) |
| `servicios` | Lista de amenidades (wifi, desayuno, parqueadero, etc.) |
| `rangoPrecio` | Texto orientativo de precios (ej: "$30-$60 / noche") |
| `telefono` | Número de WhatsApp para el handoff de reserva |
| `websiteUrl` | Enlace a su web oficial |
| `mapaUrl` | Enlace a Google Maps |
| `destacado` | Los aliados destacados aparecen primero en la lista |
| `activo` | SIEMPRE se filtra: solo aliados con `activo: true` |
| `habitaciones[]` | Sub-tabla con tipos, precios y características |

**Consulta base:**
```typescript
prisma.aliado.findMany({
  where: { activo: true },
  orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
  take: 20,
  include: { habitaciones: { orderBy: [{ orden: "asc" }, { id: "asc" }] } },
})
```

**Ordenamiento por GPS (si el usuario compartió su ubicación):**
```typescript
// Se calcula distancia Haversine a cada aliado que tenga lat/lng
// Los más cercanos al usuario suben al top de la lista
aliadosConDistancia.sort((a, b) => a.distanciaKm - b.distanciaKm);
```

---

### Tabla: `habitaciones` (sub-tabla de `aliado`)

**¿Cuándo se usa?** En el flujo de venta interactivo (pasos 2 al 5) cuando el usuario pregunta por un hotel o restaurante específico.

**Campos:**
| Campo | Uso |
|-------|-----|
| `nombre` | Tipo de habitación o plato estrella ("Suite Matrimonial", "Repe Lojano") |
| `precio` | Precio unitario a mostrar en el flujo de venta |
| `caracteristicas` | Qué incluye esa habitación/opción específica |
| `orden` | Para mostrarlas en el orden correcto definido en el superadmin |

---

### Tabla: `atractivoCantonal` (DB Principal)

**¿Cuándo se consulta?** Cuando el usuario pregunta por naturaleza, rutas, cascadas, cantones, senderismo, ecoturismo, etc.

**Campos:**
| Campo | Uso |
|-------|-----|
| `id` | Se incluye en `atractivosRecomendadosIds[]` |
| `nombre` | Nombre del atractivo (ej: "Parque Nacional Podocarpus") |
| `canton` | A qué cantón pertenece |
| `distancia` | Texto de distancia desde Loja (ej: "35 km") |
| `ruta` | Cómo llegar |
| `descripcion` | Descripción para el contexto de la IA |
| `activo` | Solo se cargan atractivos con `activo: true` |

---

### Tablas del Bot (DB Bot — `CHATBOT_DB_URL`)

#### `chat_sessions`
| Campo | Para qué sirve |
|-------|----------------|
| `sessionId` | UUID del visitante (generado en el frontend) |
| `siteId` | Qué web originó el chat (`agenda-cultural-loja`, `quecomerenloja`, `agendaturisticaloja`) |
| `nombreUsuario` | Nombre capturado durante Lead Qualification |
| `ubicacionLat/Lng` | Coordenadas GPS del visitante |
| `zonaDetectada` | Barrio o zona (ej: "Menfis Bajo", "Centro Histórico") |
| `direccionDetallada` | Dirección completa resuelta por OpenStreetMap |
| `contextoResumen` | Resumen comprimido de la conversación (generado por IA cada 10 mensajes) |
| `intencionDetectada` | Última intención clasificada por el router |
| `totalMensajes` | Contador acumulativo de mensajes en la sesión |

#### `chat_messages`
| Campo | Para qué sirve |
|-------|----------------|
| `sessionId` | FK a `chat_sessions` |
| `sender` | `"user"` o `"bot"` |
| `contenido` | Texto del mensaje (máx. 5000 chars) |
| `eventosIds` | Array JSON de IDs de eventos recomendados en ese mensaje |
| `aliadosIds` | Array JSON de IDs de aliados recomendados |
| `atractivosIds` | Array JSON de IDs de atractivos recomendados |

#### `solicitudes_reserva`
| Campo | Para qué sirve |
|-------|----------------|
| `aliadoId` | ID del hotel/restaurante al que se quiere reservar |
| `nombreCliente` | Nombre capturado en el flujo de venta |
| `telefonoCliente` | Teléfono del prospecto |
| `fechaInicio/Fin` | Fechas de la reserva solicitada |
| `estado` | `PENDIENTE` → `CONFIRMADA` → `CANCELADA` |

---

## 🔄 Memoria de Sesión: Cómo Funciona

```typescript
// lib/chat/chatMemory.ts

// Obtiene los últimos 10 mensajes de la sesión + resumen comprimido
obtenerMemoriaSesion(sessionId: string) → {
  resumen: string | null,        // Resumen de IA de mensajes anteriores
  mensajesRecientes: Message[],  // Últimos 10 mensajes para contexto inmediato
  totalMensajes: number
}

// Cada 10 mensajes nuevos, genera un resumen comprimido automáticamente con IA
sincronizarResumenSiCorresponde(sessionId: string)
```

El resumen comprimido se inyecta en el System Prompt para que la IA recuerde conversaciones largas sin enviar miles de tokens.

---

## 🚀 Simulación Multi-DB Implementada en Código (`lib/chat/contenidoService.ts`)

### La Solución Implementada
Para no esperar a tener las otras bases de datos y dejar el código listo hoy mismo, creamos una **capa de abstracción de servicios** en [`lib/chat/contenidoService.ts`](file:///D:/Abel%20paginas/agenda%20cultural/software/lib/chat/contenidoService.ts):

1. **`eventosService`**: Simula la futura DB de eventos (`agendaculturalloja.com`).
2. **`gastronomiaService`**: Simula la futura DB de restaurantes y cafeterías (`quecomerenloja.com`).
3. **`turismoService`**: Simula la futura DB de hoteles y rutas (`agendaturisticaloja.com`).
4. **`consultarFuentesContenido()`**: Orquestador que ejecuta en paralelo las consultas simulando llamadas multi-DB independientes.

**En el código de `route.ts` YA NO se consulta la tabla `aliado` ni `evento` directamente en el flujo principal:**
```typescript
// app/api/chat/route.ts
const fuentesContenido = await consultarFuentesContenido({
  ubicacion: ubicacion?.lat && ubicacion?.lng ? { lat: ubicacion.lat, lng: ubicacion.lng } : undefined,
});
const aliados = fuentesContenido.aliados; // Hoteles + Restaurantes unidos con GPS calculado
const atractivos = fuentesContenido.atractivos;
```

**Beneficio inmediato:** Cuando crees las bases de datos externas de Qué Comer en Loja y Agenda Turística Loja, **NO tendrás que tocar ni `route.ts`, ni el prompt de la IA, ni el frontend**. Solo se cambian los métodos internos dentro de `lib/chat/contenidoService.ts` para que apunten a sus respectivos clientes Prisma.

### Plan de Migración Cuando Lleguen las Nuevas DBs

Cuando tengas las credenciales de `DB_GASTRONOMIA_URL` y `DB_TURISMO_URL`, la migración será:

**Paso 1:** Agregar variables de entorno en `.env`:
```bash
# Ya existe:
DATABASE_URL="mysql://..."           # DB principal Agenda Cultural (eventos)
CHATBOT_DB_URL="mysql://..."         # DB del Bot (sesiones/memoria)

# Agregar cuando estén disponibles:
DB_GASTRONOMIA_URL="mysql://..."     # DB QueComerEnLoja (restaurantes)
DB_TURISMO_URL="mysql://..."         # DB AgendaTuristicaLoja (hoteles + rutas)
```

**Paso 2:** Crear clientes Prisma para cada nueva DB:
```typescript
// lib/prisma-gastro.ts
import { PrismaClient } from "@prisma/gastro-client";
const globalForPrismaGastro = global as unknown as { prismaGastro: PrismaClient };
export const prismaGastro =
  globalForPrismaGastro.prismaGastro || new PrismaClient({ datasourceUrl: process.env.DB_GASTRONOMIA_URL });
if (process.env.NODE_ENV !== "production") globalForPrismaGastro.prismaGastro = prismaGastro;

// lib/prisma-turismo.ts  (igual pero para DB_TURISMO_URL)
```

**Paso 3:** En `route.ts`, reemplazar las consultas de aliados:
```typescript
// ANTES (todo en una DB con filtro tipo):
const aliados = await prisma.aliado.findMany({ where: { activo: true } });

// DESPUÉS (consultas paralelas a 3 DBs especializadas):
const [eventos, restaurantes, hoteles, atractivos] = await Promise.all([
  // DB Agenda Cultural → solo eventos
  prisma.evento.findMany({ where: { estado: "APROBADO", ... } }),

  // DB QueComerEnLoja → restaurantes
  prismaGastro.restaurante.findMany({ where: { activo: true } }),

  // DB AgendaTuristicaLoja → hoteles y atractivos
  prismaHoteles.hotel.findMany({ where: { activo: true } }),
  prismaHoteles.atractivoCantonal.findMany({ where: { activo: true } }),
]);
```

**Paso 4:** Los schemas de las nuevas DBs deben tener (como mínimo) estos campos para que el bot funcione sin cambios en el prompt:

**Restaurante (DB Gastronomía):**
```prisma
model restaurante {
  id          Int      @id @default(autoincrement())
  nombre      String
  tipo        String   // "GASTRONOMIA" | "CAFETERIA"
  ubicacion   String
  ubicacionLat Float?
  ubicacionLng Float?
  descripcion String   @db.Text
  rangoPrecio String?
  telefono    String?
  websiteUrl  String?
  mapaUrl     String?
  destacado   Boolean  @default(false)
  activo      Boolean  @default(true)
  platos      plato[]  // Sub-tabla de platos estrella / menú
}
```

**Hotel (DB Turismo):**
```prisma
model hotel {
  id           Int      @id @default(autoincrement())
  nombre       String
  tipo         String   // "HOSPEDAJE"
  ubicacion    String
  ubicacionLat Float?
  ubicacionLng Float?
  descripcion  String   @db.Text
  estrellas    Int?
  numeroCuartos Int?
  servicios    String?
  rangoPrecio  String?
  telefono     String?
  websiteUrl   String?
  mapaUrl      String?
  destacado    Boolean  @default(false)
  activo       Boolean  @default(true)
  habitaciones habitacion[]
}
```

> **✅ Regla de oro:** Mantener los mismos nombres de campos entre las 3 DBs para que el código de formateo del contexto (`aliadosContexto`) funcione sin modificar el prompt de la IA.

---

## 🎯 Contexto Que Recibe la IA (Lo Que Entra al System Prompt)

La IA de DeepSeek recibe el siguiente bloque de contexto por cada petición:

```
FECHA Y HORA ACTUAL: [fecha Ecuador GMT-5]
UBICACIÓN GPS DEL USUARIO: Zona "Menfis Bajo" (Loja)

RESUMEN DE CONVERSACIÓN PREVIA:
[Resumen comprimido de mensajes anteriores si hay más de 10]

ALIADOS COMERCIALES:
[ID:1] Hotel Gran Victoria | Tipo:HOSPEDAJE | Dirección: Bernardo Valdivieso... | 
       DISTANCIA GPS: a 450 metros (¡MUY CERCA!) | Precio:$55-$90 / noche | 
       WhatsApp:0998123456 | Tipos de habitación: Simple ($55) / Doble ($70) / Suite ($90)

[ID:2] La Huerta Lojana | Tipo:GASTRONOMIA | Dirección: Av. Universitaria... | ...

ATRACTIVOS CANTONALES:
[ID:1] Parque Nacional Podocarpus | Cantón:Loja | Distancia:10 km | ...

EVENTOS DISPONIBLES:
[ID:45] Noche de Boleros | Estado:¡HOY! | Fecha:mié, 15 oct 2026 20:00 | 
        Lugar:Teatro Benjamín Carrión | Descripción:... | Enlace:/eventos/noche-de-boleros
```

**Formato de respuesta que devuelve la IA (siempre JSON):**
```json
{
  "texto": "Respuesta cálida en 2-3 frases con pregunta final...",
  "eventosRecomendadosIds": [45],
  "aliadosRecomendadosIds": [1, 2],
  "atractivosRecomendadosIds": []
}
```

El frontend (`ChatbotWidget.tsx`) usa esos IDs para mostrar las tarjetas visuales de eventos, hoteles y restaurantes debajo del mensaje de texto.

---

## 📌 Resumen Visual: Estado Actual vs. Estado Futuro

```
══════════════════════════════════════════════════════════════
  ESTADO ACTUAL (1 DB de contenido + 1 DB Bot)
══════════════════════════════════════════════════════════════

  prisma (DATABASE_URL)           prismaBot (CHATBOT_DB_URL)
  ├── evento ──────────────┐      ├── chat_sessions
  ├── aliado (tipo=*)  ────┼───→  ├── chat_messages
  │   ├── HOSPEDAJE        │      └── solicitudes_reserva
  │   ├── GASTRONOMIA      │
  │   └── CAFETERIA        │
  └── atractivoCantonal ───┘
  
  ↓ Todo filtrado por campo `tipo` en la misma tabla `aliado` ↓

══════════════════════════════════════════════════════════════
  ESTADO FUTURO (4 DBs especializadas)
══════════════════════════════════════════════════════════════

  prisma (DATABASE_URL)            → eventos, atractivosCantonal
  prismaGastro (DB_GASTRO_URL)     → restaurantes, cafeterias, platos
  prismaHoteles (DB_TURISMO_URL)   → hoteles, habitaciones, rutas
  prismaBot (CHATBOT_DB_URL)       → sesiones, memoria, CRM (sin cambios)

  Todos consultados en paralelo via Promise.all() en route.ts
══════════════════════════════════════════════════════════════
```

---

## ✅ Checklist de Migración (Para Cuando Tengas las Nuevas DBs)

- [ ] Crear base de datos MySQL en cPanel para QueComerEnLoja
- [ ] Crear base de datos MySQL en cPanel para AgendaTuristicaLoja
- [ ] Agregar `DB_GASTRONOMIA_URL` y `DB_TURISMO_URL` en `.env` de los 3 proyectos
- [ ] Crear `prisma/schema-gastro.prisma` con el modelo `restaurante` y `plato`
- [ ] Crear `prisma/schema-turismo.prisma` con los modelos `hotel` y `habitacion`
- [ ] Crear `lib/prisma-gastro.ts` y `lib/prisma-turismo.ts` (singleton pattern)
- [ ] Ejecutar `npx prisma db push --schema=prisma/schema-gastro.prisma`
- [ ] Ejecutar `npx prisma db push --schema=prisma/schema-turismo.prisma`
- [ ] En `route.ts`: reemplazar `prisma.aliado.findMany()` por consultas paralelas `Promise.all()`
- [ ] Migrar los aliados existentes de la DB principal a sus nuevas DBs especializadas
- [ ] Probar que el bot responda correctamente con las 4 DBs activas
- [ ] Actualizar `ARQUITECTURA_4_DBS.md` indicando que la migración fue completada

---

*Última actualización: Octubre 2026 | Proyecto: Agenda Cultural Loja*
