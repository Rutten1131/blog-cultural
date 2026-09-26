# Implementación: Auto-publicación en Redes Sociales desde WhatsApp Worker

**Fecha:** 2026-09-26  
**Autor:** GitHub Copilot  
**Estado:** Código implementado localmente — **pendiente despliegue en VPS**

---

## 🎯 Objetivo

Conectar el flujo de **auto-publicación del WhatsApp Worker** con el **scheduler de redes sociales (Vercel)** para que:

1. El worker detecta posts completos en WhatsApp (título, fecha, lugar, imagen, confianza ≥ 50%)
2. Los publica automáticamente en la web (estado `APROBADO`) — **ya funcionaba**
3. **NUEVO:** Automáticamente programa la publicación en Facebook/Instagram vía webhook de Vercel
4. Respeta límite de **5 publicaciones/día** para evitar spam
5. Evita duplicados (un evento = una publicación en redes)

---

## 📦 Archivos Creados / Modificados

### 1. Nuevo: `vps/whatsapp-worker/lib/redes-sociales-worker.js`
Módulo JavaScript (ESM-compatible) que encapsula toda la lógica de publicación en redes sociales para el worker.

**Funciones exportadas:**
- `programarPublicacionEnRedes(eventoId, { forzar })` — Principal: programa un evento en FB/IG
- `verificarLimiteDiario()` — Verifica si quedan cupos del día
- `obtenerEstadisticasHoy()` — Stats para monitoreo
- `MAX_PUBLICACIONES_DIARIAS` — Constante (default: 5)

**Características:**
- Replica la lógica de `lib/redesSociales.ts` (Next.js) en JavaScript puro para el worker
- Construye caption optimizado con hashtags, fecha/hora en zona horaria Loja (UTC-5)
- Calcula `scheduledAt` inteligente:
  - Evento > 48h: 48h antes a las 10:00 AM Loja (15:00 UTC)
  - Evento ≤ 48h: en 15 minutos
- Soporta 3 formatos: `FEED_POST`, `CAROUSEL`, `REEL`
- Registra todo en tabla `publicaciones_redes_sociales` (éxito/fallo)
- Timeout 12s al webhook, User-Agent identificativo

### 2. Modificado: `vps/whatsapp-worker/lib/url-extractor.js`
- **Import agregado:** `const { programarPublicacionEnRedes } = require("./redes-sociales-worker");`
- **En `autoPublicarSiCompleto()`** (después de crear evento y notificar a César):
  ```javascript
  // ── PROGRAMAR PUBLICACIÓN EN REDES SOCIALES ──
  try {
    const resultadoRedes = await programarPublicacionEnRedes(nuevoEvento.id);
    if (resultadoRedes.success) {
      console.log(`[AutoPublish] 📱 Publicación en redes sociales programada para evento #${nuevoEvento.id}`);
    } else {
      console.log(`[AutoPublish] ⚠️ No se programó en redes sociales: ${resultadoRedes.motivo || resultadoRedes.error}`);
    }
  } catch (redesErr) {
    console.error("[AutoPublish] Error programando en redes sociales:", redesErr.message);
  }
  ```
- **No bloquea** el flujo principal (try/catch aislado)

### 3. Modificado: `prisma/schema.prisma` (repo principal + worker)
**Nuevos modelos:**
```prisma
model PublicacionRedSocial {
  id           Int      @id @default(autoincrement())
  eventoId     Int      @unique @map("evento_id")
  evento       Evento   @relation(fields: [eventoId], references: [id], onDelete: Cascade)
  plataformas  String   @db.VarChar(200)  // JSON: ["FACEBOOK", "INSTAGRAM"]
  tipo         String   @db.VarChar(50)   // FEED_POST, CAROUSEL, REEL
  programadoAt DateTime @map("programado_at")
  publicadoAt  DateTime? @map("publicado_at")
  estado       EstadoPublicacionRed @default(PENDIENTE)
  respuestaApi Json?
  error        String?  @db.Text
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([programadoAt])
  @@index([estado])
  @@map("publicaciones_redes_sociales")
}

enum EstadoPublicacionRed {
  PENDIENTE
  PROGRAMADO
  PUBLICADO
  FALLIDO
  CANCELADO
}
```

### 4. Modificado: `vps/whatsapp-worker/.env`
```env
# Redes Sociales Scheduler (Vercel)
REDES_SOCIALES_WEBHOOK_URL="https://redes-sociales-l5q4.vercel.app/api/external/agenda-cultural/schedule"
REDES_SOCIALES_API_KEY="agenda_sec_7f9b2c3e1a4d85206"
MAX_DAILY_SOCIAL_POSTS=5
```

---

## 🔄 Flujo Completo (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHATSAPP WORKER (puerto 8083)                │
├─────────────────────────────────────────────────────────────────┤
│  Cron cada 15 min (SCRAPE_INTERVALO_MIN=15)                     │
│       │                                                         │
│       ▼                                                         │
│  escanearTodo() → extraerEvento() → crear PostSocial            │
│       │                                                         │
│       ▼                                                         │
│  autoPublicarSiCompleto(post, datos, prisma)                    │
│       │                                                         │
│       ├── Validaciones obligatorias:                            │
│       │   ✅ Título conciso no genérico                         │
│       │   ✅ Fecha válida (futura)                              │
│       │   ✅ Lugar válido                                       │
│       │   ✅ Imagen en CDN (Bunny)                              │
│       │   ✅ Confianza IA ≥ 0.50                                │
│       │                                                         │
│       ▼                                                         │
│  Crea Evento en BD (estado: APROBADO)                           │
│       │                                                         │
│       ├── Actualiza PostSocial → estado: APROBADO               │
│       │   moderadoPor: "SISTEMA_AUTO_PUBLISH"                   │
│       │                                                         │
│       ├── Notifica a César por WhatsApp (593963410409)          │
│       │                                                         │
│       └── 🆕 NUEVO: programarPublicacionEnRedes(eventoId)       │
│               │                                                 │
│               ▼                                                 │
│        Verifica límite diario (≤5/día)                          │
│               │                                                 │
│               ▼                                                 │
│        ¿Ya programado? (eventoId único en BD) → Sí: skip        │
│               │                                                 │
│               ▼                                                 │
│        Construye payload (caption, media, scheduledAt, tipo)    │
│               │                                                 │
│               ▼                                                 │
│        POST → https://redes-sociales-l5q4.vercel.app/...        │
│               │                                                 │
│               ├── 2xx → Guarda registro estado: PROGRAMADO      │
│               └── Error → Guarda registro estado: FALLIDO       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERCEL SCHEDULER (redes-sociales-l5q4)             │
├─────────────────────────────────────────────────────────────────┤
│  Recibe webhook, valida x-api-key, agenda en Meta Business API  │
│  Publica en la hora programada (scheduledAt)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuración y Parámetros

| Variable | Valor Default | Descripción |
|----------|---------------|-------------|
| `SCRAPE_INTERVALO_MIN` | 15 | Frecuencia escaneo WhatsApp |
| `MAX_DAILY_SOCIAL_POSTS` | 5 | Límite publicaciones/día en redes |
| `REDES_SOCIALES_WEBHOOK_URL` | Vercel prod | Endpoint del scheduler |
| `REDES_SOCIALES_API_KEY` | `agenda_sec_...` | Auth compartida |
| Umbral confianza (worker) | 0.50 | Para auto-publish web |
| Umbral confianza (redes) | 0.65 | Para programar en redes (más estricto) |

> **Nota:** El worker usa 0.50 (más permisivo), la función de redes valida 0.65 salvo `forzar: true`. Si un evento pasa el filtro del worker pero no el de redes, se loggea y no se programa (pero el evento SÍ está en la web).

---

## 🛡️ Seguridad y Anti-Duplicados

1. **EventoId único** en `PublicacionRedSocial` → imposible duplicar
2. **Límite diario** (5) → evita spam si hay ráfaga de eventos
3. **Validación estado APROBADO** → solo eventos publicados en web
4. **Validación media** → requiere imagen o video (Instagram lo exige)
5. **API Key** en header `x-api-key` + body `secret` (doble verificación)
6. **Timeout 12s** → no cuelga el worker si Vercel tarda
7. **Logging exhaustivo** → trazabilidad total en consola y BD

---

## 📊 Monitoreo y Verificación

### Logs clave a buscar:
```
[AutoPublish] 🚀 EVENTO #123 PUBLICADO DIRECTAMENTE: "Nombre Evento"
[AutoPublish] 📱 Publicación en redes sociales programada para evento #123
[RedesSociales] 📤 Enviando al scheduler: evento #123, tipo: FEED_POST, programado para: 2026-09-28T15:00:00.000Z
[RedesSociales] ✅ Publicación programada con éxito para evento #123
```

### Consultas SQL útiles:
```sql
-- Ver últimas publicaciones programadas
SELECT * FROM publicaciones_redes_sociales ORDER BY created_at DESC LIMIT 20;

-- Stats del día
SELECT estado, COUNT(*) FROM publicaciones_redes_sociales 
WHERE DATE(created_at) = CURDATE() GROUP BY estado;

-- Eventos auto-publicados hoy sin publicación en redes
SELECT e.id, e.nombre, e.fecha, e.createdAt
FROM eventos e
LEFT JOIN publicaciones_redes_sociales prs ON prs.eventoId = e.id
WHERE e.estado = 'APROBADO' 
  AND e.moderadoPor = 'SISTEMA_AUTO_PUBLISH'
  AND DATE(e.createdAt) = CURDATE()
  AND prs.id IS NULL;
```

### Health checks:
```bash
# Worker vivo
curl http://178.238.238.158:8083/health

# Vercel scheduler vivo (debe dar 405 GET, 401 sin auth, 400 bad payload)
curl https://redes-sociales-l5q4.vercel.app/api/external/agenda-cultural/schedule
```

---

## 🚀 Despliegue en VPS (Pendiente)

### Prerrequisitos
- SSH al VPS (178.238.238.158)
- Docker Compose instalado
- Prisma CLI en contenedor worker

### Pasos exactos:

```bash
# 1. DESDE TU MÁQUINA LOCAL (PowerShell):
scp vps/whatsapp-worker/lib/redes-sociales-worker.js root@178.238.238.158:/opt/whatsapp-worker/lib/
scp vps/whatsapp-worker/lib/url-extractor.js root@178.238.238.158:/opt/whatsapp-worker/lib/
scp vps/whatsapp-worker/.env root@178.238.238.158:/opt/whatsapp-worker/.env
scp prisma/schema.prisma root@178.238.238.158:/opt/whatsapp-worker/prisma/

# 2. EN EL VPS:
cd /opt/whatsapp-worker

# Backup
cp -r lib lib.backup.$(date +%s)
cp .env .env.backup.$(date +%s)
cp prisma/schema.prisma prisma/schema.prisma.backup.$(date +%s)

# Regenerar Prisma Client y migrar
docker compose exec worker npx prisma generate
docker compose exec worker npx prisma migrate deploy

# Reiniciar worker
docker compose restart worker

# 3. Verificar (esperar 5-10 seg)
sleep 10
curl -s http://localhost:8083/health | jq .
docker compose logs -f worker --tail 100
```

### Verificación post-despliegue:
1. `health` responde `{"status":"ok"}`
2. Logs muestran `[AutoPublish] 📱 Publicación en redes sociales programada...`
3. Tabla `publicaciones_redes_sociales` tiene registros nuevos
4. Vercel scheduler recibe requests (revisar logs en Vercel Dashboard)

---

## 🧪 Testing Manual (Post-despliegue)

```bash
# 1. Test directo función redes (forzar=true ignora límite diario)
docker compose exec worker node -e "
const { programarPublicacionEnRedes } = require('./lib/redes-sociales-worker');
programarPublicacionEnRedes(999, { forzar: true }).then(console.log);
"

# 2. Ver stats del día
docker compose exec worker node -e "
const { obtenerEstadisticasHoy } = require('./lib/redes-sociales-worker');
obtenerEstadisticasHoy().then(console.log);
"

# 3. Ver límite diario
docker compose exec worker node -e "
const { verificarLimiteDiario } = require('./lib/redes-sociales-worker');
verificarLimiteDiario().then(console.log);
"
```

---

## ⚠️ Consideraciones y Limitaciones Conocidas

| Tema | Detalle |
|------|---------|
| **Hermes webhook** | No se conecta (puerto 3000 no responde). Worker tiene vars `HERMES_WEBHOOK_URL` pero no las usa. Pendiente investigar puertos internos 8090/8091. |
| **Umbral confianza** | Worker: 0.50 | Redes: 0.65. Eventos entre 0.50-0.65 se publican en web pero NO en redes (salvo `forzar`). |
| **Límite 5/día** | Hardcoded en código + env. Si se necesitan más, cambiar `MAX_DAILY_SOCIAL_POSTS` y redeploy. |
| **Duplicados históricos** | 4 posts duplicados en cola (ids 10,12,14,15) — pendiente limpieza manual (DELETE). |
| **Adjuntos WhatsApp** | Aún no se descargan (poller deja en `mensajesEnEspera`). Cuando se implemente, aumentará auto-publish. |
| **Timezone** | Todo en UTC en BD, conversión a Loja (UTC-5) solo para display/scheduling. |

---

## 📝 Próximos Pasos Sugeridos

1. **Desplegar en VPS** (ver sección arriba)
2. **Monitorear 24-48h** — verificar que salen ~5 publicaciones/día
3. **Ajustar umbrales** si hay falsos positivos/negativos
4. **Implementar descarga de adjuntos** (punto 5 del diagnóstico) → más posts completos → más auto-publish
5. **Revisar Hermes** — si se reactiva, agregar `despacharEventosAHermes()` en mismo punto
6. **Dashboard simple** — endpoint `/stats/redes-sociales` en worker para ver métricas en admin

---

## 📎 Referencias

- `vps/whatsapp-worker/DIAGNOSTICO-Y-PARCHES.md` — Contexto completo del worker
- `lib/redesSociales.ts` — Implementación Next.js (referencia)
- `scripts/test-redes-sociales.js` — Script de prueba existente
- Vercel Scheduler: `https://redes-sociales-l5q4.vercel.app/api/external/agenda-cultural/schedule`