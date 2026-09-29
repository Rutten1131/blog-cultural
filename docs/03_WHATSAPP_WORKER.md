# 03. WhatsApp Worker — Extracción y Detección Automática

> **Ubicación en el VPS:** `/root/agenda-cultural/vps/whatsapp-worker`  
> **Contenedor Docker:** `whatsapp-worker` (Puerto 8083)  
> **Tecnología:** Node.js (Express), Puppeteer, Gemini Vision, Bunny CDN API, Prisma 7 Client.

---

## 1. Misión y Reglas de Extracción
Operar como un recolector silencioso dentro de los grupos comunitarios de WhatsApp de Loja. Es un lector en modo solo-lectura:
- **No interactúa:** No escribe, no reacciona, no altera el flujo del grupo.
- **No inventa datos:** Si un campo es dudoso, se omite.
- **Umbral de Auto-Aprobación Confirmado:**
  - El sistema utiliza un umbral de **confianza IA ≥ 0.50** (`autoPublicarSiCompleto`).
  - Si el evento trae título identificable, fecha futura válida, lugar físico real e imagen nítida en Bunny CDN, pasa **automáticamente a estado APROBADO** tanto en la web como para su despacho a redes sociales.

---

## 2. Componentes Clave (`vps/whatsapp-worker/lib/`)

- `poller.js`: Consulta a Evolution API cada 15 minutos en busca de mensajes recientes en los grupos configurados.
- `url-extractor.js`: Procesa enlaces de Instagram (extrayendo carruseles completos del JSON `carousel_media`), Facebook (evadiendo muros de login) y ejecuta la función `autoPublicarSiCompleto()`.
- `gemini-vision.js`: Extrae fecha, hora, lugar y título de las imágenes de afiches compartidas en el grupo.
- `bunny-uploader.js`: Re-hospeda las imágenes en Bunny CDN (`culturallojablog.b-cdn.net`) para independizarse de los tokens temporales de Meta.
- `redes-sociales-worker.js`: Módulo que construye el payload y contacta al Puente de Redes Sociales en Vercel para programar el post en Facebook e Instagram.

---

## 3. Disparo a Redes Sociales

Cuando `autoPublicarSiCompleto()` crea el evento con estado `APROBADO`, ejecuta inmediatamente:
```javascript
const resultadoRedes = await programarPublicacionEnRedes(nuevoEvento.id);
```
Este módulo consulta la tabla `publicaciones_redes_sociales` para evitar duplicados y despacha la solicitud al endpoint:
`https://redes-sociales-l5q4.vercel.app/api/external/agenda-cultural/schedule`.
