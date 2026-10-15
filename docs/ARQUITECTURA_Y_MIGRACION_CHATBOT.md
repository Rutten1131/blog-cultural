# 🧠 Arquitectura, Extracción de Datos y Migración del Chatbot Multisite

Este documento detalla técnicamente **qué datos consume el chatbot, de qué base de datos los extrae, qué parte vive en el código vs. qué parte vive en la DB**, y la **guía paso a paso para migrar el bot a otros proyectos** (`quecomerenloja.com` y `agendaturisticaloja.com`).

---

## 1. La Gran Separación: ¿Qué está en el Código y qué está en la Base de Datos?

Para entender el bot, imagina que tiene dos cerebros:
1. **La Lógica, Personalidad y Filtros (En el CÓDIGO)**.
2. **El Conocimiento, Inventario y Memoria (En la BASE DE DATOS)**.

```mermaid
flowchart TD
    subgraph CODIGO ["💻 EN EL CÓDIGO (Repositorio Next.js)"]
        W[ChatbotWidget.tsx: UI, Streaming, Geolocalización, Botones]
        R[app/api/chat/route.ts: Router de Intenciones, Prompts, Cálculo Haversine GPS]
        CM[lib/chat/chatMemory.ts: Resúmenes dinámicos con IA]
        CC[lib/chat/chatCache.ts: Caché en memoria para respuestas rápidas]
    end

    subgraph DB_CONTENIDO ["🗄️ DB 1: Contenido & Aliados (DATABASE_URL)"]
        E[(eventos: Cartelera cultural y fechas)]
        A[(aliados: Hoteles, Restaurantes, Cafés, Precios, GPS, WhatsApp)]
        AH[(aliado_habitaciones: Habitaciones o platos/menús)]
        AC[(atractivos_cantonales: Cascadas, Parques, Rutas)]
    end

    subgraph DB_BOT ["🤖 DB 2: Cerebro Multisite (CHATBOT_DB_URL)"]
        BS[(bot_sites: Sitios registrados agendacultural, quecomerenloja...)]
        CS[(chat_sessions: Sesiones, Lead name, Ubicación, Resumen)]
        MS[(chat_messages: Historial de mensajes y recomendaciones IDs)]
        SR[(solicitudes_reserva: Leads capturados para aliados)]
    end

    W -->|Envía mensaje + origen| R
    R -->|Lee contenido comercial y cultural| DB_CONTENIDO
    R -->|Guarda mensajes y lee memoria| DB_BOT
    CM -->|Lee y actualiza resúmenes| DB_BOT
```

---

## 2. Detalle Exhaustivo: ¿Qué está en el CÓDIGO?

| Elemento en el Código | Archivo | ¿Qué hace exactamente? |
| :--- | :--- | :--- |
| **System Prompts / Personalidad** | `app/api/chat/route.ts` | Define cómo habla el bot según el sitio (`quecomerenloja` habla de gastronomía, `agendaturisticaloja` de turismo, `agendacultural` de cartelera). |
| **Reglas de Conversación y Venta** | `app/api/chat/route.ts` | Reglas estrictas: *"Máximo 3 frases"*, *"Cero alucinación"*, *"Terminar con pregunta"*, los 5 pasos del embudo de venta. |
| **Cálculo de Distancias GPS** | `app/api/chat/route.ts` | Fórmula matemática de Haversine que toma la latitud/longitud del usuario y la compara con los aliados para ordenarlos por cercanía. |
| **Clasificación de Intenciones** | `lib/chat/chatRouter.ts` | Analiza el texto del usuario para saber si busca *"hospedaje"*, *"gastronomía"*, *"eventos"*, *"naturaleza"* o si quiere *"reservar"*. |
| **Streaming UI y Renderizado** | `components/ChatbotWidget.tsx` | La interfaz gráfica, el efecto de tipeo suave, las tarjetas con fotos de aliados, el selector de ubicación y el botón de WhatsApp. |

---

## 3. Detalle Exhaustivo: ¿Qué está en las BASES DE DATOS?

### A. Base de Datos de Contenido (`DATABASE_URL`) — Lo que el bot lee

#### 1. Tabla `aliados` (Hospedajes, Restaurantes y Cafeterías)
* **¿Qué campos lee el bot?**
  * `id`: Identificador único (ej: `1`, `4`).
  * `nombre`: Nombre comercial (ej: *"Hotel Gran Victoria"*, *"La Huerta Lojana"*).
  * `tipo`: Enum (`HOSPEDAJE`, `GASTRONOMIA`, `CAFETERIA`).
  * `descripcion`: Párrafo descriptivo del negocio.
  * `ubicacion`: Dirección en texto (ej: *"Av. Universitaria y 18 de Noviembre"*).
  * `ubicacionLat` y `ubicacionLng`: Coordenadas GPS para medir distancia contra el usuario.
  * `rangoPrecio`: Texto con precios (ej: *"$45 - $80 / noche"* o *"$10 - $22 por persona"*).
  * `servicios`: Lista de amenidades (ej: *"Wifi, parqueadero, desayuno"*).
  * `telefono`: Número de WhatsApp internacional para mandar clientes al cerrar venta.
  * `imagenUrl`: Foto de portada para la tarjeta visual.
  * `activo`: Booleano (solo recomienda si está en `true`).
  * `destacado`: Booleano para priorizar clientes premium en las primeras tarjetas.

#### 2. Tabla `aliado_habitaciones` (Sub-opciones: Habitaciones o Menú)
* **¿Qué campos lee el bot?**
  * `aliadoId`: Clave foránea que lo conecta con su respectivo aliado.
  * `nombre`: Nombre de la opción (ej: *"Habitación Matrimonial"*, *"Menú Degustación Lojano"*).
  * `precio`: Precio unitario (ej: *"$65"*, *"$15"*).
  * `caracteristicas`: Qué incluye (ej: *"Cama King, balcón, desayuno"*).
  * `imagenes`: JSON con URLs de fotos de esa opción.

#### 3. Tabla `eventos` (Cartelera Cultural)
* **¿Qué campos lee el bot?**
  * `id`: ID único.
  * `nombre`: Título del evento.
  * `fecha` y `fecha_fin`: Fecha exacta del evento en zona horaria `America/Guayaquil`.
  * `lugar`: Recinto (ej: *"Teatro Benjamín Carrión"*, *"Museo Puerta de la Ciudad"*).
  * `descripcion`: Sinopsis del evento.
  * `slug`: Enlace relativo `/eventos/[slug]` para el botón *"Ver evento"*.
  * `estado`: Solo consulta los que estén en `APROBADO`.

#### 4. Tabla `atractivos_cantonales` (Turismo y Naturaleza)
* **¿Qué campos lee el bot?**
  * `nombre`: Ej: *"Parque Nacional Podocarpus"*, *"Valle de Vilcabamba"*.
  * `canton`: Loja, Saraguro, Catamayo, etc.
  * `distancia`: Ej: *"A 40 min de Loja (35 km)"*.
  * `ruta`: Vía de acceso recomendada.
  * `descripcion`: Qué hacer en el lugar.

---

### B. Base de Datos del Bot (`CHATBOT_DB_URL` - `Botempresas-353039368f96`) — Lo que el bot guarda

#### 1. Tabla `bot_sites` (Multisitio)
* Registra los sitios autorizados que usan el bot:
  * `1` ➔ `agenda-cultural-loja`
  * `2` ➔ `quecomerenloja`
  * `3` ➔ `agendaturisticaloja`

#### 2. Tabla `chat_sessions` (CRM de Sesiones de Usuarios)
* `sessionId`: Token único del navegador del visitante.
* `siteId`: De qué página vino la sesión.
* `nombreUsuario`: Nombre de la persona capturado en el chat (Lead Qualification).
* `zonaDetectada` / `ciudad` / `ubicacionLat` / `ubicacionLng`: Datos GPS del usuario.
* `totalMensajes`: Conteo de interacciones.
* `contextoResumen`: Memoria sintetizada por IA para recordar preferencias en futuras visitas.

#### 3. Tabla `chat_messages` (Historial de Mensajes)
* `sessionId`: A qué conversación pertenece.
* `sender`: `"user"` o `"bot"`.
* `contenido`: Texto del mensaje.
* `eventosIds`, `aliadosIds`, `atractivosIds`: Array JSON con los IDs que el bot recomendó en ese mensaje.

#### 4. Tabla `solicitudes_reserva` (Leads Generados)
* Si el cliente llena el formulario del chatbot para reservar en un hotel o restaurante, se guarda aquí con su teléfono, fechas y número de personas.

---

## 4. Guía de Migración Paso a Paso a los Otros 2 Proyectos

Cuando lleves el chatbot a **`quecomerenloja.com`** o **`agendaturisticaloja.com`**:

### Paso 1: Copiar los Archivos del Bot al Nuevo Proyecto
Solo debes copiar esta estructura exacta:
```text
├── components/
│   └── ChatbotWidget.tsx          # Componente visual interactivo
├── app/
│   └── api/
│       ├── chat/
│       │   └── route.ts           # Endpoint principal del bot (Router + IA + RAG)
│       └── geo-decode/
│           └── route.ts           # Geocodificador GPS gratuito
├── lib/
│   ├── prisma.ts                  # Cliente para la DB de contenido
│   ├── prisma-bot.ts              # Cliente para la DB central del bot
│   └── chat/
│       ├── chatMemory.ts          # Síntesis de resúmenes de memoria
│       ├── chatRouter.ts          # Clasificador de intenciones
│       └── chatCache.ts           # Caché en memoria
├── prisma/
│   └── schema-bot.prisma          # Schema del bot
└── prisma-bot.config.ts           # Configuración de Prisma para el bot
```

### Paso 2: Configurar las Variables en el `.env` del Nuevo Proyecto
En el `.env` del nuevo proyecto agregas:
```env
# Conexión a la DB de contenido (puedes compartir la misma o tener una réplica)
DATABASE_URL="mysql://..."

# Conexión a la DB compartida del bot (LA MISMA EN TODOS LOS PROYECTOS):
CHATBOT_DB_URL="mysql://Botempresas-353039368f96:nb3%25.yCmga2%7C@mysql.us.stackcp.com:44521/Botempresas-353039368f96"

# Para quecomerenloja.com:
CHATBOT_SITE_ID="quecomerenloja"

# Llave de IA (DeepSeek o Groq):
DEEPSEEK_API_KEY="tu_clave_deepseek"
GROQ_API_KEY="tu_clave_groq"
```

### Paso 3: Incrustar el Componente en el Layout
En el `layout.tsx` del proyecto de destino:

* **Para QuéComerEnLoja (`quecomerenloja.com`):**
  ```tsx
  import { ChatbotWidget } from "@/components/ChatbotWidget";

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="es">
        <body>
          {children}
          <ChatbotWidget
            origen="quecomerenloja"
            btnLabel="¿Dónde comer en Loja?"
            tooltipText="¿Buscas restaurantes, platos típicos o cafeterías?"
            headerTitle="¿Dónde comer en Loja?"
            headerSubtitle="Guía Gastronómica y Restaurantes de Loja"
            iconEmoji="🍽️"
            acento="orange"
            headerGradient="from-orange-600 via-amber-600 to-yellow-500"
            welcomeMessage="¡Hola! 👋 Bienvenido a QuéComerEnLoja. ¿Qué se te antoja probar hoy? Pregúntame por comida típica, el mejor repe, cafeterías de especialidad o restaurantes recomendados."
            preguntasSugeridas={[
              "🍽️ ¿Dónde comer el mejor repe lojano?",
              "☕ Cafeterías con buen café de especialidad",
              "🍕 Restaurantes para cenar hoy",
              "🥩 Lugares de comida típica lojana"
            ]}
          />
        </body>
      </html>
    );
  }
  ```

* **Para Agenda Turística Loja (`agendaturisticaloja.com`):**
  ```tsx
  <ChatbotWidget
    origen="agendaturisticaloja"
    btnLabel="¿Qué visitar en Loja?"
    tooltipText="¿Buscas rutas naturales, cantones u hospedaje?"
    headerTitle="Agenda Turística Loja"
    headerSubtitle="Rutas, Parques, Naturaleza y Hospedaje"
    iconEmoji="🌿"
    acento="emerald"
    headerGradient="from-emerald-700 via-teal-700 to-cyan-600"
    welcomeMessage="¡Hola! 🌿 Te doy la bienvenida a la Agenda Turística de Loja. Pregúntame sobre qué lugares visitar, senderos, cascadas, atractivos en Vilcabamba o dónde hospedarte."
    preguntasSugeridas={[
      "🌿 ¿Qué lugares visitar en Loja?",
      "🏨 ¿Dónde hospedarse en Vilcabamba?",
      "🚶 Rutas de senderismo y naturaleza",
      "🚗 ¿Qué cantones conocer cerca de Loja?"
    ]}
  />
  ```

---

## 5. Resumen Ejecutivo de la Arquitectura

1. **El widget es 100% reutilizable:** con cambiar solo las propiedades (`origen`, `iconEmoji`, `headerGradient`, etc.) cambia de apariencia y comportamiento sin tocar código interno.
2. **La API detecta el sitio:** la ruta `app/api/chat/route.ts` lee el parámetro `origen` y cambia automáticamente el system prompt del modelo.
3. **La DB del Bot es única y centralizada:** todos los clientes y reservas se guardan ordenadamente en `Botempresas-353039368f96` bajo su respectivo `siteId`.
