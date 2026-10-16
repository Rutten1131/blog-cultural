# 🏛️ Arquitectura de Transición Multi-DB: Centralización en Botempresas

> **Fecha de Configuración:** Octubre 2026  
> **Estado:** Activo y Probado en Producción  
> **Propósito:** Describir la estrategia transitoria donde la base de datos `Botempresas-353039368f96` aloja temporalmente el contenido de **Hospedaje (Hoteles)**, **Gastronomía (Restaurantes)** y **Atractivos Cantonales**, mientras que los **Eventos Culturales** provienen de la base de datos principal de **Agenda Cultural**.

---

## 1. Mapa de Distribución Actual de Datos

| Dominio de Información | Base de Datos Activa | Cadena de Conexión | Modelo / Tabla Prisma | Estado Futuro |
| :--- | :--- | :--- | :--- | :--- |
| **🎭 Eventos Culturales** | `agendaculturalbd-313930d0fa` | `DATABASE_URL` (Agenda Cultural) | `prisma.evento` | Base definitiva de Agenda Cultural |
| **🏨 Hospedaje / Hoteles** | `Botempresas-353039368f96` | `CHATBOT_DB_URL` | `prismaBot.aliados` (tipo: `HOSPEDAJE`), `prismaBot.aliado_habitaciones` | Se migrará a `DB_TURISMO_URL` |
| **🍽️ Gastronomía / Restaurantes** | `Botempresas-353039368f96` | `CHATBOT_DB_URL` | `prismaBot.aliados` (tipo: `GASTRONOMIA` / `CAFETERIA`), `prismaBot.aliado_habitaciones` | Se migrará a `DB_GASTRONOMIA_URL` |
| **🌿 Atractivos y Rutas** | `Botempresas-353039368f96` | `CHATBOT_DB_URL` | `prismaBot.atractivos_cantonales` | Se migrará a `DB_TURISMO_URL` |
| **💬 Sesiones, Mensajes y Leads** | `Botempresas-353039368f96` | `CHATBOT_DB_URL` | `prismaBot.chat_sessions`, `chat_messages`, `solicitudes_reserva` | Base definitiva multi-sitio del Bot |

---

## 2. Por qué esta Arquitectura Evita Iteraciones y Errores

1. **Cero dependencias cruzadas complejas:**  
   Al copiar la carpeta `bot/paquete-migracion/` a **Qué Comer en Loja** o **Agenda Turística Loja**, ambos proyectos ya tienen acceso inmediato a sus aliados y atractivos conectándose a `CHATBOT_DB_URL`, sin requerir que la base de datos local de cada proyecto esté creada todavía.
2. **Desacoplamiento total en el código (`contenidoService.ts`):**  
   Ni el prompt (`route.ts`), ni el componente UI (`ChatbotWidget.tsx`), ni la memoria conversacional (`chatMemory.ts`) saben de qué base de datos viene la información. Solo consumen:
   - `eventosService`
   - `gastronomiaService`
   - `turismoService`
3. **Mantenimiento en un solo punto:**  
   Si se agrega un nuevo hotel o restaurante en `Botempresas-353039368f96`, se refleja de inmediato en los 3 chatbots al mismo tiempo.

---

## 3. Guía Paso a Paso para la Migración Futura a DBs Propias

Cuando en el futuro crees las bases de datos dedicadas para **Qué Comer en Loja** (`DB_GASTRONOMIA_URL`) y **Agenda Turística Loja** (`DB_TURISMO_URL`), estos son los únicos 3 pasos a seguir:

### Paso 1: Exportar las tablas desde `Botempresas` a las nuevas DBs
- **Para Qué Comer en Loja:**
  ```sql
  -- Copiar aliados de gastronomía a la nueva DB:
  INSERT INTO nueva_db_gastro.aliados SELECT * FROM Botempresas.aliados WHERE tipo IN ('GASTRONOMIA', 'CAFETERIA');
  INSERT INTO nueva_db_gastro.aliado_habitaciones SELECT * FROM Botempresas.aliado_habitaciones WHERE aliadoId IN (SELECT id FROM nueva_db_gastro.aliados);
  ```
- **Para Agenda Turística Loja:**
  ```sql
  -- Copiar aliados de hospedaje y atractivos a la nueva DB:
  INSERT INTO nueva_db_turismo.aliados SELECT * FROM Botempresas.aliados WHERE tipo = 'HOSPEDAJE';
  INSERT INTO nueva_db_turismo.aliado_habitaciones SELECT * FROM Botempresas.aliado_habitaciones WHERE aliadoId IN (SELECT id FROM nueva_db_turismo.aliados);
  INSERT INTO nueva_db_turismo.atractivos_cantonales SELECT * FROM Botempresas.atractivos_cantonales;
  ```

### Paso 2: Configurar las variables en `.env`
```env
DB_GASTRONOMIA_URL="mysql://usuario:password@host:puerto/db_quecomerenloja"
DB_TURISMO_URL="mysql://usuario:password@host:puerto/db_agendaturistica"
```

### Paso 3: Redirigir `contenidoService.ts`
En `lib/chat/contenidoService.ts`, cambiar únicamente las líneas internas de `gastronomiaService` y `turismoService` para que apunten al nuevo cliente Prisma en lugar de `prismaBot`. 
**No se toca una sola línea de prompts, memoria ni componentes visuales.**

---

## 4. Cómo Migrar la Carpeta a un Nuevo Proyecto (Procedimiento "Copiar y Pegar")

1. Copiar los archivos de `bot/paquete-migracion/` a la raíz del proyecto destino.
2. En `.env.local` configurar:
   ```env
   CHATBOT_DB_URL="mysql://Botempresas-353039368f96:nb3%25.yCmga2%7C@mysql.us.stackcp.com:44521/Botempresas-353039368f96"
   DATABASE_URL="mysql://agendaculturalbd-313930d0fa:a%2BTi5%404cCgY%3A@mysql.us.stackcp.com:44369/agendaculturalbd-313930d0fa"
   CHATBOT_SITE_ID="agendaturisticaloja" # o "quecomerenloja"
   DEEPSEEK_API_KEY="sk-..."
   ```
3. Ejecutar:
   ```bash
   npx prisma generate --schema=prisma/schema-bot.prisma
   ```
4. Insertar el `<ChatbotWidget origen="agendaturisticaloja" />` en el `layout.tsx`.
