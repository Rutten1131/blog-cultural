# Cómo funciona el bot de scraping — Agenda Cultural Loja

Documento técnico del worker de WhatsApp. Explica **paso a paso** qué hace
cuando encuentra un mensaje en el grupo, de dónde saca cada dato, cómo elige
las imágenes y qué es lo que **no** puede hacer.

---

## 1. Vista general

```mermaid
flowchart TD
    A[Grupo de WhatsApp] -->|Evolution API<br/>SOLO LECTURA| B[Leer últimos 50 mensajes]
    B --> C{¿Ya procesado?<br/>tabla wa_mensajes_procesados}
    C -->|sí| B
    C -->|no| D[Extraer URLs del texto]
    D -->|0 URLs| Z[Marcar como procesado]
    D -->|N URLs| E[Puppeteer abre cada enlace]

    E --> F[Capturar del HTML:<br/>og:, Twitter, JSON-LD,<br/>texto visible]
    E --> G[Capturar imágenes<br/>a nivel de red]
    E --> H[Extraer JSON del carrusel<br/>carousel_media]

    H --> I[Descargar fotos del CDN]
    G --> I
    F --> J[Gemini lee los afiches]

    I --> J
    J --> K[Ensamblar datos<br/>por prioridad de fuente]
    F --> K
    K --> L{¿Tiene algo?<br/>título / fecha / lugar / foto}
    L -->|no| Y[Descartar]
    L -->|sí| M[Subir fotos a Bunny CDN]
    M --> N[(posts_social<br/>PENDIENTE)]
    N --> O[/admin<br/>moderación humana/]
    O -->|Aprobar| P[(eventos<br/>PENDIENTE)]
```

**Principio rector: no inventarse nada.** Cada dato guarda de dónde salió
(campo `fuentes`) y lo que no se encontró queda `null` y se lista en
`camposFaltantes`. El moderador ve exactamente qué es dato real y qué falta.

**El bot NUNCA publica solo.** Todo termina en `/admin` esperando aprobación
humana.

---

## 2. Paso a paso detallado

### Paso 1 — Leer los mensajes del grupo

**Archivo:** `lib/poller.js`, `lib/evolution-client.js`

- Se ejecuta cada **15 minutos** (`SCRAPE_INTERVALO_MIN`) y una vez al arrancar.
- Pide los últimos **50 mensajes** por grupo (`SCRAPE_PAGINAS`).
- La API los devuelve del más nuevo al más viejo; el bot los **invierte** para
  que los posts queden en orden cronológico.

**Filtro de ruido** (`esMensajeRelevante`): descarta `reactionMessage`,
`protocolMessage` y `senderKeyDistributionMessage`. Es decir, ignora
reacciones con emoji y mensajes internos de WhatsApp.

**Idempotencia:** la tabla `wa_mensajes_procesados` guarda el ID de cada
mensaje ya visto. Así un mensaje no se procesa dos veces en la siguiente
pasada. Se marca incluso si no tenía enlaces.

**Texto útil** (`extraerTextoDeMensaje`) — se saca de:
`conversation` → `extendedTextMessage.text` → caption de imagen → caption de
video → caption de documento.

> ⚠️ **Ojo:** si el mensaje es una **foto sin texto** (un afiche pegado
> directamente, sin caption ni enlace), el bot lo ignora por completo. No hay
> nada que visitar. **Esto es un hueco importante** — ver sección 8.

### Paso 2 — Sacar los enlaces del texto

**Archivo:** `lib/url-extractor.js` → `extractUrls()`

Regex sobre `http(s)://` y `www.`. Deduplica. Descarta ruido típico.

### Paso 3 — Abrir el enlace con Puppeteer

**Archivo:** `lib/url-extractor.js` → `leerPagina()`

Chromium headless en Alpine. Espera `domcontentloaded` (más seguro que
`networkidle0`, que se cuelga con trackers), luego 2 s de margen, un scroll
para forzar carga diferida, y **espera a que terminen todas las descargas de
imágenes en curso** antes de leer el estado.

### Paso 4 — Extraer datos del HTML

Se leen, en este orden de confiabilidad:

| Fuente | Qué da | Confiabilidad |
|---|---|---|
| **JSON-LD** `schema.org/Event` | nombre, fecha, lugar, imagen | ⭐⭐⭐⭐⭐ dato estructurado del organizador |
| **Afiche (IA)** | nombre, fecha, hora, lugar, precio | ⭐⭐⭐⭐ es lo que el organizador publicó |
| **JSON del carrusel** | TODAS las fotos del post | ⭐⭐⭐⭐⭐ |
| **OpenGraph / Twitter** | título, descripción, imagen | ⭐⭐ suele ser el texto de quien compartió |
| **Texto visible / HTML** | lugar a veces | ⭐ muy poco fiable |

**Título** — se prueba en este orden y gana el primero que sirva:
1. `afiche.nombre` (IA)
2. `jsonLd.name`
3. `og:title` → `twitter:title` → `youtube.title` → `h1` → `<title>`
4. primera línea útil del mensaje de WhatsApp

Entre cada paso se descartan **títulos genéricos**: `Facebook`, `Instagram`,
`Before you continue to YouTube`, `Tráiler Oficial`…

**Lugar** — mismo criterio:
1. `jsonLd.location`
2. `afiche.lugar` (IA) ← el más específico normalmente
3. `extraerLugarDeTexto(textoMensaje)` — busca `📍`, `Lugar:`, o `en el Teatro X`
4. ⚠️ texto visible de la página — **solo si la página expuso metadatos reales**

### Paso 5 — Imágenes (la parte más delicada)

**Archivo:** `lib/url-extractor.js`, `lib/imagenes.js`

Hay **tres vías**, en orden de prioridad:

#### Vía A — Carrusel, desde el JSON embebido ⭐ la buena

Instagram y Facebook meten en el HTML un bloque JSON con **todas** las fotos
del post.

```js
"carousel_media": [ { "image_versions2": { "candidates": [ {width, height, url} ] } } ]
```

1. `recorteJson()` localiza el array contando llaves y corchetes (sin esto el
   recorte parte el JSON).
2. `fotosDelCarrusel()` devuelve las URLs **en orden**.
3. `mejorUrlDeMedia()` elige la mayor resolución de cada foto (tope 2048 px).
4. `descargarFotos()` las baja del CDN por HTTP, **3 a la vez**.

> **Descubrimiento clave:** Instagram **no descarga** todas las fotos del
> carrusel por red; solo pide la que muestra. Esperarlas en el navegador no
> sirve — hay que sacarlas del JSON. Verificado: **9/9 fotos**.

#### Vía B — `og:image`

Si no hay carrusel, se usa la portada que declara la página. Se descarga por
HTTP igual que las del carrusel.

#### Vía C — YouTube (oEmbed)

La página de YouTube devuelve el aviso de cookies. En cambio
`youtube.com/oembed` da el título real, el canal y la miniatura. Se pide la
versión de **1280 px** (`maxresdefault`) en vez de la de 480 px.

#### Lo que se rechaza explícitamente

- **Muros de login.** Si la URL final contiene `/login`, `/checkpoint` o
  `accounts.facebook.com`, la página es la pantalla de inicio de sesión: no se
  usa **ninguna** imagen.
- **Tipos que no son fotos.** `image/x.fb.keyframes` es un sprite de la
  interfaz; colarlo rompía Gemini con HTTP 400.
- **Recursos de UI.** `/rsrc.php` = logos y sprites de Instagram/Facebook.
- **🔴 El respaldo "la imagen más pesada".** Existía antes y metía el dibujo de
  la política de cookies de Facebook como afiche del evento en 11 de 15 posts.
  **Fue eliminado.** Ahora, sin carrusel ni `og:image`, el post se queda **sin
  imagen**: mejor nada que una mentira.

### Paso 6 — Leer los afiches con IA

**Archivo:** `lib/vision.js` (Google Gemini, multimodal)

Se mandan **todas** las fotos del carrusel en **una sola petición**. El prompt
pide JSON con: `esEventoCultural`, `nombre`, `fechaTexto`, `horaTexto`,
`fechaFinTexto`, `lugar`, `precio`, `textoDelAfiche`.

**Reglas del prompt (lo más importante):**
- Extraer SOLO lo visible. Si un dato no aparece → `null`.
- **NO completar el año** si no está escrito. Copiar la fecha tal cual.
- Si no anuncia evento cultural → `esEventoCultural: false`.

> **Decisión de diseño:** se le pide la fecha **literal** ("Sábado 4 de
> octubre"), no convertida. La normalización la hace `fechas-es.js`, que ya
> está probado. Así la lógica de fechas vive en un solo lugar.

**Cascada de resiliencia:** rota entre **varias API keys × varios modelos**
hasta que alguno responda. Los flash de Gemini dan 503 (saturado) y 429 (cupo)
con frecuencia. `gemini-flash-lite-latest` resultó el más estable.

**Filtros de formato:** solo se envían `jpeg`, `png`, `webp`, `heic`, `heif`.
**AVIF no está soportado** y provoca HTTP 400.

**Regla de oro:** `leerAfiche()` **nunca lanza**. Si todo falla devuelve `null`
y el post se guarda igual. El escaneo nunca se interrumpe.

### Paso 7 — Fechas y zona horaria

**Archivo:** `lib/fechas-es.js`

Ecuador = **UTC-5 todo el año**, sin horario de verano.

| Caso | Tratamiento |
|---|---|
| Solo el día, sin hora | Se guarda a las **17:00 UTC** (= mediodía en Loja) para evitar el corrimiento de un día |
| Con hora explícita | Se interpreta como hora de Loja y se convierte con offset `-05:00` |
| Sin año | Se asume el año actual **y se avisa** con `anioInferido` |

Reconoce `am`/`pm` (se revisan **antes** de `HH:MM`, o "8pm" se lee como 20:00
mal), rangos ("del 4 al 6 de octubre"), y variantes ortográficas
(`setiembre`/`septiembre`).

### Paso 8 — Subir las imágenes a Bunny CDN

**Archivo:** `lib/imagenes.js`

Las URLs de `scontent-*.fbcdn.net` y `cdninstagram.com` son **firmadas y
temporales**, caducan en días. Se re-alojan en Bunny para que duren.

- Tipos permitidos: jpeg, png, webp, gif, avif. Tope 12 MB.
- Nombre: `bot-whatsapp/whatsapp-{timestamp}-{sha1}.{ext}`.
- Se guardan **todas** las fotos del carrusel en el campo `multimedia`.

### Paso 9 — Guardar como candidato

**Tabla:** `posts_social` (no en `eventos`).

¿Por qué dos tablas? `eventos` exige `fecha` y `lugar` NOT NULL y tiene `slug`
único. `posts_social` los admite nulos, porque el bot muchas veces no los
encuentra. Fusionarlas obligaría a tocar 28 usos de `evento.fecha` y 87
consultas en 29 archivos.

**Descarte automático:** si el post no tiene **ni título, ni fecha, ni lugar,
ni foto**, no se crea. Antes se guardaban filas vacías que solo ensuciaban la
cola de moderación.

### Paso 10 — Moderación humana

**Archivo:** `lib/actions/moderarPostBot.ts`, `app/admin/admin-bot-posts.tsx`

- Aparecen **dentro de la pestaña "Moderar Pendientes"**, marcados con 🤖 BOT.
  Un solo flujo, no una cola aparte.
- **Aprobar** crea un `Evento` en estado **PENDIENTE** (entra a la cola normal,
  donde se puede editar y publicar). Si falta fecha, lugar o título, **rechaza
  la aprobación** en vez de inventar.
- Las fotos del carrusel **viajan al evento** (campo `multimedia`).
- **Rechazar** lo marca como RECHAZADO. No crea nada.

---

## 3. Cómo se ven los mensajes REALES

Todo lo de esta sección salió de ejecutar
`scripts/ver-mensajes-reales.js` contra el grupo real
**"Agenda Cultural Participativa 2026"**. No son ejemplos inventados.

```sh
docker exec whatsapp-worker-whatsapp-worker-1 node scripts/ver-mensajes-reales.js 50
```

### 3.1 Ejemplo: mensaje que SÍ se procesa (el caso bueno)

```
messageType : conversation
de          : Andres Novillo
campo texto : conversation
VEREDICTO   : PROCESADO → 1 enlace(s)
TEXTO       :
  🎨Agradecemos la cobertura mediática de Diario La Crónica 🖋️ 🇪🇨#Arte ll Te
  invitamos a formar parte de la exposición de arte plástico...
  → https://www.facebook.com/share/1F4e182tNE/?mibextid=wwXIfr
```

De aquí el bot sacó: título real del afiche, fecha `2026-09-26`, lugar
`salón de la Casona Cultural` y una foto de 131 KB. **Los 4 campos completos.**

### 3.2 Ejemplo: enlace de Reel de Facebook (irrecuperable)

```
messageType : conversation
de          : bejaranojoseluis
campo texto : conversation
VEREDICTO   : PROCESADO → 1 enlace(s)
TEXTO       :
  https://www.facebook.com/share/r/1EhcC8tYpK/
  → https://www.facebook.com/share/r/1EhcC8tYpK/
```

Se procesa, pero el enlace redirige a `/login`. Resultado: **0 campos** y el
post se descarta automáticamente.

### 3.3 Ejemplo: `unknown` — el mensaje más frecuente

```
messageType : unknown
de          : M💕
campo texto : messageContextInfo, senderKeyDistributionMessage
VEREDICTO   : IGNORADO (sin texto que leer)
```

> 🐛 **Hallazgo:** `esMensajeRelevante()` intenta descartar estos mensajes
> buscando `messageType === "senderKeyDistributionMessage"`, pero Evolution
> los reporta como **`"unknown"`**. El filtro **nunca se dispara**.
> El resultado final es el mismo (no tienen texto y se ignoran igual), pero
> el filtro no hace lo que cree que hace.

### 3.4 Ejemplo: afiche pegado SIN texto — 🔴 el hueco grande

```
messageType : imageMessage
de          : VICTOR CELI
campo texto : imageMessage SIN caption
VEREDICTO   : IGNORADO (sin texto que leer)
```

```
messageType : imageMessage
de          : Viche Valarezo
campo texto : imageMessage SIN caption
VEREDICTO   : IGNORADO (sin texto que leer)
```

**Son afiches de eventos que el bot tira a la basura.** La imagen existe, se
puede bajar con Evolution, pero el bot necesita un enlace para hacer algo
(ver `poller.js`, línea del `if (urls.length > 0)`).

### 3.5 Ejemplo: reacción con emoji

```
messageType : reactionMessage
de          : José
campo texto : reactionMessage
VEREDICTO   : IGNORADO (ruido interno de WhatsApp)
```

### 3.6 Estadística de 50 mensajes reales

| Tipo de mensaje | Cantidad | Qué hace el bot |
|---|---|---|
| `conversation` **con enlace** | **11** | ✅ **PROCESA** |
| `unknown` (claves de cifrado) | 14 | ignora |
| `reactionMessage` | 7 | ignora |
| `imageMessage` | **7** | ❌ **IGNORA** |
| `groupStatusMessageV2` | 4 | ignora |
| `documentMessage` | **2** | ❌ **IGNORA** |
| `audioMessage` | 2 | ignora |
| `videoMessage` (con texto, sin enlace) | **1** | ❌ **IGNORA** |
| `secretEncryptedMessage` | 1 | ignora |
| `conversation` **sin enlace** | **1** | ❌ **IGNORA** |

### 3.7 🔴 Conclusión: el bot solo ve el 22% de los mensajes

**11 de 50 mensajes** llegan a procesarse. Los demás se pierden en el
`if (urls.length > 0)` de `poller.js`:

```js
const urls = texto ? extractUrls(texto) : [];
if (urls.length > 0) {                    // ← puerta que descarta todo lo demás
  posts = await extractAndProcessUrls(texto, jid, prisma);
}
```

**Se está perdiendo, con datos reales:**

| Qué se pierde | Cuántos de 50 | Por qué importa |
|---|---|---|
| **Afiches pegados como imagen** | 7 | Es el formato más natural de compartir un evento |
| **PDFs de programación** | 2 | Un PDF puede traer **varios** eventos |
| **Texto sin enlace** | 2 | Un anuncio escrito completo, sin link |
| **Videos con texto** | 1 | Tienen caption con datos |
| **Audios** | 2 | Podrían tener la info hablada |

> 🎯 **Ojo a este detalle:** un mensaje de texto **sin enlace** se ignora
> aunque contenga todo: *"Concierto el sábado 4 de octubre, 20:00, Teatro
> Bolívar"*. No hace falta visitar ninguna página para extraer eso — con
> `fechas-es.js` y `extraerLugarDeTexto()` ya alcanza.

---

## 4. Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `worker.js` | Servidor Express, cron, endpoints |
| `lib/poller.js` | Recorrer grupos, deduplicar, orquestar |
| `lib/evolution-client.js` | Cliente Evolution API (**solo lectura**) |
| `lib/url-extractor.js` | **El corazón**: navegar, extraer, decidir |
| `lib/vision.js` | Gemini multimodal |
| `lib/imagenes.js` | Re-alojar en Bunny CDN |
| `lib/fechas-es.js` | Fechas en español + zona Loja |
| `lib/clasificarEvento.js` | Categorizar el evento |

---

## 5. Limitaciones reales (verificadas)

| Limitación | Estado |
|---|---|
| **Enlaces `facebook.com/share/...`** | ❌ **Imposible.** Redirigen a `/login`. Verificado: 0 `og:`, 0 JSON-LD, 0 `<video>`. El oEmbed público de Meta ya no existe. |
| **Reels de Facebook** | ❌ Mismo muro de login. |
| **Reels/posts de Instagram** | ✅ Funcionan (los anónimos sí ven el contenido). |
| **Videos de YouTube** | ✅ Vía oEmbed: título real + portada 1280 px. |
| **Google Drive / formularios** | ❌ No son eventos; se descartan si no aportan nada. |
| **🔴 Solo se procesa el 22% de los mensajes** | ❌ **El hueco más grande.** Únicamente los mensajes con enlace llegan a procesarse (11 de 50 medidos). |
| **Texto sin enlace** | ❌ Se ignora aunque traiga el evento completo ("Sábado 4 de octubre, 20:00, Teatro Bolívar"). |
| **Fotos pegadas sin caption** | ❌ Se ignoran (7 de 50 mensajes reales). Es el formato más natural de compartir un evento. |
| **PDFs de programación** | ❌ Se ignoran (2 de 50). Un PDF puede traer **varios** eventos. |
| **Videos y audios con texto** | ❌ Se ignoran (3 de 50). |
| **Duplicados por URL distinta** | ⚠️ El mismo evento compartido con 2 enlaces crea 2 posts. El dedupe solo compara URL. |
| **Títulos-párrafo** | ⚠️ Si el mensaje empieza con una frase larga, ese es el título (cortado a 255). |

---

## 6. TODOS LOS PROBLEMAS (inventario completo)

Esta lista es el registro completo de fallos encontrados, **tanto los ya
resueltos como los que siguen abiertos**. Se mantiene a propósito: sirve para
no volver a pisar la misma piedra.

---

### 6.1 ✅ Ya resueltos

#### Infraestructura

| # | Problema | Causa real | Solución |
|---|---|---|---|
| 1 | Contenedor en bucle de reinicios | Prisma 7 exige adaptador explícito; `new PrismaClient()` a secas lanza `PrismaClientInitializationError` | `createPrismaClient()` con `PrismaMariaDb` |
| 2 | `@prisma/adapter-mariadb` no existía dentro de la imagen | `package.json` desactualizado en el contexto de build | `npm install` explícito en el Dockerfile |
| 3 | `.dockerignore` rompía el build | Tenía `\n` **literales** en vez de saltos de línea | Archivo corregido |
| 4 | `docker compose` fallaba sin decir por qué | Un `sed` inline dejó `DEBUG_IMAGENES=" true\` → `.env` con comilla sin cerrar | Línea corregida y **stderr nunca más silenciado** |

#### Datos y API de Evolution

| # | Problema | Causa real | Solución |
|---|---|---|---|
| 5 | **El bot nunca detectaba grupos** | Leía `body.data.message` en vez de `body.data` | Corregido (luego se abandonó el webhook por completo) |
| 6 | `GET /posts` daba error | Usaba `include: { fuente: true }` — esa relación no existe | Eliminado |
| 7 | **La clave de Evolution era INVÁLIDA (HTTP 400)** y el log decía *"Webhook configurado"* | El código **nunca comprobaba el estado HTTP** de la respuesta | Se copió la clave válida y se hace comprobar el estado |
| 8 | Auto-registro de webhook al arrancar era **peligroso** | Evolution guarda **UN solo webhook por instancia**; registrarse habría roto el del bot de Python | Bloque eliminado; ahora es 100% polling |
| 9 | `.dockerignore` / volumen mal montado | — | Revisado |

#### Seguridad

| # | Problema | Causa real | Solución |
|---|---|---|---|
| 10 | **Clave SSH PRIVADA a punto de subirse a git** | `vps/antigravity_vps_key` empezaba con `-----BEGIN OPENSSH PRIVATE KEY-----` | Añadida al `.gitignore` junto a `*_vps_key`, `id_rsa`, `*.key` |
| 11 | Clave de Groq hardcodeada en el código | — | Eliminada, se lee del `.env` |

#### Extracción de texto

| # | Problema | Causa real | Solución |
|---|---|---|---|
| 12 | Groq devolvía error | `llama3-8b-8192` fue **retirado** | `llama-3.1-8b-instant` |
| 13 | El lugar era basura (*"en el año 2024"*) | Regex `/en\s+([^,\n]{3,50})/` demasiado permisiva | Lista negra `LUGAR_INVALIDO` |
| 14 | `📍 Iglesia Catedral` daba `null` | El emoji de ubicación no estaba en el regex | Añadido 📍 |
| 15 | Títulos genéricos (*"Facebook"*, *"Ordner – Google Drive"*) | Se usaba el `<title>` tal cual | Lista `TITULO_GENERICO` + respaldo desde el caption |
| 16 | Fecha tomada del artículo, no del evento | Se usaba `article:published_time` | Prioridad a JSON-LD y al afiche |

#### Navegador (Puppeteer)

| # | Problema | Causa real | Solución |
|---|---|---|---|
| 17 | Instagram devolvía **HTTP 403** | Bloquea la descarga directa sin sesión | Captura a nivel de red con `page.on("response")` |
| 18 | **Dejaron de funcionar TODAS las visitas** | Se puso `await` dentro de un `page.evaluate` no-asíncrono | Corregido. **Lección:** las 52 pruebas unitarias no lo detectaron porque prueban funciones puras, no navegación real |

#### Build del sitio

| # | Problema | Causa real | Solución |
|---|---|---|---|
| 19 | **`next build` crasheaba EN SILENCIO** (exit 1, log de 414 bytes, sin mensaje) | `lib/fechas.ts` usa `import "server-only"` y se importaba desde un componente **cliente** | Usar `lib/fechasCliente.ts`. Diagnóstico: `git stash push -u -- <archivos>` + build + `git stash pop` |

#### Visión artificial y carruseles

| # | Problema | Causa real | Solución |
|---|---|---|---|
| 20 | `gemini-2.5-flash` daba 404 | Modelo **retirado** para keys nuevas | `gemini-flash-lite-latest` (el más estable) + cascada |
| 21 | Del carrusel solo llegaba **1 foto de 11** | Carrera asíncrona: se leía el array **antes** de que terminaran las descargas | `Promise.allSettled(capturasPendientes)` |
| 22 | **Instagram NO descarga las fotos del carrusel por red** | Solo pide la foto que muestra en ese momento; las demás solo existen en el JSON | `fotosDelCarrusel()` lee `carousel_media` y las baja del CDN. **9/9 fotos** |
| 23 | Gemini devolvía **HTTP 400** y se subía basura a Bunny | `image/x.fb.keyframes` **no es una foto**, es un sprite de la interfaz | Lista blanca `TIPOS_IMAGEN_REALES` + `esRecursoDeInterfaz()` |
| 24 | Gemini devolvía **HTTP 400** en otras fotos | **No acepta `image/avif`** | `FORMATOS_VALIDOS` en `vision.js` |
| 25 | 🔴 **El dibujo de la política de cookies de Facebook se publicaba como afiche del evento** (11 de 15 posts) | Existía un respaldo que tomaba *"la imagen más pesada"* de la red, y la de la pantalla de cookies pesaba 40 KB | Respaldo **eliminado** + detección de muros de login. **Mejor nada que una mentira** |
| 26 | Lugar basura: `"Acaba el Mapa"`, `"de Cultura continúa fortaleciendo…"` | Se leía del texto visible de páginas que **no son el evento** (aviso de cookies de YouTube) | Solo se lee si la página expuso metadatos reales + rechazo de frases cortadas |
| 27 | La cola de moderación se llenaba de filas vacías | Se creaba post aunque no hubiera **ni título, ni fecha, ni lugar, ni foto** | Descarte automático en `extractAndProcessUrls` |

#### Del entorno de trabajo

| # | Problema | Causa real | Solución |
|---|---|---|---|
| 28 | `ssh "... \"comillas\" ..."` desde PowerShell fallaba con *"unexpected EOF"* | Anidamiento de comillas de PowerShell + bash | **Usar scripts `.sh` subidos por `scp`** |
| 29 | Un `exit 1` sin mensaje parecía otra cosa | PowerShell **se traga el stderr** al redirigir con `*>` | Escribir el error a un archivo + `AbortSignal.timeout()` |
| 30 | Los cambios en el `.env` no surtían efecto | `docker restart` **no recarga variables de entorno** | `docker compose up -d` (recrea) |
| 31 | Se perdían los logs de prueba | `docker restart` **borra `/tmp`** | Redirigir a disco del host: `docker exec X cmd > /root/log.txt` |
| 32 | El `grep` de "errores" devolvía megabytes | El **base64** de las imágenes contiene las cadenas `error`, `403`, `fall` | Recortar siempre con `cut -c1-160` |

---

### 6.2 🔴 PROBLEMAS PENDIENTES

#### 🔴 Críticos

**P1 — Solo se procesa el 22% de los mensajes**

Medido sobre 50 mensajes reales: solo **11** llegan a procesarse.

Causa raíz (`poller.js`):

```js
const urls = texto ? extractUrls(texto) : [];
if (urls.length > 0) {          // ← descarta el 78% restante
  posts = await extractAndProcessUrls(texto, jid, prisma);
}
```

| Sub-problema | Mensajes de 50 perdidos |
|---|---|
| **P1.a** Mensaje de texto **sin enlace** | 2 |
| **P1.b** `imageMessage` sin caption (afiche pegado) | 7 |
| **P1.c** `documentMessage` (PDF de programación) | 2 |
| **P1.d** `videoMessage` con caption sin enlace | 1 |
| **P1.e** `audioMessage` | 2 |

> El caso **P1.a** es el más absurdo de perder: *"Sábado 4 de octubre, 20:00,
> Teatro Bolívar"* no necesita visitar ninguna página. `extraerFechaDeTexto()`,
> `extraerHoraDeTexto()` y `extraerLugarDeTexto()` ya existen y están probados.

**P2 — La confianza está mal calculada y ordena al revés**

La fórmula actual (`url-extractor.js`):

```js
let confianza = 0;
if (eventoJsonLd) confianza += 0.4;
if (fuentes.fecha === "json-ld") confianza += 0.2;
else if (fuentes.fecha === "caption") confianza += 0.1;   // ← "afiche" NO suma
if (fuentes.lugar === "json-ld") confianza += 0.15;
else if (fuentes.lugar === "caption") confianza += 0.1;   // ← "afiche" NO suma
if (imagenUrl) confianza += 0.1;   // ← es el og:image, NO la foto descargada
if (titulo) confianza += 0.1;
if (descripcion) confianza += 0.05;
```

**El afiche —que es la fuente MÁS confiable para fecha y lugar— aporta
CERO puntos.**

Consecuencia real y medida: el post *"Exposición pictórica «Entre lo concreto
y lo invisible»"*, que tenía los **4 campos completos** con todo leído del
afiche, sacó **0.25**. Y un post incompleto sacó **0.35**. Como `/admin` ordena
por `confianzaIA desc`, **el post completo aparece DEBAJO de los incompletos.**

Además `imagenUrl` es la URL de OpenGraph: cuando el carrusel funciona y hay 9
fotos descargadas, **tampoco suma**.

**P3 — Enlaces `facebook.com/share/...` son irrecuperables**

Probado: redirigen a `/login`. La página descargada es *"Log into Facebook"*
con **0 etiquetas `og:`, 0 JSON-LD, 0 `<video>`**. El oEmbed público de Meta
ya no existe. Afecta a ~40% del corpus real.

#### 🟠 Importantes

| # | Problema | Detalle |
|---|---|---|
| **P4** | **Se pueden perder mensajes para siempre** | `SCRAPE_PAGINAS=1` → solo se miran los **últimos 50** mensajes cada 15 min. Si el grupo recibe más de 50 en ese lapso, los más viejos caen fuera de la ventana y **nunca** se procesan |
| **P5** | **Duplicados por URL distinta** | El mismo evento compartido con 2 enlaces crea 2 posts (medido: `#9=#12`, `#8=#10`). El dedupe solo compara URL |
| **P6** | **Títulos que son párrafos** | Si el mensaje empieza con una frase larga, ese es el título, **cortado a 255 caracteres a mitad de palabra** |
| **P7** | **`esMensajeRelevante()` nunca se dispara** | Busca `messageType === "senderKeyDistributionMessage"`, pero Evolution reporta **`"unknown"`**. No causa daño (esos mensajes no tienen texto), pero el filtro no hace lo que cree |
| **P8** | **`multimedia` → `Evento` sin probar en producción** | El código está escrito y compila, pero no se aprobó ningún post con carrusel para verificarlo |
| **P9** | **El panel no está desplegado** | La tira de miniaturas del carrusel y el traslado de fotos al evento existen **solo en local**, no en Vercel |

#### 🟡 Menores

| # | Problema | Detalle |
|---|---|---|
| **P10** | Se guardan imágenes **AVIF** | Soporte irregular en navegadores viejos. Se podrían convertir a JPEG al subirlas |
| **P11** | **Sin carpeta de migraciones** | El esquema se aplica a mano con `scripts/ensure-schema.js`. Peligroso si alguien recrea la base |
| **P12** | **`.env` del repo con credenciales reales** | BD, Groq, DeepSeek, Bunny y Evolution. Deberían moverse a `.env.local` y **rotarse** |
| **P13** | **Sin reintentos** | Si falla la extracción de una URL, ese mensaje se marca como procesado y **no se vuelve a intentar nunca** |
| **P14** | Títulos cortados a mitad de palabra | `.slice(0, 255)` sin buscar un límite natural |
| **P15** | Sin aviso de enlaces fallidos | Los enlaces ilegibles se descartan en silencio; el moderador no se entera de que existieron |

---

### 6.3 Riesgo latente (no es un bug, pero vigilar)

| Situación | Por qué vigilar |
|---|---|
| **Cupo de Gemini** | La cuenta gratuita se agota (HTTP 429) y los `flash` dan 503. La cascada lo mitiga, pero con muchos posts podría alcanzar el límite |
| **Bloqueo de IP del VPS** | Instagram/Facebook podrían bloquear la IP por scraping. Hoy funciona, pero es frágil |
| **Caducidad de la sesión de Evolution** | El estado es `open`. Si se cae la sesión de WhatsApp, el escaneo deja de funcionar sin avisar fuerte |

---

## 7. Calidad medida

Escaneo limpio del 2026-09-24 sobre los 3 grupos reales:

| Métrica | Antes | Ahora |
|---|---|---|
| Posts creados | 15 (3 vacíos) | 12 (0 vacíos) |
| Título + fecha + lugar | 4/15 = 27% | **9/12 = 75%** |
| Con imagen **real** | 3 (11 eran el dibujo de cookies) | **4/4 reales, 0 repetidas** |
| Lugares basura | 2 | **0** |

---

## 8. Ideas para mejorar (abierto a tu criterio)

### Alto impacto

1. **🔴 Procesar mensajes SIN enlace.** Es la mejora más rentable: haría pasar
   el bot de ver el **22% al ~60%** de los mensajes.

   - **Texto sin enlace:** no hay que visitar nada. Con `extraerFechaDeTexto()`,
     `extraerHoraDeTexto()` y `extraerLugarDeTexto()` (que ya existen y están
     probados) se puede sacar el evento del propio mensaje.
   - **Fotos pegadas:** bajar la imagen del mensaje con Evolution
     (`getBase64FromMediaMessage`) y mandarla directo a Gemini. El código de
     visión ya está hecho, solo cambia de dónde salen los bytes.

2. **Procesar los PDF de programación.** Un PDF de la agenda cultural mensual
   trae **muchos** eventos dentro. Sería el mayor salto en cantidad de eventos
   por mensaje. Requiere extraer texto del PDF y partirlo en eventos.

3. **Deduplicar por contenido, no por URL.** Ya existe el algoritmo de hash de
   imágenes (`diagnostico-imagenes-iguales.js`). Extenderlo a "mismo título +
   fecha + lugar → mismo evento" mata los duplicados (`#9=#12`).

4. **Comando de re-proceso.** Poder reprocesar un mensaje concreto sin borrar
   la tabla entera, para probar mejoras sin esperar 15 minutos.

5. **Arreglar la fórmula de confianza (P2).** Es un cambio de 6 líneas y
   corrige que el mejor post aparezca último en `/admin`. Hay que dar puntos a
   `fuentes.fecha === "afiche"` y `fuentes.lugar === "afiche"`, y contar las
   fotos descargadas en vez de `imagenUrl`.

### Medio

5. **Detectar la categoría** (música, teatro, arte…) y el precio con la IA.
   `lib/clasificarEvento.ts` ya existe en el sitio.

6. **Leer el `video_versions` del JSON** para bajar el video de un Reel de
   Instagram, no solo la miniatura.

7. **Transcribir los audios.** Groq tiene `whisper`: se transcribe la nota de
   voz y luego se extrae el evento del texto. En grupos de cultura es común
   mandar audio explicando el evento.

8. **Extraer el rango de fechas** para eventos que duran varios días.
   `extraerRangoDeTexto` ya existe pero no se explota a fondo.

### Ideas de producto

9. **Aviso cuando el bot no puede leer un enlace.** Hoy el post se descarta en
   silencio. Un contador de "enlaces que fallaron" en `/admin` te diría qué
   grupos comparten contenido inaccesible.

10. **Priorizar por confianza** en la cola: ya se ordena por `confianzaIA`, pero
    se podría mostrar arriba "listo para aprobar de un clic".

11. **Recordatorio de completar datos.** Cuando falta la fecha, ofrecer un
    formulario en línea en `/admin` en vez de mandar a `/publicar`.

---

## 9. Configuración activa

| Variable | Valor | Para qué |
|---|---|---|
| `GRUPOS_SCRAPING` | 3 grupos | Cuáles escanear (vacío = apagado) |
| `SCRAPE_INTERVALO_MIN` | 15 | Frecuencia |
| `SCRAPE_PAGINAS` | 1 | Páginas de 50 mensajes |
| `MAX_FOTOS_CARRUSEL` | 10 | Fotos del carrusel a descargar y guardar |
| `MAX_FOTOS_AFICHE` | 10 | Fotos que se mandan a la IA |
| `GEMINI_API_KEYS` | 2 keys | Cascada de visión |
| `GEMINI_MODELOS` | 4 modelos | Orden de intentos |
| `REHOSPEDAR_IMAGENES` | true | Subir a Bunny |
| `VERBOSE` | — | Log detallado |

> ⚠️ `docker-compose.yml` solo pasa las variables **listadas explícitamente**.
> Si agregás una al `.env`, hay que añadirla ahí también.

---

## 10. Garantías de seguridad

- ✅ **Solo lectura.** No envía mensajes, no reacciona, no marca como leído.
- ✅ **No toca webhooks.** La instancia `cesar-comercial` tiene ocupado su único
  webhook (`:8095/webhook/cliente`); registrarse lo habría roto.
- ✅ **No publica solo.** Todo pasa por `/admin`.
- ✅ **No inventa datos.** Si falta, queda `null` y se avisa.
- ✅ **Nunca se cae.** Visión y descargas devuelven `null` en vez de lanzar.
