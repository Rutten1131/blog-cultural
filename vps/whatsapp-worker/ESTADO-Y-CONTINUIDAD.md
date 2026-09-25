# Estado y continuidad — Bot de WhatsApp para Agenda Cultural Loja

> Documento de traspaso. Explica **qué se buscaba**, **qué se hizo**, **dónde
> está** y **qué falta**, para poder seguir el trabajo en otro lado.
>
> Verificado contra el sistema en vivo el 2026-09-25.

---

## 1. Qué se buscaba (el objetivo real)

**Que la agenda cultural de Loja se llene sola con lo que la comunidad publica
en WhatsApp**, sin que nadie copie y pegue a mano.

El pedido original fue muy concreto y con dos reglas que **no se pueden
romper**:

> *"la única mierda que quiero es un bot que scrapee un grupo de whatsapp que
> no interactúe... el grupo se llama agenda cultural"*

> *"una vez scrapee saque todos los posibles posts de acuerdo a este proyecto y
> los mande como posts acá, yo determinaré si su trabajo es bueno o malo"*

Traducido a reglas de diseño:

| Regla | Por qué |
|---|---|
| **El bot NO interactúa** | Ni escribe, ni reacciona, ni marca como leído. Es un lector invisible |
| **El bot NO publica solo** | Todo pasa por `/admin`; una persona decide |
| **El bot NO inventa datos** | Si un campo no se encuentra, queda `null` y se avisa |
| **Un solo flujo de moderación** | No una cola aparte para el bot |

---

## 2. Cómo quedó la arquitectura

```
Grupos de WhatsApp (3)
        │
        │  Evolution API v2 — SOLO LECTURA
        │  (polling cada 15 min, NO webhook)
        ▼
Worker Node/Express en VPS (Docker, puerto 8083)
        │
        ├─── Mensaje CON enlace ──→ Puppeteer abre la página
        │                            ├── JSON-LD schema.org/Event
        │                            ├── Carrusel (carousel_media del JSON)
        │                            ├── og: / Twitter
        │                            └── Detección de muro de login
        │
        ├─── Mensaje CON imagen ──→ Evolution getBase64FromMediaMessage
        │                            └── Gemini lee el afiche
        │
        ├─── Mensaje SIN enlace ──→ Extracción por regex del propio texto
        │
        ▼
Gemini (visión) lee los afiches → título, fecha, lugar, precio
        │
        ▼
Imágenes re-alojadas en Bunny CDN (las URLs de FB/IG caducan)
        │
        ▼
Tabla posts_social (PENDIENTE)
        │
        ▼
/admin → pestaña "Moderar Pendientes"  🤖 BOT
        │
   Aprobar ─→ tabla eventos (PENDIENTE, misma cola) → publicar
   Rechazar ─→ marcado RECHAZADO, no crea nada
```

**Base de datos compartida:** el worker y el sitio Next.js usan **la misma
MariaDB** (StackCP). El worker escribe en `posts_social`; el sitio lee esa tabla
en `/admin` y crea `eventos` al aprobar.

---

## 3. Cronología de la conversación

### Fase 1 — De "scrapear redes" a "scrapear un grupo"
Empezó como una idea amplia (scrapear redes sociales del municipio). Se acotó a
**un solo grupo de WhatsApp**, en modo **solo lectura**.

### Fase 2 — Montar el worker en el VPS
Docker, Evolution API, Prisma, Puppeteer. Aquí aparecieron los primeros bugs
grandes:
- Prisma 7 exige adaptador explícito (`PrismaMariaDb`) → el contenedor estaba
  en bucle de reinicios.
- **El bot nunca detectaba grupos** (leía `body.data.message` en vez de
  `body.data`).
- **La clave de Evolution era inválida** y el log decía "Webhook configurado"
  porque nunca se comprobaba el estado HTTP.
- **Se abandonó el webhook**: Evolution guarda UN solo webhook por instancia y
  esa instancia ya tenía el de otro servicio. Se pasó a **polling**.

### Fase 3 — Un solo flujo de moderación
Decisión de diseño: los candidatos del bot **no van a una pestaña aparte**,
aparecen dentro de "Moderar Pendientes" marcados con 🤖 BOT. Razón del usuario:
*"en el post puede estar un evento, entonces es un evento"* — no son dos cosas
distintas.

### Fase 4 — Calidad: "no inventarse nada"
Se midió contra datos reales. Línea base: **4 de 11 posts aprobables (36%)**.
Cada campo empezó a guardar **de qué fuente salió** (`fuentes`) y lo que falta
se lista en `camposFaltantes`.

### Fase 5 — Visión artificial (leer los afiches)
El hallazgo clave: en los afiches está TODA la información, pero en forma de
imagen. Se integró **Gemini** con cascada de keys y modelos (los flash dan 503
y 429 seguido).

**Los dos descubrimientos más importantes de esta fase:**

1. **Instagram NO descarga las fotos del carrusel por red.** Solo pide la que
   muestra en ese momento. Las demás existen **únicamente en el JSON embebido**
   (`carousel_media`). Esperarlas capturando respuestas de red no servía.
   → Ahora se leen del JSON y se bajan del CDN: **9/9 fotos, verificado**.

2. **No toda "imagen" es una imagen.** Facebook sirve
   `image/x.fb.keyframes` (un sprite de la interfaz) y Gemini **no acepta AVIF**.
   Ambos provocaban HTTP 400 y tumbaban la lectura del afiche.

### Fase 6 — La imagen basura y los muros de login
El usuario lo notó a simple vista: *"esa imagen saca para todos"*.

**Se verificó con hashes: 11 de 15 posts compartían la MISMA imagen de 40 KB.**
Descargada y vista: era el **dibujo de la política de cookies de Facebook**
(`facebook.com/images/cookies/cookie_info_card_image_3.png`).

Causa: existía un respaldo que decía *"si no hay imagen, usá la más pesada de
las que capturó la red"*. Y la más pesada de la pantalla de cookies era ese
dibujo. **Ese respaldo se eliminó**: mejor nada que una mentira.

Ese mismo día se descubrió que los enlaces `facebook.com/share/...` (reels y
posts compartidos) **redirigen a un muro de login** → irrecuperables.

Y que YouTube sí se puede leer, pero por **oEmbed** (su página normal devuelve
el aviso de cookies).

### Fase 7 — Medir y documentar todo
Se hicieron dos documentos (ver §6) y apareció el **hallazgo más grande**:

> **El bot solo procesaba el 22% de los mensajes** (11 de 50 reales), porque
> `poller.js` descartaba todo lo que no trajera un enlace.

Y un bug sutil: **la fórmula de confianza no daba puntos a la fuente del
afiche** (la más confiable), así que el mejor post aparecía **último** en
`/admin`.

### Fase 8 — Aplicar los parches
Ya en el código (verificado):

| Parche | Qué hace |
|---|---|
| **P2 — confianza** | Da puntos a `fuente: "afiche"`. El post completo pasó de 0.25 a **0.55** |
| **P15** | Ya no descarta un post si el pie de foto tiene algo útil (>10 caracteres sin las URLs) |
| **`extractFromTextOnly`** | Crea posts a partir de **texto sin enlace** (usa los extractores de regex que ya existían) |
| **`extractFromImage`** | **Afiches pegados sin texto**: baja la imagen con `getBase64FromMediaMessage` y la lee Gemini |
| **P5 — dedupe** | Compara la **URL normalizada** (sin query, sin hash, sin barra final). Antes el mismo post con `?mibextid=wwX` vs `?mibextid=wwXI` creaba dos filas |

---

## 4. Estado actual, verificado en vivo (2026-09-25)

```
GET /health          → {"status":"ok"}
GRUPOS_SCRAPING      → 3 grupos activos
Modo                 → SOLO LECTURA (no envía mensajes ni toca webhooks)
Escaneo              → cada 15 min, terminando en ~35 s
```

**La cola creció de 15 a 33 posts** desde ayer, o sea que **está trabajando
sola**.

| Métrica | Valor |
|---|---|
| Posts en la cola | **33** |
| Título | **33/33 = 100%** |
| Lugar | 28/33 = 85% |
| Fecha | 27/33 = 82% |
| Descripción | 30/33 = 91% |
| Imagen | 21/33 = 64% |
| **Completos (título+fecha+lugar)** | **25/33 = 76%** |
| Lugares con basura | **0** |
| Imágenes repetidas | **0** |

> **Comparación con la línea base:** de **4/12 (33%)** aprobables al principio a
> **25/33 (76%)** ahora.

### De dónde vienen los 33 posts

| Vía | Cuántos | Ejemplo real |
|---|---|---|
| **Afiche adjunto leído por IA** | 16 | *"QUIPU LOJA 2026"* → *Plaza San Sebastián* |
| Enlace de Facebook | 11 | *"SINFO ROCK"* → *TEATRO BOLÍVAR* |
| Instagram | 3 | *"JUEVES CULTURAL"* → *TEATRO NACIONAL* |
| YouTube (oEmbed) | 3 | *"Tráiler Oficial"* (miniatura 1280 px) |

**Los 16 posts de afiche adjunto son la prueba de que la tubería de media
funciona**: no tienen URL ni texto, salieron solo de la imagen. Y son los de
**mayor confianza (0.55)**.

Ejemplos reales que el bot capturó solo:

| Título | Fecha | Lugar |
|---|---|---|
| Expoferia Coleccionismo y Antigüedades | 2026-09-26 | Paseo Cultural Calle Rocafuerte |
| Son Especial le canta a la Churonita | 2026-09-25 | Iglesia Catedral |
| CONVERSANDO CON GODIÉ | 2026-09-25 | Auditorio Pablo Palacio |
| III Convención Internacional de Circo | — | Loja - Ecuador |

---

## 5. Qué queda pendiente

### 🔴 Lo más importante

**1. La cola no se está usando.** Hay 33 pendientes y (al último dato
conocido) **0 aprobados**. Si nadie modera, conviene averiguar por qué antes de
agregar más funciones.

**2. El schema del worker está desincronizado.** Hay **tres**
`prisma/schema.prisma` divergiendo (repo del worker, VPS, y app raíz). El del
repo **no tiene `PostSocial`**; el del contenedor **no tiene `multimedia`**.
Consecuencia: **cualquier `docker compose build` puede romper el worker.** Los
cambios en `lib/`, `worker.js` y `scripts/` son volúmenes montados y se aplican
con `scp` + `restart`, sin rebuild — pero todo lo que toque el schema queda
bloqueado hasta arreglar esto.

**3. Los adjuntos no-imagen siguen sin leerse:** PDFs de programación (un PDF =
varios eventos) y audios (Groq tiene `whisper`).

### 🟠 Importantes

| # | Pendiente |
|---|---|
| 4 | **Se pueden perder mensajes**: solo se miran los últimos 50 cada 15 min. Si el grupo recibe más, los viejos se pierden para siempre |
| 5 | **Títulos que son párrafos** cortados a 255 caracteres a mitad de palabra |
| 6 | **El panel no está desplegado** a Vercel: la tira de miniaturas del carrusel y el traslado de `multimedia` al evento están solo en local |
| 7 | **No hay reintentos** si falla la extracción de una URL: el mensaje se marca procesado y no se vuelve a intentar |
| 8 | **Filtro "esto no es un evento"**: entran YouTubes que no son de Loja |
| 9 | Los 4 duplicados viejos **siguen guardados** (el dedupe evita los nuevos, no limpia el pasado) |

### 🟡 Menores

- Se guardan imágenes **AVIF** (soporte irregular en navegadores viejos)
- **Sin carpeta de migraciones**: el esquema se aplica a mano
- **`.env` con credenciales reales** en el repo (debería rotarse)
- Sin índice sobre `urlOriginal` (irrelevante con 33 filas, importa con miles)

---

## 6. Dónde está cada cosa

### Documentación

| Archivo | Qué contiene |
|---|---|
| `vps/whatsapp-worker/COMO-FUNCIONA-EL-BOT.md` | **El pipeline completo**, paso a paso, con ejemplos de mensajes reales y el inventario de los 32 problemas resueltos + 15 pendientes |
| `vps/whatsapp-worker/DIAGNOSTICO-Y-PARCHES.md` | Bitácora técnica de cada parche: qué se midió antes, qué se cambió, qué se probó |
| `vps/whatsapp-worker/README.md` | — |

### Código del worker

```
vps/whatsapp-worker/
├── worker.js                      ← Express, cron, endpoints
├── lib/
│   ├── poller.js                  ← Escaneo, dedupe, orquestación
│   ├── url-extractor.js           ← El corazón (~1550 líneas)
│   ├── evolution-client.js        ← Cliente Evolution (SOLO LECTURA)
│   ├── vision.js                  ← Gemini multimodal
│   ├── imagenes.js                ← Re-alojar en Bunny CDN
│   ├── fechas-es.js               ← Fechas en español + zona Loja
│   └── clasificarEvento.js
├── scripts/                       ← Diagnóstico y operación
│   ├── ver-mensajes-reales.js     ← Cómo ve el bot los mensajes
│   ├── lista-compacta.js          ← Estado de la cola
│   ├── reactivar-escaneo.sh       ← Encender/apagar (--limpio borra todo)
│   ├── desactivar-escaneo.sh
│   └── comparar-extraccion.js     ← Medir antes/después de un cambio
└── prisma/schema.prisma           ← ⚠️ DESINCRONIZADO (ver §5.2)
```

### Lado del sitio Next.js

| Archivo | Qué hace |
|---|---|
| `lib/actions/moderarPostBot.ts` | Aprobar (crea `Evento` PENDIENTE) / rechazar |
| `app/admin/admin-bot-posts.tsx` | La lista de candidatos del bot |
| `app/admin/page.tsx` | Lee `posts_social` (take 200) |

---

## 7. Cómo seguir trabajando

### Datos de acceso

```
VPS         178.238.238.158
Clave SSH   $env:USERPROFILE\.ssh\vps_agenda_key
Worker      root@...:/root/whatsapp-worker
Contenedor  whatsapp-worker-whatsapp-worker-1
Puerto      8083
Instancia   cesar-comercial (Evolution, puerto 8080)
```

### Comandos frecuentes

```bash
# Desplegar un cambio de código (SIN rebuild)
scp -i "$env:USERPROFILE\.ssh\vps_agenda_key" <archivo> root@178.238.238.158:/root/whatsapp-worker/lib/
ssh -i "$env:USERPROFILE\.ssh\vps_agenda_key" root@178.238.238.158 \
  "cd /root/whatsapp-worker && docker compose restart"

# Ver la cola
docker exec whatsapp-worker-whatsapp-worker-1 node scripts/lista-compacta.js

# Ver cómo el bot lee los mensajes reales
docker exec whatsapp-worker-whatsapp-worker-1 node scripts/ver-mensajes-reales.js 50

# Apagar / encender el escaneo
sh /root/whatsapp-worker/scripts/desactivar-escaneo.sh
sh /root/whatsapp-worker/scripts/reactivar-escaneo.sh --limpio
```

### Reglas de oro para no romper nada

1. **Nunca escribir en WhatsApp.** Nada de mensajes, reacciones ni marcar leído.
2. **No tocar la instancia `agenda-cultural`** (tiene su propio bot Python en :8092).
3. **No sobrescribir el webhook** de `cesar-comercial` (`:8095/webhook/cliente`).
4. **Nunca silenciar `stderr`** en los comandos: ya ocultó un `.env` roto.
5. **Usar scripts `.sh`** subidos por `scp`, no `ssh` con comillas anidadas.
6. **Nunca `docker compose build`** sin arreglar antes el schema (§5.2).
7. **`docker restart` no recarga el `.env`** → hace falta `docker compose up -d`.
8. **`docker restart` borra `/tmp`** → guardar logs en el host.
9. Al medir un cambio, **usar `comparar-extraccion.js` antes y después**.
10. **No inventar datos.** Si falta, `null` y a `camposFaltantes`.
