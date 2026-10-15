# 📦 Guía de Migración y Despliegue del Bot en Otros Proyectos

Esta guía describe los pasos necesarios para llevar este bot listo y funcional a **`quecomerenloja.com`** y **`agendaturisticaloja.com`**.

---

## 1. Archivos que Componen el Bot (El "Paquete del Bot")

Para migrar el bot a un nuevo proyecto, únicamente se copian estos archivos:

```text
├── components/
│   └── ChatbotWidget.tsx          # Componente React completo (UI, streaming, geolocalización, tarjetas)
├── app/
│   └── api/
│       ├── chat/
│       │   └── route.ts           # Endpoint central del bot (RAG, prompts, clasificación de intenciones)
│       └── geo-decode/
│           └── route.ts           # Geocodificador GPS gratuito vía OpenStreetMap
├── lib/
│   ├── prisma.ts                  # Cliente de la DB local del proyecto
│   ├── prisma-bot.ts              # Cliente singleton de la DB central del Bot
│   └── chat/
│       ├── contenidoService.ts    # Capa de datos desacoplada (eventos, gastronomía, turismo)
│       ├── chatMemory.ts          # Síntesis y memoria conversacional con IA
│       ├── chatRouter.ts          # Clasificador de intenciones del usuario
│       └── chatCache.ts           # Memoria caché para respuestas ultrarrápidas
├── prisma/
│   └── schema-bot.prisma          # Esquema de Prisma de la DB del Bot
└── prisma-bot.config.ts           # Configuración de Prisma exclusiva para el bot
```

---

## 2. Variables de Entorno Requeridas (`.env`)

En cada proyecto se configuran las variables de conexión:

```env
# 1. Base de datos central compartida del bot (LA MISMA EN TODOS LOS PROYECTOS):
CHATBOT_DB_URL="mysql://Botempresas-353039368f96:nb3%25.yCmga2%7C@mysql.us.stackcp.com:44521/Botempresas-353039368f96"

# 2. Identificador de este sitio web (según corresponda):
# CHATBOT_SITE_ID="agenda-cultural-loja"
# CHATBOT_SITE_ID="quecomerenloja"
# CHATBOT_SITE_ID="agendaturisticaloja"

# 3. Base de datos propia del proyecto (donde viven sus páginas dinámicas):
DATABASE_URL="mysql://usuario:password@host:puerto/nombre_db"

# 4. Bases de datos remotas para consultas cruzadas del bot:
DB_EVENTOS_URL="mysql://..."        # DB de Agenda Cultural Loja
DB_GASTRONOMIA_URL="mysql://..."    # DB de Qué Comer en Loja
DB_TURISMO_URL="mysql://..."        # DB de Agenda Turística Loja

# 5. Claves de IA (DeepSeek principal + Groq como respaldo):
DEEPSEEK_API_KEY="sk-..."
GROQ_API_KEY="gsk_..."
```

---

## 3. Integración en el Layout Principal

Una vez copiados los archivos, solo se agrega `<ChatbotWidget />` en el `layout.tsx` de cada proyecto personalizando sus propiedades de marca:

### A. Para Qué Comer en Loja (`quecomerenloja.com`):
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

### B. Para Agenda Turística Loja (`agendaturisticaloja.com`):
```tsx
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
            "🚗 ¿Qué cantones conocer cerca de Loja?"
          ]}
        />
      </body>
    </html>
  );
}
```

---

## 4. Checklist de Validación al Migrar

- [ ] Instalar dependencias requeridas en el nuevo proyecto (`@prisma/client`, `@prisma/adapter-mariadb`, `mysql2`, `dotenv`).
- [ ] Ejecutar `npx prisma generate --config prisma-bot.config.ts` para compilar el cliente del bot.
- [ ] Verificar que el widget responda fluidamente y guarde los mensajes en `Botempresas-353039368f96` con su respectivo `siteId`.
