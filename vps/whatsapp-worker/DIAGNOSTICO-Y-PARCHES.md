# Diagnóstico del bot de WhatsApp — verificado contra el código real

> Documento de trabajo para pasar a otro asistente.
> Verificado línea por línea en el repo el 2026-09-24.
> Repo: `d:\Abel paginas\agenda cultural\software`
> Worker: `vps/whatsapp-worker/`

---

## 1. Resumen ejecutivo

- De **50 mensajes reales**, el bot solo procesa **11 (22%)**.
- La causa no está en el scraping de enlaces: hay **DOS filtros de entrada** que descartan el resto antes de llegar ahí.
- El arreglo con mejor relación beneficio/esfuerzo es **una línea** en `url-extractor.js` (sección 5), no ningún truco con Facebook.
- Abrir los filtros **por sí solo no recupera ningún evento**: hay que abrir la vía de procesamiento, si no los mensajes entran y no producen nada.

---

## 2. Las dos puertas

### Puerta 1 — `worker.js` (mensajes en tiempo real vía webhook)

**Archivo:** `vps/whatsapp-worker/worker.js` (líneas ~56-120)

```js
// ─── Webhook de Evolution API ──────────────────────────────
app.post("/webhook/whatsapp", async (req, res) => {
  try {
    const body = req.body || {};

    // Estructura de Evolution API v2:
    //   { data: { key: { remoteJid, fromMe, id }, message: { conversation } } }
    // Algunas versiones envuelven en `data.messages[]` o mandan un array.
    let entrada = body.data ?? body;
    if (Array.isArray(entrada)) entrada = entrada[0];
    if (entrada && Array.isArray(entrada.messages)) entrada = entrada.messages[0];
    if (!entrada || typeof entrada !== "object") {
      return res.json({ received: false, reason: "payload vacío" });
    }

    const remoteJid = entrada.key?.remoteJid || entrada.from || "";

    // Saltar los mensajes que envía la propia instancia.
    if (entrada.key?.fromMe === true) {
      return res.json({ received: false, reason: "mensaje propio" });
    }

    // El contenido puede venir en varias formas según el tipo de mensaje.
    const contenido = entrada.message || {};
    const msgBody =
      contenido.conversation ||
      contenido.extendedTextMessage?.text ||
      contenido.imageMessage?.caption ||
      contenido.videoMessage?.caption ||
      contenido.documentMessage?.caption ||
      contenido.documentWithCaptionMessage?.message?.documentMessage?.caption ||
      "";

    // Solo procesar mensajes de grupo (remoteJid contiene @g.us)
    if (!remoteJid.includes("@g.us")) {
      return res.json({ received: false, reason: "no es grupo" });
    }

    if (!msgBody.trim()) {
      return res.json({ received: false, reason: "mensaje sin texto" });   // ⬅ PUERTA 1
    }

    console.log(
      `[WhatsApp] Mensaje de ${remoteJid}: ${msgBody.substring(0, 120).replace(/\s+/g, " ")}`
    );

    // Responder a Evolution de inmediato: visitar páginas con Puppeteer
    // tarda varios segundos y Evolution reintentaría si no contestamos ya.
    res.json({ received: true, messageId: entrada.key?.id });

    // Procesar en segundo plano.
    extractAndProcessUrls(msgBody, remoteJid, prisma)
      .then((results) => {
        if (results.length > 0) {
          console.log(`[WhatsApp] ${results.length} post(s) guardado(s) como pendientes`);
        }
      })
      .catch((err) => {
        console.error("[WhatsApp] Error procesando URLs:", err);
      });
  } catch (error) {
    console.error("[WhatsApp] Error en webhook:", error);
    res.status(500).json({ error: "internal error" });
  }
});
```

**Nota de contexto:** la variable del mensaje se llama **`contenido`** (no `m`), y el texto se llama **`msgBody`**.

---

### Puerta 2 — `lib/poller.js` (escaneo de grupos por API)

**Archivo:** `vps/whatsapp-worker/lib/poller.js` (líneas ~88-133)

```js
      const mensajeId = msg?.key?.id;
      if (!mensajeId) continue;
      if (!esMensajeRelevante(msg)) continue;

      try {
        if (await yaProcesado(prisma, mensajeId)) continue;
      } catch (err) {
        resumen.errores.push(`dedupe ${mensajeId}: ${err.message}`);
        continue;
      }

      resumen.mensajesNuevos++;

      const texto = extraerTextoDeMensaje(msg);
      const urls = texto ? extractUrls(texto) : [];

      let posts = [];
      if (urls.length > 0) {                                        // ⬅ PUERTA 2
        resumen.mensajesConUrl++;
        if (verbose) {
          console.log(
            `[Scanner] Mensaje de ${msg.pushName || "?"} con ${urls.length} URL(s)`
          );
        }
        try {
          posts = await extractAndProcessUrls(texto, jid, prisma);
        } catch (err) {
          resumen.errores.push(`extracción ${mensajeId}: ${err.message}`);
        }
      }

      try {
        await marcarProcesado(prisma, mensajeId, jid, {             // ⬅ ver sección 5.2
          timestamp: msg.messageTimestamp,
          urls: urls.length,
          posts: posts.length,
        });
      } catch (err) {
        resumen.errores.push(`marcar ${mensajeId}: ${err.message}`);
      }

      resumen.postsCreados += posts.length;
```

**Nota de contexto:** en este archivo el texto del mensaje se llama **`texto`**, y esa variable **sí** se llama así (ojo: en `url-extractor.js` el mismo texto se llama `text`).

---

### Consecuencia: la función de extracción corta sola si no hay URLs

**Archivo:** `vps/whatsapp-worker/lib/url-extractor.js` (líneas ~1174-1176)

```js
async function extractAndProcessUrls(text, grupoId, prisma) {
  const urls = extractUrls(text);
  if (urls.length === 0) return [];        // ⬅ entra y no produce nada
```

Esto explica por qué **abrir las puertas sin más no recupera nada**: un mensaje con adjunto y sin texto entra al pipeline y sale por acá con `[]`.

---

## 3. El descarte silencioso (P15)

**Archivo:** `vps/whatsapp-worker/lib/url-extractor.js` (líneas ~1215-1240)

```js
      // Un post sin NADA no es un candidato: es ruido.
      //
      // Le pasa a los enlaces que dan muro de login (facebook.com/share/...):
      // no hay título, ni fecha, ni lugar, ni imagen. Guardarlos solo llena la
      // cola de moderación con filas vacías. Se cuentan aparte en el resumen.
      const tieneAlgo = Boolean(
        datos.titulo || datos.fecha || datos.lugar || (fotosPermanentes.length > 0)
      );

      if (!tieneAlgo) {
        descartados.push({ url, motivo: datos.advertencias[0] || "sin datos legibles" });
        console.log(`[Extractor] Descartado (sin datos): ${url}`);
        continue;                                                    // ⬅ descarte silencioso
      }

      const post = await prisma.postSocial.create({
        data: {
          origen: "WHATSAPP_GRUPO",
          urlOriginal: datos.urlOriginal,
          textoOriginal: text ? text.slice(0, 5000) : null,          // ⬅ la variable se llama `text`
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          // La primera foto del carrusel es la portada.
          imagenUrl: fotosPermanentes[0] ?? datos.imagenUrl,
          // El carrusel completo, para que al aprobar vaya todo a la página.
          multimedia: fotosPermanentes.length > 1 ? fotosPermanentes : undefined,
          fechaPublicacion: datos.fecha,
          lugar: datos.lugar,
          estado: "PENDIENTE",
          grupoId: grupoId || null,
          confianzaIA: datos.confianza,
        },
      });
```

**Observación clave:** el JSON que se guarda **ya incluye `textoOriginal`** (el texto que escribió la persona), pero la condición `tieneAlgo` **no lo tiene en cuenta**. Por eso un enlace que cae en muro de login, con un mensaje de texto al lado, se descarta aunque hubiera algo útil que moderar.

---

## 4. Lo que YA existe (no hay que rehacerlo)

**Archivo:** `vps/whatsapp-worker/lib/evolution-client.js` (líneas ~95-135)

```js
/**
 * Extrae el texto útil de un mensaje de WhatsApp.
 * Devuelve "" si es una reacción, un sticker o algo sin texto.
 */
function extraerTextoDeMensaje(msg) {
  const m = msg?.message;
  if (!m) return "";

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    ""
  );
}

/** URL de imagen adjunta al mensaje, si la hay (puede servir de portada). */
function extraerImagenDeMensaje(msg) {
  const m = msg?.message;
  if (!m) return null;

  const directa =
    m.imageMessage?.url ||
    m.videoMessage?.url ||
    m.documentWithCaptionMessage?.message?.documentMessage?.url ||
    null;

  return directa || null;
}

/** ¿Merece la pena procesar este mensaje? (descarta reacciones y ruido) */
function esMensajeRelevante(msg) {
  const tipo = msg?.messageType || "";
  if (tipo === "reactionMessage") return false;
  if (tipo === "protocolMessage") return false;
  if (tipo === "senderKeyDistributionMessage") return false;
  return true;
}

module.exports = {
  EVOLUTION_INSTANCE,
  evolutionFetch,
  estadoInstancia,
  listarGrupos,
  buscarMensajes,
  extraerTextoDeMensaje,
  extraerImagenDeMensaje,      // ⬅ exportada pero NUNCA usada en el proyecto
  esMensajeRelevante,
};
```

**Dato importante:** `extraerImagenDeMensaje()` existe y está exportada, pero **no se usa en ningún lugar**. Y devuelve `m.imageMessage.url`, que en Evolution API es una **URL cifrada**: para obtener el archivo hay que llamar al endpoint de media (`getBase64FromMediaMessage`) con la `key` del mensaje.

### La visión ya acepta base64 (no hay que adaptarla)

**Archivo:** `vps/whatsapp-worker/lib/vision.js` (líneas ~158-170)

```js
/**
 * Lee un afiche (una o varias imágenes del mismo post).
 *
 * @param {Array<{base64: string, tipo: string}>} imagenes
 * @returns {Promise<Object|null>} Datos leídos, o null si no se pudo
 */
async function leerAfiche(imagenes) {
  if (!configurado()) {
    console.warn("[Visión] Sin GEMINI_API_KEYS configuradas: no se leen los afiches");
    return null;
  }

  if (!Array.isArray(imagenes) || imagenes.length === 0) return null;
```

Esquema que devuelve Gemini (resumen): `esEventoCultural`, `nombre`, `fechaTexto` (texto literal, sin inventar), `fechaFinTexto`, `horaTexto`, `lugar`, `precio`, `categoria`, `descripcion`.
**No existe** un campo `enLoja` ni un array `eventos` (hoy es un solo evento por lectura).

### Otras piezas que ya funcionan en `url-extractor.js` (~1250 líneas)

- Puppeteer con extracción de `og:` y JSON-LD, detección de **muro de login** (`/login`, `/checkpoint`, `accounts.facebook.com`).
- Carrusel de Instagram/Facebook (JSON embebido) y descarga de fotos en vivo.
- oEmbed de YouTube (título + miniatura).
- Rehospedaje de imágenes en Bunny CDN.
- Puntuación de `confianza` y lista de `camposFaltantes`.
- Ayudantes de texto ya probados: `extraerFechaDeTexto()`, `extraerHoraDeTexto()`, `extraerLugarDeTexto()`, `limpiarTitulo()`, `esTituloGenerico()`.

### El truco del crawler ya está en el repo (en la web, no en el worker)

**Archivo:** `app/api/media/resolve/route.ts` (línea 43)

```js
"facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
```

Es decir: la petición simple con user-agent de crawler **ya está probada** en el proyecto, pero vive en la app Next.js (contexto web con `fetch`), no en el worker (que hoy solo sabe navegar con Puppeteer).

---

## 5. Correcciones al diagnóstico previo (3 trampas)

### 5.1 Los nombres de variables — los parches tal como estaban escritos fallan

| Parche propuesto | Problema | Correcto |
|---|---|---|
| `Boolean(m.imageMessage \|\| ...)` en `worker.js` | `ReferenceError: m is not defined` — ahí la variable es `contenido` | `Boolean(contenido.imageMessage \|\| contenido.documentMessage \|\| contenido.audioMessage \|\| contenido.videoMessage)` |
| `(texto && texto.trim().length > 10)` en `url-extractor.js` | `ReferenceError: texto is not defined` — ahí la variable es `text` | `(text && text.trim().length > 10)` |

### 5.2 Abrir las puertas "quema" los mensajes

`poller.js` marca **todos** los mensajes que revisa:

```js
await marcarProcesado(prisma, mensajeId, jid, {
  timestamp: msg.messageTimestamp,
  urls: urls.length,
  posts: posts.length,
});
```

Si se abre la puerta a "hay evidencia" **antes** de tener la tubería de adjuntos, cada afiche pegado queda registrado en `wa_mensajes_procesados` con **0 URLs y 0 posts**, y `yaProcesado()` lo salta **para siempre**. Cuando más adelante se implemente la descarga de media, esos mensajes ya no se reprocesan: el punto 5 rendiría cero sobre el histórico.

**Opciones:**
1. No marcar como procesados los mensajes cuyo tipo todavía no se maneja (se reintentan en la próxima pasada).
2. Guardar un `motivo` en `wa_mensajes_procesados` y que `yaProcesado()` solo salte los definitivos.
3. El día que se active la descarga de media, limpiar antes:
   ```sql
   DELETE FROM wa_mensajes_procesados WHERE postsCreados = 0 AND urlsEncontradas = 0;
   ```

### 5.3 Abrir las puertas, por sí solo, recupera 0 eventos

| Cambio | Recupera (de 50) | Archivo |
|---|---|---|
| P15 (una línea) | los enlaces que hoy se descartan por muro de login | `lib/url-extractor.js` |
| Texto sin enlace → post (función nueva, corta) | 2 | `lib/poller.js` + `lib/url-extractor.js` |
| Adjuntos (imagen / PDF / audio / video) | 12 (24%) — requiere la tubería de media | nuevo + `lib/poller.js` |
| **Solo abrir las puertas** | **0** | `worker.js` + `lib/poller.js` |

Abrir las puertas es prerequisito de lo demás, pero conviene explicitarlo para no esperar volumen inmediato.

---

## 6. Prioridad ajustada (con esfuerzo real y archivo)

| # | Cambio | Archivo | Esfuerzo | Recupera |
|---|---|---|---|---|
| 1 | **P15:** agregar `\|\| (text && text.trim().length > 10)` a `tieneAlgo` | `lib/url-extractor.js` (~1219) | mínimo (1 línea) | los enlaces que hoy se descartan |
| 2 | Abrir puerta 2 ("¿hay texto o adjunto?") + puerta 1 (webhook) | `lib/poller.js`, `worker.js` | bajo | 0 por sí solo — habilita 3 y 5 |
| 3 | Texto sin enlace → crear post usando los ayudantes de fecha/hora/lugar | `lib/url-extractor.js` (función nueva exportada) | bajo | 2 |
| 4 | Confianza (P2) y dedupe por contenido (P5) | `lib/url-extractor.js` | bajo/medio | calidad, no volumen |
| 5 | Descarga de `imageMessage` cifrado → `leerAfiche()` (ya acepta base64) | nuevo cliente de media + `lib/poller.js` | medio | 12 (24%) |
| 6 | Portar `facebookexternalhit` del contexto web al worker | `lib/url-extractor.js` | bajo/medio | mejora los enlaces de FB |
| 7 | PDFs, audios (Whisper), descripción de YouTube (Data API v3) | — | medio/alto | 4 |

**Notas:**
- El punto 5 está **subestimado** cuando se dice "la visión ya existe": la visión existe y acepta base64, pero **falta todo el cliente de media** de Evolution (con reintentos y manejo de errores).
- El punto 3 no es solo "invocar lo que existe": hay que crear una función nueva que arme el evento desde texto puro, porque `extractAndProcessUrls` exige al menos una URL.
- `enLoja` y `eventos: []`: posponer. El grupo ya es monotemático, y el array solo hace falta cuando se procesen PDFs de programación.

---

## 7. Preguntas abiertas para el otro asistente

1. **¿El payload real de un link de Facebook trae `extendedTextMessage.title` / `description`?**
   Se puede responder en un minuto con el script que ya existe:
   `vps/whatsapp-worker/scripts/ver-mensajes-reales.js` (imprime `messageType`, de qué campo sale el texto y los campos disponibles).
2. Con la respuesta a (1): ¿conviene usar el preview de WhatsApp como fuente principal para los `share/...`, o directamente ir a P15?
3. El `jpegThumbnail` de WhatsApp es una miniatura de ~2-8 KB: sirve como señal de "esto parece un afiche", **no** como fuente de fecha/lugar (no reemplaza a `leerAfiche`).
4. ¿Alguna otra puerta de descarte temprano que no esté en este documento? (revisar `esMensajeRelevante()` y el filtro de grupos en `GRUPOS_SCRAPING`).

---

## 8. Archivos y ubicaciones

```
vps/whatsapp-worker/
├── worker.js                     ← webhook (puerta 1) + endpoints de escaneo
├── lib/
│   ├── poller.js                 ← escaneo de grupos (puerta 2, marcarProcesado)
│   ├── url-extractor.js          ← extracción (~1250 líneas) + descarte P15
│   ├── evolution-client.js       ← texto/imagen del mensaje + listado de grupos
│   ├── vision.js                 ← leerAfiche() con Gemini (recibe base64)
│   ├── imagenes.js               ← descarga/comprime imágenes
│   ├── fechas-es.js              ← normalización de fechas (probado)
│   └── classifier.js
├── scripts/                      ← ver-mensajes-reales.js, diagnostico-imagenes.sh, etc.
├── prisma/schema.prisma          ← PostSocial, wa_mensajes_procesados
└── COMO-FUNCIONA-EL-BOT.md       ← diagnóstico original (P1..P15)
```

Otro archivo relacionado (app Next.js, no el worker):

```
app/api/media/resolve/route.ts    ← usa facebookexternalhit/1.1 (línea 43)
```

---

# 9. Respuestas del revisor a las preguntas del programador (2026-09-24)

> Respuestas verificadas leyendo el código, no asumidas.

## 9.1 Firma real de los ayudantes: **NO son `(texto) => string|null`**

Y **dos de los tres no están en `url-extractor.js`**: viven en `lib/fechas-es.js`.

| Función | Archivo | Firma real |
|---|---|---|
| `extraerFechaDeTexto(texto)` | `lib/fechas-es.js:167` | `{ fecha: Date, anioInferido: boolean, tieneHora: boolean, coincidencia: string } \| null` |
| `extraerHoraDeTexto(texto)` | `lib/fechas-es.js:123` | `{ hh: number, mm: number } \| null` |
| `extraerLugarDeTexto(texto)` | `lib/url-extractor.js:150` | `string \| null` ✅ (esta sí coincidía) |
| `extraerRangoDeTexto(texto)` | `lib/fechas-es.js` | `{ fecha: Date, fechaFin: Date\|null, anioInferido, tieneHora, coincidenciaInicio, coincidenciaFin } \| null` |
| `limpiarTitulo(t)` / `esTituloGenerico(t)` | `lib/url-extractor.js:63 / 80` | `string` / `boolean` — **ya exportadas** (para tests) |

**Dato clave:** `extraerFechaDeTexto()` **ya aplica la hora internamente**, así que no hay que combinar a mano con `extraerHoraDeTexto`:

```js
// cola de la función, lib/fechas-es.js:238-246
const hora = extraerHoraDeTexto(texto);
const fecha = construirFecha(y, m, d, hora);   // regla Loja: 17:00 UTC si es "solo día"
if (!fecha) return null;
return { fecha, anioInferido, tieneHora: Boolean(hora), coincidencia };
```

**Consecuencia:** el parche 3 tal como estaba escrito **falla en runtime** — `fechaPublicacion: fecha` le pasaría a Prisma un objeto en vez de un `Date` (`Invalid value for argument fechaPublicacion`).

**Buenas noticias para el parche 3:**
- `url-extractor.js` **ya importa** `extraerRangoDeTexto` en su cabecera:
  ```js
  const { fechaDesdeIso, extraerRangoDeTexto } = require("./fechas-es");
  ```
  → no hace falta ningún `require` nuevo.
- `limpiarTitulo`, `esTituloGenerico` y `extraerLugarDeTexto` **ya están exportadas** en `module.exports` (líneas ~1275-1290), así que se pueden usar directo dentro del mismo módulo.

## 9.2 Versión corregida del parche 3

```js
/**
 * Crea un post candidato a partir de un mensaje de texto SIN enlace.
 * Reutiliza los extractores ya probados; no inventa datos.
 */
async function extractFromTextOnly(text, grupoId, prisma) {
  if (!text || text.trim().length < 10) return null;

  // extraerRangoDeTexto ya cubre "del 4 al 6 de octubre [de 2026]"
  // y devuelve .fecha como Date normalizado en zona Loja.
  const infoFecha = extraerRangoDeTexto(text);
  const lugar = extraerLugarDeTexto(text);

  let titulo = text.split("\n")[0].trim().slice(0, 255);
  titulo = esTituloGenerico(titulo) ? null : limpiarTitulo(titulo);

  if (!titulo && !infoFecha && !lugar) return null;

  return prisma.postSocial.create({
    data: {
      origen: "WHATSAPP_GRUPO",
      urlOriginal: null,
      textoOriginal: text.slice(0, 5000),
      titulo,
      fechaPublicacion: infoFecha?.fecha ?? null,   // ⬅ .fecha (Date), NO el objeto
      lugar,
      estado: "PENDIENTE",
      grupoId: grupoId || null,
      confianzaIA: (titulo ? 0.1 : 0) + (infoFecha ? 0.15 : 0) + (lugar ? 0.1 : 0),
    },
  });
}
```

Y agregar `extractFromTextOnly` a `module.exports` (final del archivo).

En `poller.js`:

```js
let posts = [];
if (urls.length > 0) {
  posts = await extractAndProcessUrls(texto, jid, prisma);
} else if (texto && texto.trim().length > 10) {
  const post = await extractFromTextOnly(texto, jid, prisma);
  posts = post ? [post] : [];
}
```

## 9.3 `urlOriginal` sí acepta `null` — modelo completo

`prisma/schema.prisma:254` (**schema raíz**, ver 9.4):

```prisma
model PostSocial {
  id               Int         @id @default(autoincrement())
  origen           String      @db.VarChar(50)    // ⬅ ÚNICO obligatorio sin default
  urlOriginal      String?     @db.VarChar(500)   // ✅ nullable
  textoOriginal    String?     @db.Text
  titulo           String?     @db.VarChar(255)
  descripcion      String?     @db.Text
  imagenUrl        String?     @db.VarChar(500)
  multimedia       Json?
  fechaPublicacion DateTime?
  lugar            String?     @db.VarChar(255)
  estado           EstadoPost  @default(PENDIENTE)
  grupoId          String?     @db.VarChar(100)
  moderadoPor      String?     @db.VarChar(100)
  moderadoAt       DateTime?
  moderationComentario String? @db.Text
  confianzaIA      Float?
  fechaDeteccion   DateTime    @default(now())
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  @@index([estado]) @@index([fechaDeteccion]) @@index([origen])
  @@map("posts_social")
}
```

=> El parche 3 puede mandar `urlOriginal: null` sin problema.

## 9.4 ⚠️ `PostSocial` NO está en el schema del worker (riesgo de rebuild)

`vps/whatsapp-worker/prisma/schema.prisma` **termina en `ChatMessage`** (~línea 230). Sus modelos son: `Categoria`, `Zona`, `Evento`, `Recomendacion`, `NumeroNotificacion`, `Institucion`, `BannerHero`, `Aliado`, `AtractivoCantonal`, `ChatSession`, `ChatMessage`. **No tiene `PostSocial` ni `wa_mensajes_procesados`.**

Pero el Dockerfile genera el cliente desde ahí:

```dockerfile
COPY . .
RUN npx prisma generate        # ← usa vps/whatsapp-worker/prisma/schema.prisma
```

Y en `docker-compose.yml` solo se montan como volumen:

```yaml
volumes:
  - ./worker.js:/app/worker.js:ro
  - ./lib:/app/lib:ro
  - ./scripts:/app/scripts:ro
```

→ `prisma/` **queda horneado en la imagen**. Con este schema, el cliente generado **no tendría `prisma.postSocial`** y `prisma.postSocial.create(...)` reventaría. Como el worker funciona en producción, lo más probable es que **la copia del VPS esté más actualizada que la del repo** (el deploy es `scp` archivo por archivo y `prisma/` no se sincroniza sola).

**Verificación (1 comando, en el VPS):**

```bash
docker exec whatsapp-worker-whatsapp-worker-1 grep -c "model PostSocial" /app/prisma/schema.prisma
```

- **1** → el schema del contenedor sí lo tiene: el del repo está desactualizado. Copiarlo del VPS al repo **antes de cualquier `docker compose build`**.
- **0** → el cliente se genera de otro lado; hay que entender cómo antes de tocar nada.

> **Resultado real (2026-09-24): da `1`.** El contenedor sí tiene `PostSocial`; el que está atrasado es el del repo. El mecanismo descrito acá (imagen horneada, `prisma/` sin montar) quedó **confirmado** con `docker inspect`. Pero la verificación destapó algo más urgente y más viejo: **§10.2**.

## 9.5 Parche 1 (P15): matiz de aprobación que hay que conocer

Un post recuperado por P15 queda con `titulo`, `fechaPublicacion` y `lugar` en `null`. Y `lib/actions/moderarPostBot.ts:62-73` **rechaza la aprobación** en ese caso:

```js
const faltantes = [];
if (!post.fechaPublicacion) faltantes.push("fecha");
if (!post.lugar) faltantes.push("lugar");
if (!post.titulo) faltantes.push("título");
if (faltantes.length > 0) {
  return { success: false, error: `Este post no se puede aprobar todavía: falta ${faltantes.join(", ")}. Completalo a mano desde "Publicar evento".` };
}
```

Y `app/admin/admin-bot-posts.tsx` es **de solo lectura**: muestra los campos, marca en rojo los que faltan (`sin título`, `sin fecha`, `sin lugar`), muestra el texto crudo (`post.descripcion || post.textoOriginal`) y las fotos del carrusel. **No tiene formulario de edición.**

→ Con P15 solo, esos posts **se ven pero no se pueden aprobar**: sirven como recordatorio/registro, y el moderador crea el evento a mano con "Publicar evento". Sigue siendo mejor que perderlos (hoy no se ve nada), pero conviene decidir si además se quiere un botón "Crear evento desde este texto" que precargue el formulario.

## 9.6 Parche 2: detalle menor

`resumen.mensajesEnEspera` es un campo nuevo; el objeto `resumen` de `poller.js` (al inicio de `escanearGrupo`) lista los campos explícitamente:

```js
const resumen = { jid, mensajesRevisados: 0, mensajesNuevos: 0, mensajesConUrl: 0, postsCreados: 0, errores: [] };
```

Conviene agregarlo ahí (`mensajesEnEspera: 0`) para que el resumen salga consistente. La lógica del `continue` antes de `marcarProcesado` es correcta: evita quemar el histórico.

## 9.7 Orden sugerido para aplicar

| Paso | Cambio | Riesgo |
|---|---|---|
| 1 | **P15** (`tieneAlgo` + `(text && text.trim().length > 10)`) | Ninguno: solo evita descartes. No toca nada más |
| 2 | **Verificar el schema del contenedor** (comando 9.4) | Sin esto, cualquier rebuild puede romper el worker |
| 3 | **Abrir puerta 2** con el guard de `marcarProcesado` + **puerta 1** en el webhook | Bajo |
| 4 | **Texto sin enlace** → `extractFromTextOnly` (versión de 9.2) | Bajo |
| 5 | Decidir si se agrega el botón "crear evento desde este texto" (9.5) | Producto, no técnica |
| 6 | Descarga de adjuntos → `leerAfiche()` | Medio (cliente de media) |

## 9.8 Lo que sigue sin respuesta

1. ¿El payload real de un link de Facebook trae `extendedTextMessage.title` / `description`?
   Se responde con `scripts/ver-mensajes-reales.js` sobre un mensaje con link de FB (imprime `messageType` y de qué campo sale el texto).
2. ¿Conviene un botón "Crear evento desde este texto" para los posts de P15, o se deja la vía manual?
3. ¿El schema del VPS coincide con el del repo? (comando de 9.4)

---

# 10. Paso 0 ejecutado en el VPS — resultado y un hallazgo más grave

> Todo lo de acá está **verificado en el servidor de producción** (2026-09-24), no deducido del repo.
> Los scripts de diagnóstico usados eran temporales y ya se borraron.

## 10.1 Resultado del paso 0

```bash
$ docker exec whatsapp-worker-whatsapp-worker-1 grep -c "model PostSocial" /app/prisma/schema.prisma
1
```

El contenedor **sí** tiene `PostSocial`. El desactualizado es el del repo (§10.3).

Volúmenes montados, tal cual (`docker inspect ... .Mounts`):

```
/root/whatsapp-worker/worker.js  -> /app/worker.js   rw=false
/root/whatsapp-worker/lib        -> /app/lib         rw=false
/root/whatsapp-worker/scripts    -> /app/scripts     rw=false
```

→ `prisma/` **no** está montado: queda horneado en la imagen. El mecanismo que describía 9.4 era correcto.
Dato a favor: `lib/`, `scripts/` y `worker.js` **sí** son volúmenes, así que los parches en `.js` se aplican con `scp` + `docker compose restart`, **sin rebuild**.

## 10.2 ⚠️ Hallazgo nuevo, más urgente: falta `multimedia` en el schema del worker

El `PostSocial` del worker **no tiene el campo `multimedia`**, pero `lib/url-extractor.js:1238` lo escribe:

```js
imagenUrl: fotosPermanentes[0] ?? datos.imagenUrl,
multimedia: fotosPermanentes.length > 1 ? fotosPermanentes : undefined,
```

**Prueba empírica dentro del contenedor** (crear con `multimedia` y borrar si se creaba):

```
=== PRUEBA EMPÍRICA: ¿se puede escribir multimedia? ===
=> FALLA al escribir multimedia: PrismaClientValidationError
    Invalid `prisma.postSocial.create()` invocation
```

Prisma valida **antes** de tocar la BD, así que la fila no se crea: cuando un mensaje trae un carrusel
con más de una foto, **se pierde el post completo**, no solo las fotos.

Evidencia de estado:

| Comprobación | Resultado |
|---|---|
| `PostSocial.multimedia` en el cliente generado | **NO** |
| columna `multimedia` en la tabla `posts_social` | **SÍ** |
| posts con `multimedia` no nulo (de 15) | **0** |
| línea `Carrusel:` en los logs | 0 (solo hay 150 líneas: el contenedor se recreó hoy) |

**Honestidad sobre el alcance:** que el post con carrusel se pierda es determinista (la validación falla
siempre). Lo que **no** se pudo probar es cuántos posts se perdieron ya: los logs disponibles son
posteriores a la recreación del contenedor. Los 15 posts que existen tienen todos `multimedia = NULL`,
que es compatible con "nunca se detectó un carrusel" o con "se perdieron todos". El contador
`[Extractor] Carrusel: X/Y fotos guardadas` (línea ~1208) sirve para medirlo de ahora en adelante.

**Buenas noticias para el plan:** los parches de P15, las puertas y `extractFromTextOnly` **no escriben
`multimedia`**, así que se pueden aplicar ya, sin tocar el schema y sin rebuild. El punto 5 de la tabla
de prioridades (carruseles) es el único que exige arreglar el schema primero.

## 10.3 Los tres schemas, comparados

| | `repo/vps/.../prisma` | VPS (host y contenedor) | app raíz (`prisma/schema.prisma`) |
|---|---|---|---|
| Líneas | 230 | 264 | — |
| `model PostSocial` | **NO** | SÍ | SÍ |
| `PostSocial.multimedia` (`Json?`) | — | **NO** | SÍ |
| `enum EstadoPost` | **NO** | SÍ | SÍ |
| `TipoAliado.CAFETERIA` | SÍ | **NO** | SÍ |
| `AliadoHabitacion` | NO | NO | SÍ |
| Modelo Prisma para `wa_mensajes_procesados` | NO | NO | NO |

El schema del worker es un **fork viejo** del de la app: se separó en algún momento y nadie lo volvió a
sincronizar. El del repo está todavía más atrás que el del VPS.

## 10.4 Correcciones a lo que dije en la sección 9

1. **9.4 estaba mal en el titular.** No es que "falte `PostSocial` en el contenedor": está, y el comando
   da `1`. El que está desactualizado es el del repo. El análisis del mecanismo (imagen horneada,
   `prisma/` sin montar) sí era correcto.
2. **`wa_mensajes_procesados` no es un modelo Prisma en ningún lado.** Lo crea
   `scripts/ensure-schema.js` con `CREATE TABLE IF NOT EXISTS`, y `poller.js` lo usa con SQL crudo
   (`yaProcesado` / `marcarProcesado`). Columnas reales, verificadas en la BD del worker:
   `id, grupoId, messageTimestamp, urlsEncontradas, postsCreados, procesadoAt`.
   Consecuencia práctica: para el guard de §5.2 **no** hay que agregar ningún modelo; alcanza con el
   `continue` antes de `marcarProcesado`.
3. **El cliente generado NO es un espejo del schema que está al lado.** El DMMF del cliente en ejecución
   no conoce el enum `TipoAliado`, aunque `/app/prisma/schema.prisma` (el mismo archivo que copiamos a
   /tmp para generar) sí lo declara. Es decir: el cliente de la imagen quedó de un estado anterior.
   Lección para el plan: **cualquier `docker compose build` cambia el cliente**, así que no se puede
   asumir que "lo que anda hoy seguirá andando" — y por eso el schema tiene que estar bien **antes**
   del rebuild.
4. Los otros dos hallazgos de 9.4 sí se sostienen: `urlOriginal` es nullable y el riesgo de rebuild era
   real (es el que destapó 10.2).

## 10.5 Inventario real de la cola de moderación

Consulta directa a `posts_social`:

```json
{ "total": 15, "conMultimedia": 0, "sinTitulo": 0, "sinFecha": 3, "sinLugar": 2,
  "noAprobables": 0, "pendientes": 15, "aprobados": 0, "rechazados": 0 }
// por origen: [{ "origen": "WHATSAPP_GRUPO", "n": 15 }]
```

Tres lecturas:

1. **Ningún post llegó sin título.** El escenario que justifica P15 (§3) hoy no se está materializando en
   posts guardados, porque los que caen sin datos se descartan antes. P15 sigue siendo correcto (recupera
   justo esos), pero no hay que esperar que inunde la cola.
2. **5 de 15 no se pueden aprobar**: `aprobarPostBot` rechaza si falta fecha (3) o lugar (2). Es el matiz
   de §9.5, ya con números.
3. **0 aprobados y 0 rechazados de 15 pendientes.** La cola de moderación no se está usando. Antes de
   invertir en el botón "crear evento desde este texto" (§9.5), conviene medir: si nadie aprueba los 15
   que ya están aprobables, el cuello de botella no es la falta de botón.

## 10.6 Recomendación concreta

**El problema de fondo no es `PostSocial` faltante: son tres schemas divergiendo.** Parchear el del repo
una vez arregla el síntoma de hoy y garantiza el de dentro de un mes. Dos opciones:

- **A (mejor):** que el worker **no tenga** su propio schema; que apunte al de la app
  (`prisma generate --schema ../prisma/schema.prisma` o copia en el deploy). El worker solo usa un
  subconjunto de los modelos, y tener de más no molesta. Una sola fuente de verdad, cero divergencia.
- **B (mínimo):** sincronizar el del worker a mano (VPS + `multimedia Json?` + `CAFETERIA`) y agregar un
  chequeo en el deploy que falle si los dos archivos difieren.

Sea A o B, el orden que propongo:

| # | Paso | Por qué |
|---|---|---|
| 1 | **P15** (`tieneAlgo` + `(text && text.trim().length > 10)`) | cambio .js, solo `restart`, sin rebuild, sin riesgo |
| 2 | **Guard de `marcarProcesado`** (§5.2) antes de abrir las puertas | evita quemar el histórico |
| 3 | **Abrir las dos puertas** + **`extractFromTextOnly`** (versión 9.2) | cambios .js, solo `restart` |
| 4 | **Arreglar el schema** (`multimedia` + `PostSocial` + `CAFETERIA`, o unificar) y **recién ahí rebuild** | sin esto, el rebuild puede romper más de lo que arregla |
| 5 | Botón "crear evento desde este texto" | decidir con los números de §10.5 |

Lo importante del orden: **los pasos 1-3 no necesitan rebuild** porque `lib/` y `worker.js` son
volúmenes. Todo lo que toque `multimedia` (paso 5 de la tabla de §6) queda bloqueado hasta el paso 4.

---

# 11. Los 15 posts, uno por uno (consulta de solo lectura, 2026-09-24)

> Responde al pedido del revisor: *"¿por qué nadie modera?"*. La consulta **no escribió nada**.
> Se listan en el mismo orden que los muestra `/admin`
> (`app/admin/page.tsx:93` → `orderBy: [{ confianzaIA: "desc" }, { fechaDeteccion: "desc" }]`).

## 11.1 Qué hay en la cola

| id | conf | img | fecha | lugar | título (recortado) |
|---|---|---|---|---|---|
| 15 | 0.35 | — | 2026-10-02 | Paseo Cultural de la ciudad | 🎶 #DíaDelPasillo \|\| El Municipio de Loja… |
| 14 | 0.35 | — | 2026-10-02 | Paseo Cultural de la ciudad | 🎶 #DíaDelPasillo \|\| El Municipio de Loja… |
| 13 | 0.35 | — | 2026-10-02 | Paseo Cultural de la ciudad | 🎶 #DíaDelPasillo \|\| El Municipio de Loja… |
| 12 | 0.35 | — | 2026-09-26 | Teatro Benjamín Carrión | HAY PREGUNTAS QUE DUELEN MÁS CUANDO… |
| 11 | 0.35 | — | 2026-09-26 | Teatro Bolívar | Disfruta de "Boleros, Pasillos y Algo…" |
| 10 | 0.35 | — | 2026-10-01 | Hall | 📚 #Literatura \|\| El Municipio de Loja… |
| 9 | 0.35 | — | 2026-09-26 | Teatro Benjamín Carrión | HAY PREGUNTAS QUE DUELEN MÁS CUANDO… |
| 8 | 0.35 | — | 2026-10-01 | Hall | 📚 #Literatura \|\| El Municipio de Loja… |
| 7 | 0.35 | — | 2026-09-25 | Teatro Bolívar | El concierto 'Sinfo Rock' 🎸… |
| 5 | 0.35 | — | 2026-09-26 | Unidad Educativa PCEI | Con el auspicio del Departamento de Cultura… |
| 2 | 0.35 | — | 2026-09-25 | Iglesia Catedral | Gracias a la cobertura de Diario Ecotelpress… |
| 6 | 0.25 | **S** | — | — | Tráiler Oficial (youtu.be) |
| 4 | 0.25 | **S** | — | TEATRO NACIONAL | JUEVES CULTURAL (Instagram) |
| 3 | 0.25 | **S** | 2026-09-26 | salón de la Casona Cultural | Exposición pictórica "Entre lo concreto…" |
| 1 | 0.20 | **S** | — | — | España: ¿Por qué No Sabemos estas Cosas? (short de YouTube) |

Resumen: `total 15 · 0 con fecha pasada · 11 sin imagen · confianza 0.20–0.35 (media 0.32) ·
las 15 creadas el 2026-09-24`.

## 11.2 Cinco lecturas

1. **Las 15 filas son de HOY.** Esto **corrige** la lectura 3 de §10.5: *"0 aprobados no prueba que la
   cola no se use"* — la cola tiene horas de vida. Hay que volver a medir en unos días antes de concluir
   nada sobre el flujo de moderación.
2. **Cero fechas en el pasado.** La hipótesis de "fechas raras" queda descartada con datos: todas caen
   entre el 25-sep y el 2-oct.
3. **Hay 4 duplicados: 15 filas son solo 11 posts distintos.**
   `#13 = #14 = #15` (Día del Pasillo), `#8 = #10` (Literatura), `#9 = #12` (preguntas que duelen).
   Es exactamente el punto 4 de §6 ("la misma URL en varios mensajes genera posts duplicados") medido:
   **el 27% de la cola es repetición**.
4. **11 de 15 no tienen imagen.** No hay afiche que mirar: para moderarlos hay que leer un caption
   recortado. De los 4 que sí tienen imagen, dos son YouTube (uno de ellos, un short **sobre España**),
   o sea que **2 de 15 ni siquiera son eventos de Loja**.
5. **El bug de confianza de §P2 se ve funcionando en producción.** Los 4 posts **con** imagen quedaron
   al fondo (0.25 y 0.20) y los 11 **sin** imagen arriba (todos 0.35). Como el panel ordena por
   `confianzaIA desc`, **abre mostrando precisamente las filas que no tienen nada que mirar**. La
   inversión no es teórica: es lo primero que ve el moderador.

## 11.3 Consecuencia para la decisión del paso 5

El cuello de botella visible **no es la falta de botón "crear evento desde este texto"**: es **ruido**.
Antes de agregar UI conviene, en este orden:

1. **Dedupe (P5)** — quita el 27% de la cola de un saque.
2. **Filtro de "esto no es un evento"** — descarta YouTubes y contenido fuera de Loja.
3. **P2 (fórmula de confianza)** — sube de "calidad" a **urgente**: hoy decide qué ve el moderador
   primero, y lo que muestra primero es lo que menos sirve.
4. El botón del paso 5: pospuesto, con los mismos argumentos que §9.5 más estos datos.

## 11.4 Respuesta al matiz del `migrate`

Verificado, sin riesgo para la copia del schema:

- **No hay ningún `prisma migrate`, `migrate deploy`, `migrate dev` ni `db push` en todo `vps/`.**
  El único paso de Prisma en el flujo del worker es `RUN npx prisma generate` (Dockerfile).
- **Consumidores del schema del worker, todos revisados:**
  | Archivo | Qué usa |
  |---|---|
  | `worker.js` | solo `prisma.postSocial` (findMany / count / update) |
  | `lib/url-extractor.js` | solo `prisma.postSocial.create` |
  | `prisma/seed-50.ts`, `seed-aliados.ts`, `seed-instituciones.ts`, `seed-whatsapp-events.ts`, `seed.ts` | `categoria`, `zona`, `evento`, `aliado`, `atractivoCantonal`, `institucion` |
  | `scripts/ensure-schema.js` | SQL crudo (no lee el schema de Prisma) |
- **Ningún archivo usa `AliadoHabitacion` ni los campos nuevos de `Aliado`**, y **nada pasa a ser
  obligatorio** con la copia: lo que se agrega (`numeroCuartos`, `estrellas`, `habitaciones`) son
  campos opcionales o relaciones, así que los `createMany` de los seeds siguen siendo válidos.
- El worker **solo lee/escribe `posts_social`** por Prisma; el resto del schema le es indiferente.

---

# 12. P2 aplicado y medido (2026-09-24) — el primer parche que llega a producción

> A diferencia de las secciones 9-11 (diagnóstico), **esta sección documenta un cambio ya desplegado**.
> El orden fue: arnés de medición **antes** → parche → despliegue → backfill.

## 12.1 El parche (3 líneas, `lib/url-extractor.js`)

```js
  let confianza = 0;
  if (eventoJsonLd) confianza += 0.4;
  if (fuentes.fecha === "json-ld") confianza += 0.2;
  else if (fuentes.fecha === "afiche") confianza += 0.15;   // ⬅ NUEVO
  else if (fuentes.fecha === "caption") confianza += 0.1;
  if (fuentes.lugar === "json-ld") confianza += 0.15;
  else if (fuentes.lugar === "afiche") confianza += 0.15;   // ⬅ NUEVO
  else if (fuentes.lugar === "caption") confianza += 0.1;
  if (imagenUrl) confianza += 0.1;
  if (titulo) confianza += 0.1;
  if (descripcion) confianza += 0.05;

  // ⬅ NUEVO: la visión dice que no es un evento cultural → se hunde, no se descarta
  if (afiche && afiche.esEventoCultural === false && !eventoJsonLd) {
    confianza = Math.min(confianza, 0.1);
  }

  confianza = Math.max(0, Math.min(1, Number(confianza.toFixed(2))));
```

**Trampa de orden (importante):** el hundimiento **no** puede ir en el bloque de visión (línea ~914),
donde se evalúa `afiche.esEventoCultural`: ahí `confianza` todavía no existe (`let` en la 1119), así que
sería `ReferenceError: Cannot access 'confianza' before initialization`. `node --check` **no** lo detecta
porque es sintácticamente válido. Mismo tipo de bug que el de `guiaVenta` en `app/api/chat/route.ts`.

**Guardia `!eventoJsonLd`:** si la página trae JSON-LD `schema.org/Event`, no se hunde. Es una señal más
fuerte que la lectura de un afiche, y evita castigar un evento legítimo que Gemini leyó mal. No altera el
resultado medido (los 2 posts afectados no tienen JSON-LD).

## 12.2 Medición previa (arnés de solo lectura sobre los 15 `urlOriginal`)

**Control de fidelidad: 15/15.** La fórmula de hoy reproducía exactamente el `confianzaIA` guardado en las
15 filas → la comparación antes/después es fiable.

| Post | Hoy | Con P2 | Fuente real medida | Puesto |
|---|---|---|---|---|
| **#3** Exposición pictórica | 0.25 | **0.55** | `fecha:afiche` `lugar:afiche` | 12º → **1º** |
| **#4** (flyer IG, carrusel de 9) | 0.25 | **0.40** | `fecha:—` `lugar:afiche` | 13º → **2º** |
| #2, #5, #7…#15 (11 posts) | 0.35 | 0.35 | `caption` `caption` | bajan un puesto |
| #6 Tráiler Oficial (YouTube) | 0.25 | 0.25 | — | 14º |
| #1 short "España" (YouTube) | 0.20 | 0.20 | — | 15º |

**Se mueven 13 de 15 filas**, y los **dos únicos posts con afiche real pasan de 12º/13º a 1º/2º**.
(La predicción inicial —"mueve una fila"— era pesimista: se subestimó que el `lugar` de #4 también venía
del afiche.)

`esEventoCultural` en la muestra completa: **`false` en #1 y #6** (los dos YouTube), **`true` en #3 y #4**
(los dos con afiche), `(sin afiche)` en los 11 restantes. **Cero falsos en 15.**

## 12.3 El hundimiento es 1 línea, no plomería nueva

Se creía que los YouTubes nunca pasaban por la visión. **No es así**: la miniatura de oEmbed se inyecta en
`crudo.imagenesEnVivo` (líneas 873-883), así que `leerAfiche` sí corre y **ya respondía
`esEventoCultural: false`**. El problema nunca fue la falta del dato, sino que el `false` solo hacía
`advertencias.push(...)` y el post se guardaba igual.

→ El arreglo correcto no era "traer la miniatura a la visión" (ya estaba), sino **darle consecuencia**.

## 12.4 Despliegue y backfill (aplicados)

Despliegue: `scp` + `docker compose restart`, **sin rebuild**. Verificado por hash SHA-256 idéntico
(`1e8db06d…`) en el repo, en el VPS y **dentro del contenedor**; `health: ok`, Evolution conectada.

Backfill (los `confianzaIA` ya guardados no cambian solos con el parche):

```sql
UPDATE posts_social SET confianzaIA = 0.55 WHERE id = 3;
UPDATE posts_social SET confianzaIA = 0.40 WHERE id = 4;
UPDATE posts_social SET confianzaIA = 0.10 WHERE id IN (1, 6);
```

Los `UPDATE` escriben **valores absolutos**, así que repetirlos no acumula. Resultado: el panel ahora
abre con `#3 (0.55) > #4 (0.40) > los 11 del caption (0.35) … > #1 y #6 (0.10)`.

**Decisión consciente, no omisión:** #1 y #6 **siguen en la cola**, solo al fondo. El moderador todavía
puede verlos y rechazarlos a mano — coherente con el principio del proyecto (*no descartar en silencio*).

## 12.5 Corolario: en este grupo, el caption es la fuente dominante

Al re-extraer los 15, **11 respondieron "Página tras un muro de login: no se usará ninguna imagen"**
(`#2, #5, #7…#15`). Ese 73% de la cola son enlaces de Facebook cuyo **único** dato útil vive en el texto
del mensaje de WhatsApp: sus fuentes son `caption`/`caption`, y no hay afiche que leer.

Consecuencias para las prioridades siguientes:

- Sube el valor de **`extractFromTextOnly`** (§9.2): el mismo patrón de extracción por regex sirve como
  **respaldo** cuando el enlace cae en muro de login y solo queda el caption.
- Confirma que **`textoOriginal` es la materia prima real** de esta cola, no los metadatos de las páginas.
- Explica por qué P2 no puede arreglar a esos 11: no tienen afiche del cual sacar puntos. Su problema no
  es de prioridad sino de falta de imagen → **§6 punto 5 (tubería de adjuntos)**.

---

# 13. P15 + `extractFromTextOnly` aplicados (2026-09-24)

## 13.1 Qué se aplicó, y qué NO

| Cambio | Estado | Nota |
|---|---|---|
| **1. P15** en `lib/url-extractor.js` | ✅ aplicado, con una guardia añadida (§13.2) | |
| **2. `extractFromTextOnly`** | ✅ aplicado con dedupe y exigencia de fecha o lugar | |
| **3. `lib/poller.js`** | ✅ aplicado con dos correcciones (§13.2) | |
| **4. `worker.js`** (webhook) | ❌ **NO se aplicó: es código inerte** | la Puerta 1 no recibe nada (§13.3) |

## 13.2 Dos correcciones sobre el plan original

**a) P15 sin guardia reabría el agujero que cerraba.** `text` es el mensaje **completo**, así que incluye la
URL: un mensaje que solo trae `https://facebook.com/share/…` supera los 10 caracteres y habría creado un
post **vacío** (sin título, fecha, lugar ni imagen) — justo las "filas vacías" que `tieneAlgo` existe para
evitar. Se mide el texto **sin las URLs**:

```js
const textoSinUrls = text ? text.replace(/https?:\/\/\S+/gi, "") : "";
const tieneAlgo = Boolean(
  datos.titulo || datos.fecha || datos.lugar || (fotosPermanentes.length > 0)
  || textoSinUrls.trim().length > 10
);
```

**b) La guardia de `poller.js` era demasiado estrecha.** El plan usaba
`if (urls.length === 0 && tieneAdjunto && !texto) continue`, o sea: un adjunto **con** pie de foto sí se
marcaba como procesado. Pero ese mensaje crea un post de solo texto y queda **quemado** para cuando exista
la descarga de media (el fallo de §5.2). Ahora se deja sin marcar **cualquier** adjunto sin enlace, y aun
así el post de texto se crea (visible hoy) porque `extractFromTextOnly` dedupea por texto exacto: en cada
pasada siguiente devuelve `null` y no duplica. Se gana visibilidad inmediata **sin** perder el afiche del
futuro.

Además `tieneAdjunto` incluye `documentWithCaptionMessage` (el PDF o la imagen **con** texto, que llega
anidado) — sin eso, ese caso se marcaba como procesado y se quemaba igual.

## 13.3 La Puerta 1 está muerta (verificado contra Evolution, no deducido)

```bash
GET {EVOLUTION_API_URL}/webhook/find/cesar-comercial
{ "enabled": true, "url": "http://127.0.0.1:8095/webhook/cliente", "events": ["MESSAGES_UPSERT"] }
```

El webhook de la instancia pertenece a **otro servicio** (puerto 8095), no al worker (8083). Como Evolution
guarda **un solo webhook por instancia**, `POST /webhook/whatsapp` de `worker.js` **nunca recibe nada** — el
propio worker lo dice al arrancar: *"Modo: SOLO LECTURA (no envía mensajes ni toca webhooks)"*.

Consecuencias:
- El cambio 4 no se aplicó: sería código **no verificable** y sin efecto.
- La justificación del dedupe en `extractFromTextOnly` ("el webhook y el poller pueden ver el mismo
  mensaje") **hoy no aplica**: solo corre el poller, que ya dedupea por `messageId`. Se dejó igual porque
  el dedupe es barato y protege si algún día se registra el webhook.
- Si en el futuro se quiere la vía en tiempo real, hay que **liberar** el webhook de la instancia (acuerdo
  con el otro servicio) o usar otra instancia de Evolution.

## 13.4 Prueba real (ejecutada contra la BD, con limpieza)

| Caso | Resultado |
|---|---|
| Estilo del grupo (con `📅` y `📍`) | ✅ `fecha 2026-10-05T01:00Z` (= 4-oct **20:00** en Loja), `lugar "Teatro Bolívar, Loja"`, confianza **0.35** |
| Prosa "se realizará **en el** Teatro Bolívar" | ✅ `lugar "Teatro Bolívar"`, confianza **0.35** |
| Lugar suelto sin marcador ("Teatro Bolívar, Loja" en su propia línea) | ☑️ `lugar: null` **a propósito** (ver abajo) |
| El mismo texto por segunda vez | ✅ devuelve `null`: **no duplica** |
| "Buenos días a todos, que tengan un excelente día" | ✅ devuelve `null`: no entra a la cola |
| "4 de oct" (texto corto) | ✅ devuelve `null` |
| Limpieza | ✅ 3 filas de prueba borradas · la cola volvió a **15** |

**La fecha se guarda como `Date`** (`2026-10-05T01:00:00.000Z`), no como el objeto del extractor: el bug que
señalaba §9.1 no se repitió.

**Hallazgo útil sobre el lugar:** `extraerLugarDeTexto()` solo reconoce (a) el marcador `📍` o una etiqueta
explícita (`Lugar:`, `Ubicación:`, `Sede:`, `Dirección:`, `Dónde:`, `Local:`) o (b) el patrón
"**en el** Teatro Bolívar" con mayúscula inicial. Una línea suelta tipo "Teatro Bolívar, Loja" **se rechaza
a propósito** (`limpiarLugar` descarta frases que empiezan en minúscula, largas, o que son horas/fechas).
Es una decisión de precisión sobre cobertura: se prefiere `lugar: null` antes que "en el año 2024".
→ Para que `extractFromTextOnly` recoja el lugar, el mensaje del grupo tiene que usar `📍` o "en el X", que
es como efectivamente escribe (los posts reales usan `📍 Iglesia Catedral`).

## 13.5 Lo que esto NO arregla

- **No baja el ruido de los 11 con muro de login**: esos ya se guardaban, porque su pie de foto sí daba
  título. `extractFromTextOnly` no los toca (tienen URL).
- **El volumen de P15 es bajo**: solo entra en acción cuando el pie de foto no produce ni título, ni fecha,
  ni lugar. Se espera un goteo, no un aluvión.
- **Los adjuntos siguen sin leerse**: cada afiche queda anotado en `mensajesEnEspera` y sin marcar como
  procesado, esperando la tubería de media (§6 punto 5).
- Efecto colateral cosmético: los mensajes con adjunto se cuentan otra vez en `mensajesNuevos` en cada
  pasada (nunca se marcan). Para eso está `mensajesEnEspera`, que los separa del resto.

---

# 14. Dedupe por contenido (P5) aplicado (2026-09-24)

## 14.1 Qué se midió antes de elegir la clave

La cola real tenía 3 grupos de repetidos. **Los tres comparten el mismo `urlOriginal`:**

```
ids 8,10     ×2  https://www.facebook.com/share/p/14yiwxphqrB/?mibextid=wwX
ids 9,12     ×2  https://www.facebook.com/share/p/1CJc6tQC5y/?mibextid=wwXI
ids 13,14,15 ×3  https://www.facebook.com/share/p/1JHEmJUMY7/?mibextid=wwXI
```

Y al comparar por `textoOriginal` **falla uno**: el texto de `#13` tiene **824** caracteres y el de
`#14`/`#15` **823**. Es decir, dos copias del mismo mensaje diferían en **un carácter** → la clave por
texto exacto (la que se había puesto en `extractFromTextOnly`) no las habría detectado.

| Clave | Grupos con repetidos | ¿Detecta los 4 repetidos? |
|---|---|---|
| `urlOriginal` (cruda) | 3 | ✅ |
| `titulo` | 3 | ✅ |
| `textoOriginal` (exacto) | 3 | ❌ se le escapa `#13` |
| `titulo`+`fecha`+`lugar` | 3 | ✅ |

**Conclusión: la clave es la URL** (15 filas → 11 URLs distintas, exactamente igual que los títulos).

## 14.2 Por qué la URL cruda no alcanza: `normalizarUrl()`

En la propia cola aparecen dos variantes del mismo enlace según el dispositivo que lo compartió:

| Param | ids |
|---|---|
| `?mibextid=wwX` | 8, 10 |
| `?mibextid=wwXI` | 9, 12, 13, 14, 15 |

Un mismo post compartido desde otro teléfono traería otra variante y comparar la cadena cruda **fallaría**.
Se compara la URL **sin query, sin hash y sin barra final**; lo que se guarda en `urlOriginal` no se toca.

```js
function normalizarUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url.split("#")[0].split("?")[0].replace(/\/+$/, "");
}
```

Del lado de la BD se normaliza igual, en SQL, para no necesitar columna nueva:

```sql
WHERE TRIM(TRAILING '/' FROM SUBSTRING_INDEX(SUBSTRING_INDEX(urlOriginal, '?', 1), '#', 1)) = ?
```

**Nota:** `idDeUrl()` **no** sirve para esto — a pesar del nombre, extrae un nombre de archivo del CDN
(`17898037…_n`), no el identificador del post.

## 14.3 Dónde se aplica

| Punto | Clave | Por qué ahí |
|---|---|---|
| `extractAndProcessUrls` (posts con enlace) | URL normalizada | Va **después** de `extraerEvento` y **antes** de subir las fotos a Bunny: si el post ya está, no se repite la subida al CDN |
| `extractFromTextOnly` (posts sin enlace) | `titulo` + `fechaPublicacion` + `lugar` | No hay URL; y el texto exacto se descarta por lo de §14.1 |

Los posts ya guardados **no se tocan**: esto evita los duplicados **nuevos**.

## 14.4 La trampa de orden, otra vez (misma clase que §12.1)

En `extractFromTextOnly` el dedupe usa `titulo`, `infoFecha` y `lugar`, así que **tiene** que ir después de
calcularlos: si se deja arriba (junto a `textoOriginal`) es un
`ReferenceError: Cannot access 'titulo' before initialization` — y `node --check` no lo detecta porque es
sintácticamente válido. **Se detectó leyendo el flujo, no con el linter.** Igual que el hundimiento de §12.1.

## 14.5 Pruebas ejecutadas (todas contra la BD real, con limpieza)

| Comprobación | Resultado |
|---|---|
| Las 11 URLs distintas se reconocen a sí mismas | ✅ 11/11 |
| Variante `?mibextid=wwX` sobre la URL de `#8` | ✅ → post #8 |
| Variante `?mibextid=wwXI` | ✅ → post #8 |
| Variante `?mibextid=OTRA_COSA&x=1` | ✅ → post #8 |
| URL con barra final | ✅ → post #8 |
| Miso texto con **1 carácter** de diferencia (el caso `#13`/`#14`) | ✅ devuelve `null` |
| El texto idéntico | ✅ devuelve `null` |
| Limpieza | ✅ 1 fila de prueba borrada · la cola volvió a **15** |

## 14.6 Queda pendiente: los 4 repetidos que ya están guardados

El código no limpia el pasado. Las filas redundantes son:

| Se queda | Se puede borrar | Por qué |
|---|---|---|
| #8 | #10 | mismo `urlOriginal`, mismo título, mismo texto |
| #9 | #12 | ídem |
| #13 | #14, #15 | ídem (el texto difiere en 1 carácter, sin efecto) |

Borrar `#10, #12, #14, #15` deja la cola en **11 posts, sin repetidos**, sin perder información: su contenido
es idéntico al de la fila que se conserva. **Pendiente de aprobación** (es un `DELETE` en producción).

## 14.7 Nota de rendimiento

La consulta de dedupe recorre la tabla (no hay índice sobre `urlOriginal`; los índices actuales son
`estado`, `fechaDeteccion` y `origen`). Con 15 filas es irrelevante; si la tabla pasa de unos miles de
filas conviene añadir el índice.





