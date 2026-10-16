================================================================================
PAQUETE DE MIGRACIÓN COMPLETO — CHATBOT MULTISITE LOJA
Última actualización: 15 Oct 2026
================================================================================

Este directorio contiene TODOS los archivos de código necesarios para llevar
este chatbot inteligente a tus otros dos proyectos:
1. Qué Comer en Loja (quecomerenloja.com)
2. Agenda Turística Loja (agendaturisticaloja.com)

================================================================================
DECISIÓN ARQUITECTURAL: ¿POR QUÉ DUPLICAR EL CÓDIGO?
================================================================================

Cada proyecto tiene su PROPIO /api/chat — NO comparten el endpoint de Agenda Cultural.

VENTAJAS de duplicar vs. centralizar:
  ✅ Independencia total — si un proyecto cae, los otros siguen funcionando
  ✅ Sin CORS ni llamadas cross-domain en producción
  ✅ Cada site llama directamente a SU propio backend (más rápido, más simple)
  ✅ Cada proyecto puede personalizar su bot de forma independiente
  ✅ El paquete de migración (esta carpeta) actúa como "master" para sincronizar

LO QUE SÍ COMPARTEN los 3 proyectos:
  📦 La misma DB del bot (CHATBOT_DB_URL) — CRM centralizado con todas las sesiones
  📦 Los mismos archivos de código (se copian y cada uno se configura con su .env)

LO QUE CADA PROYECTO TIENE POR SEPARADO:
  🗄️ Su propia DATABASE_URL (su contenido: eventos / restaurantes / turismo)
  🔑 Su propio CHATBOT_SITE_ID ("agendacultural", "quecomerenloja", "agendaturisticaloja")
  🌐 Su propio dominio y deploy independiente

================================================================================

✅ MEJORAS APLICADAS HOY (ya incluidas en los archivos de esta carpeta):

1. TYPEWRITER HUMANO — ChatbotWidget.tsx
   - Base de escritura: ~65ms por tick (antes era 12ms, ahora se siente natural)
   - Pausa de "fin de frase" tras . ! ? … : 320–420ms
   - Pausa media tras , ; : : 130–180ms
   - Pausa aleatoria base: 55–80ms (simula variación humana)
   - Pausa inicial de "pensando": 280ms antes del primer carácter

2. CONSISTENCIA TEMPORAL — app/api/chat/route.ts
   - nowEcuador() reescrita: calcula GMT-5 restando 5h al UTC puro
     (evita bugs en entornos Node.js donde toLocaleString() puede fallar)
   - Toda la lógica de fechas usa getUTCDate()/setUTCDate() de forma consistente
   - extraerRangoFecha() completamente reescrita sin toLocaleDateString()
   - Comparación HOY usa triple comprobación UTC (año + mes + día)
   - Nombres de días en eventos generados con array local sin depender de Intl
   - System prompt fortalecido: ancla explícita de día-de-semana ↔ fecha
     → "El día de la semana de hoy es 'miércoles'. NUNCA menciones otro día."

================================================================================
1. ¿QUÉ CONTIENE ESTA CARPETA? (Estructura idéntica al proyecto de destino)
================================================================================

paquete-migracion/
├── components/
│   └── ChatbotWidget.tsx          <- Interfaz de usuario completa:
│                                     - Botón flotante animado con badges y burbuja
│                                     - Ventana de chat moderna con modo oscuro / claro
│                                     - Typewriter con ritmo HUMANO (no robótico)
│                                     - Auto-scroll inteligente que no interrumpe la lectura
│                                     - Geolocalización GPS con botón "🔄 Actualizar"
│                                     - Bloques separados para Hoteles y Restaurantes
│                                     - Preguntas sugeridas descartables con botón (✕)
│                                     - Soporte multilenguaje (ES / EN)
│
├── app/api/
│   ├── chat/
│   │   └── route.ts               <- Cerebro del Chatbot:
│   │                                 - Router de intenciones (saludos, eventos, hoteles, comida, venta)
│   │                                 - Memoria contextual y resumen automático con IA
│   │                                 - RAG temático y temporal (hoy, fin de semana, rangos)
│   │                                 - Flujo de venta en 5 pasos hacia WhatsApp
│   │                                 - Rate limiter anti-abusos por IP
│   │                                 - Caché ultrarrápida en memoria
│   └── geo-decode/
│       └── route.ts               <- Geocodificación inversa gratuita con OpenStreetMap (lat/lng -> barrio)
│
├── lib/
│   ├── prisma-bot.ts              <- Cliente singleton conectado a la DB central del bot
│   └── chat/
│       ├── contenidoService.ts    <- Capa desacoplada multi-DB (eventos, gastronomía, turismo)
│       ├── chatMemory.ts          <- Manejo de sesiones y síntesis de historial en la DB del bot
│       ├── chatRouter.ts          <- Clasificador heurístico de intenciones
│       └── chatCache.ts           <- Sistema de caché TTL para respuestas frecuentes
│
├── prisma/
│   └── schema-bot.prisma          <- Esquema Prisma de la base de datos central del bot
│                                     (tablas: bot_sites, chat_sessions, chat_messages, solicitudes_reserva)
│
├── prisma-bot.config.ts           <- Configuración de compilación para aislar el cliente Prisma del bot
│
└── README.txt                     <- Este manual paso a paso


================================================================================
2. PASO 1: COPIAR LOS ARCHIVOS AL NUEVO PROYECTO
================================================================================

Simplemente copia todo el contenido dentro de "paquete-migracion" directamente
en la raíz del proyecto destino (ej: D:\Abel paginas\quecomerenloja\software).
Los archivos caerán automáticamente en sus carpetas correspondientes:
- components/
- app/api/chat/
- app/api/geo-decode/
- lib/
- prisma/
- prisma-bot.config.ts (en la raíz)


================================================================================
3. PASO 2: VARIABLES DE ENTORNO (.env) DEL NUEVO PROYECTO
================================================================================

Abre o crea el archivo .env en tu nuevo proyecto y agrega estas variables:

# Base de datos central del bot (ES LA MISMA en todos los proyectos para compartir CRM):
CHATBOT_DB_URL="mysql://Botempresas-353039368f96:nb3%25.yCmga2%7C@mysql.us.stackcp.com:44521/Botempresas-353039368f96"

# Identificador del sitio web (CAMBIA SEGÚN EL PROYECTO):
# Para Qué Comer en Loja:
CHATBOT_SITE_ID="quecomerenloja"
# Para Agenda Turística Loja:
# CHATBOT_SITE_ID="agendaturisticaloja"

# Tu base de datos principal del proyecto:
DATABASE_URL="mysql://usuario:password@host:puerto/nombre_base_de_datos"

# Claves de IA:
DEEPSEEK_API_KEY="sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
GROQ_API_KEY="gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"


================================================================================
4. PASO 3: ACTUALIZAR package.json — CRÍTICO PARA PRODUCCIÓN (VERCEL)
================================================================================

⚠️  SIN ESTE PASO EL DEPLOY EN VERCEL FALLARÁ con:
    Error: Module not found: Can't resolve '../node_modules/.prisma/bot-client'

Abre el package.json del nuevo proyecto y actualiza el script "postinstall":

  ANTES:
    "postinstall": "prisma generate",

  DESPUÉS:
    "postinstall": "prisma generate && prisma generate --schema=prisma/schema-bot.prisma",

¿Por qué? Vercel ejecuta "postinstall" automáticamente al instalar dependencias.
Si solo genera el schema principal, el cliente del bot (bot-client) nunca existe
en producción y el build explota. Este cambio hace que se generen AMBOS clientes.


================================================================================
5. PASO 4: GENERAR EL CLIENTE PRISMA DEL BOT (LOCAL)
================================================================================

Solo necesitas correr esto UNA VEZ localmente (o cuando cambie schema-bot.prisma):

  npx prisma generate --schema=prisma/schema-bot.prisma

Esto compilará el cliente Prisma independiente dentro de:
node_modules/.prisma/bot-client (sin tocar el Prisma principal del proyecto).


================================================================================
5. PASO 4: AGREGAR EL WIDGET AL LAYOUT PRINCIPAL (layout.tsx)
================================================================================

Abre app/layout.tsx en el nuevo proyecto y coloca el componente:

--- EJEMPLO PARA: Qué Comer en Loja (quecomerenloja.com) ---
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
          welcomeMessage="¡Hola! 👋 Bienvenido a QuéComerEnLoja. ¿Qué se te antoja probar hoy? Pregúntame por comida típica, el mejor repe lojano, cafeterías de especialidad o restaurantes recomendados."
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

--- EJEMPLO PARA: Agenda Turística Loja (agendaturisticaloja.com) ---
import { ChatbotWidget } from "@/components/ChatbotWidget";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
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
            "🗺️ Atractivos turísticos por cantón"
          ]}
        />
      </body>
    </html>
  );
}


================================================================================
6. DEPENDENCIAS REQUERIDAS (En package.json del nuevo proyecto)
================================================================================

Asegúrate de que tu package.json tenga estas dependencias estándar (ya usadas en Next.js):
- @prisma/client
- @prisma/adapter-mariadb (o el driver mysql de prisma que uses)
- lucide-react (para los iconos de la interfaz)
- prisma (en devDependencies)

Si te falta lucide-react:
  npm install lucide-react

¡Listo! Con estos pasos el bot estará 100% operativo en cualquier proyecto.
================================================================================
