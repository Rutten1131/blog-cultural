# 🤖 Arquitectura y Documentación Maestra del Bot Multisite (4 Bases de Datos)

Este documento detalla la arquitectura definitiva, las conexiones activas y el funcionamiento exacto de las **4 bases de datos** en los 3 proyectos hermanos de Loja (`agendaculturalloja.com`, `quecomerenloja.com`, `agendaturisticaloja.com`).

---

## 1. Mapa de las 4 Bases de Datos y Fuentes de Datos

```mermaid
flowchart TD
    subgraph CLIENTES ["🌐 Los 3 Proyectos Web (Frontend + Chat Widget)"]
        WEB_CULTURAL["1. Agenda Cultural Loja (agendaculturalloja.com)\nCHATBOT_SITE_ID: agenda-cultural-loja"]
        WEB_GASTRO["2. Qué Comer en Loja (quecomerenloja.com)\nCHATBOT_SITE_ID: que-comer-en-loja"]
        WEB_TURISMO["3. Agenda Turística Loja (agendaturisticaloja.com)\nCHATBOT_SITE_ID: agenda-turistica-loja"]
    end

    subgraph BOT_CORE ["🧠 NÚCLEO Y ROUTER DE SKILLS (app/api/chat/route.ts)"]
        ROUTER["Router de Intenciones (chatRouter.ts)\n+ Skill Orchestrator (skillOrchestrator.ts)"]
    end

    subgraph BASES_DATOS ["🗄️ Las 4 Bases de Datos Especializadas"]
        DB_BOT[("1. DB GENERAL DEL BOT (CHATBOT_DB_URL)\n• Host: mysql.us.stackcp.com:44521\n• DB: Botempresas-353039368f96\n• Datos: chat_sessions, chat_messages,\n  bot_sites, solicitudes_reserva")]
        DB_EVENTOS[("2. DB EVENTOS (EVENTOS_DB_URL)\n• Host: mysql.us.stackcp.com:44369\n• DB: agendaculturalbd-313930d0fa\n• Datos: eventos culturales, categorías,\n  lugares, recintos y fechas")]
        DB_TURISMO[("3. DB TURÍSTICA / HOSPEDAJE (TURISTICA_DB_URL)\n• Host: mysql.us.stackcp.com:46132\n• DB: agendatursticdinamic-31383916da\n• Datos: hoteles, hostales, habitaciones,\n  tarifas, atractivos cantonales")]
        DB_GASTRO[("4. DB GASTRONOMÍA (GASTRONOMIA_DB_URL)\n• Host: mysql.us.stackcp.com:46630\n• DB: quecomerlojadinamic-313931562a\n• Datos: restaurantes, cafeterías, especialidades,\n  platos típicos, menús")]
    end

    WEB_CULTURAL --> ROUTER
    WEB_GASTRO --> ROUTER
    WEB_TURISMO --> ROUTER

    ROUTER -->|Siempre: Lee/Escribe Memoria, Sesión y Leads| DB_BOT
    ROUTER -.->|Skill Eventos (cartelera / qué hacer)| DB_EVENTOS
    ROUTER -.->|Skill Hospedaje + Turismo (dónde dormir / rutas)| DB_TURISMO
    ROUTER -.->|Skill Gastronomía (dónde comer / cafés)| DB_GASTRO
```

---

## 2. Variables de Entorno Homogéneas (Presentes en los 3 Proyectos)

Todos los proyectos (`.env.local`) tienen exactamente las mismas variables configuradas:

```env
# =========================================================
# ARQUITECTURA 4 DBs - CHATBOT MULTISITE LOJA
# =========================================================
# 1. Base de datos central del Bot (CRM, memoria, sesiones, leads)
CHATBOT_DB_URL="mysql://Botempresas-353039368f96:nb3%25.yCmga2%7C@mysql.us.stackcp.com:44521/Botempresas-353039368f96"

# 2. Identificador del sitio emisor
CHATBOT_SITE_ID="agenda-cultural-loja" # o "agenda-turistica-loja" o "que-comer-en-loja"

# 3. Base de datos de Eventos Culturales
EVENTOS_DB_URL="mysql://agendaculturalbd-313930d0fa:a%2BTi5%404cCgY%3A@mysql.us.stackcp.com:44369/agendaculturalbd-313930d0fa"

# 4. Base de datos de Hospedaje y Atractivos Turísticos
TURISTICA_DB_URL="mysql://agendatursticdinamic-31383916da:-fr%3F%23I%7DoZVxb@mysql.us.stackcp.com:46132/agendatursticdinamic-31383916da"

# 5. Base de datos de Restaurantes y Cafeterías
GASTRONOMIA_DB_URL="mysql://quecomerlojadinamic-313931562a:%7BbS_c5HrdlrW@mysql.us.stackcp.com:46630/quecomerlojadinamic-313931562a"
# =========================================================
```

---

## 3. Rol de Cada Base de Datos y Qué Extrae Cada Skill

### 🗄️ 1. Base de Datos General del Bot (`CHATBOT_DB_URL`)
* **Host / Puerto:** `mysql.us.stackcp.com:44521`
* **Base de Datos:** `Botempresas-353039368f96`
* **Propósito:** El cerebro conversacional común y el CRM multisitio.
* **Tablas que gestiona:**
  * `bot_sites`: Registro de los proyectos autorizados.
  * `chat_sessions`: Memoria persistente, ubicación GPS del visitante, nombre, resumen de conversación filtrado por `siteId`.
  * `chat_messages`: Historial de mensajes, tokens y los IDs recomendados (`eventosIds`, `aliadosIds`, `atractivosIds`).
  * `solicitudes_reserva`: Registro unificado de intenciones comerciales de reserva y leads.

### 🎭 2. Base de Datos de Eventos Culturales (`EVENTOS_DB_URL`)
* **Host / Puerto:** `mysql.us.stackcp.com:44369`
* **Base de Datos:** `agendaculturalbd-313930d0fa`
* **Skill responsable:** `skillEventos.ts`
* **Datos extraídos:**
  * Cartelera de eventos aprobados (`titulo`, `fechaInicio`, `fechaFin`, `lugar`, `slug`, `descripcion`, `imagenUrl`).
  * Búsquedas por fechas (hoy, mañana, fin de semana) y por temáticas artísticas/culturales.

### 🌿 3. Base de Datos de Agenda Turística (`TURISTICA_DB_URL`)
* **Host / Puerto:** `mysql.us.stackcp.com:46132`
* **Base de Datos:** `agendatursticdinamic-31383916da`
* **Skills responsables:** `skillHospedaje.ts` y `skillTurismo.ts`
* **Datos extraídos:**
  * `aliados` (tipo `HOSPEDAJE`): Hoteles, hosterías, hostales activos, con sus contactos y WhatsApp de reserva directa.
  * `aliado_habitaciones`: Tipos de habitación (individual, matrimonial, familiar), tarifas por noche y comodidades.
  * `atractivos_cantonales`: Parroquias, senderos, cascadas, rutas y sitios emblemáticos de Loja.

### 🍽️ 4. Base de Datos de Qué Comer en Loja (`GASTRONOMIA_DB_URL`)
* **Host / Puerto:** `mysql.us.stackcp.com:46630`
* **Base de Datos:** `quecomerlojadinamic-313931562a`
* **Skill responsable:** `skillGastronomia.ts`
* **Datos extraídos:**
  * `aliados` (tipo `GASTRONOMIA` y `CAFETERIA`): Restaurantes, cafeterías de especialidad y picanterías tradicionales.
  * `aliado_habitaciones`: Usado como platos recomendados, especialidades gastronómicas (repe, cecina, tamal, cuy, café de altura) y rangos de precio.
  * WhatsApp directo del local para pedidos o reservas de mesa.

---

## 4. Estado de Conexión y Flujo en Tiempo Real

1. **Lazy Loading Inteligente:** Solo se consulta la base de datos de contenido si el usuario solicita explícitamente esa información. Si saluda o pregunta algo general, **no se tocan las DBs de contenido**, protegiendo el rendimiento.
2. **Consultas Cruzadas sin Fricción:** Un usuario en *Agenda Cultural* puede preguntar por un hotel o un café, y el bot consulta directamente la DB turística o gastronómica sin salir de su sesión.
3. **Persistencia Centralizada:** Todo lead o conversación queda guardado en la DB del bot con su respectivo `siteId`, permitiendo reportería global o por proyecto.
