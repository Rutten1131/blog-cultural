/**
 * Worker de WhatsApp — Agenda Cultural Loja
 *
 * Escucha webhooks de Evolution API del grupo "Eventos de Loja".
 * Extrae URLs, las visita, determina si son eventos y guarda en la BD.
 * NO envía msgs de vuelta al grupo (modo solo escucha).
 */

require("dotenv").config({ path: "./.env" });
const express = require("express");
const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { extractAndProcessUrls } = require("./lib/url-extractor");
const { gruposConfigurados, escanearTodo } = require("./lib/poller");
const { listarGrupos, estadoInstancia } = require("./lib/evolution-client");

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const url = new URL(databaseUrl);

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  });

  return new PrismaClient({ adapter });
}

const app = express();
const prisma = createPrismaClient();

const PORT = process.env.PORT || 8083;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "cesar-comercial";

// ─── Middleware ────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "whatsapp-worker",
    timestamp: new Date().toISOString(),
  });
});

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
      return res.json({ received: false, reason: "mensaje sin texto" });
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

// ─── Endpoint para activar scraping manual ────────────────
app.post("/scrape/manual", async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "urls array required" });
    }

    const results = await extractAndProcessUrls(urls.join("\n"), "manual", prisma);
    res.json({ processed: results.length, results });
  } catch (error) {
    console.error("[WhatsApp] Error en scrape manual:", error);
    res.status(500).json({ error: "internal error" });
  }
});

// ─── Listar posts pendientes ───────────────────────────────
app.get("/posts", async (req, res) => {
  try {
    const { estado, limit = 50, offset = 0 } = req.query;
    const where = estado ? { estado } : {};

    const posts = await prisma.postSocial.findMany({
      where,
      orderBy: { fechaDeteccion: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.postSocial.count({ where });

    res.json({ posts, total });
  } catch (error) {
    console.error("[WhatsApp] Error listando posts:", error);
    res.status(500).json({ error: "internal error" });
  }
});

// ─── Actualizar estado de un post ──────────────────────────
app.patch("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, moderationComentario, moderadoPor } = req.body;

    const post = await prisma.postSocial.update({
      where: { id: parseInt(id) },
      data: {
        estado,
        moderationComentario,
        moderadoPor,
        moderadoAt: estado ? new Date() : undefined,
      },
    });

    res.json(post);
  } catch (error) {
    console.error("[WhatsApp] Error actualizando post:", error);
    res.status(500).json({ error: "internal error" });
  }
});

// ─── Escaneo de grupos (SOLO LECTURA) ─────────────────────
// Lee los mensajes del grupo por API. No escribe en WhatsApp.

app.get("/grupos", async (req, res) => {
  const configurados = gruposConfigurados();

  try {
    const disponibles = await listarGrupos();
    res.json({
      instancia: EVOLUTION_INSTANCE,
      configurados,
      disponibles,
    });
  } catch (error) {
    res.status(500).json({
      instancia: EVOLUTION_INSTANCE,
      configurados,
      error: error.message,
    });
  }
});

app.post("/scrape/grupos", async (req, res) => {
  try {
    const paginas = Number(req.body?.paginas) || Number(process.env.SCRAPE_PAGINAS) || 2;
    const offset = Number(req.body?.offset) || 50;

    const resultado = await escanearTodo(prisma, { paginas, offset });
    res.json(resultado);
  } catch (error) {
    console.error("[WhatsApp] Error escaneando grupos:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Arrancar ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[WhatsApp] Worker escuchando en puerto ${PORT}`);
  console.log(`[WhatsApp] Instancia de Evolution: ${EVOLUTION_INSTANCE}`);
  console.log("[WhatsApp] Modo: SOLO LECTURA (no envía mensajes ni toca webhooks)");

  // NOTA: a propósito NO se registra ningún webhook aquí.
  // La instancia `cesar-comercial` ya tiene su webhook ocupado por otra
  // aplicación (http://127.0.0.1:8095/webhook/cliente) y registrarlo
  // lo sobrescribiría, rompiendo esa app.
  // Este worker lee los mensajes por API, sin interferir.

  const grupos = gruposConfigurados();
  if (grupos.length === 0) {
    console.warn(
      "[WhatsApp] GRUPOS_SCRAPING está vacío: no se escaneará ningún grupo."
    );
  } else {
    console.log(`[WhatsApp] Grupos configurados: ${grupos.length}`);
    for (const g of grupos) console.log(`[WhatsApp]   - ${g}`);
  }

  // Verificar credenciales de Evolution al arrancar, para no fallar en silencio.
  estadoInstancia()
    .then((r) => console.log(`[WhatsApp] Evolution OK: ${JSON.stringify(r)}`))
    .catch((err) =>
      console.error(`[WhatsApp] ERROR de conexión con Evolution: ${err.message}`)
    );

  // Escaneo periódico de los grupos configurados.
  const intervaloMin = Number(process.env.SCRAPE_INTERVALO_MIN) || 15;
  const cronExpr = `*/${intervaloMin} * * * *`;

  cron.schedule(cronExpr, async () => {
    console.log(`[WhatsApp] Escaneo programado (cada ${intervaloMin} min)...`);
    try {
      const r = await escanearTodo(prisma, {
        paginas: Number(process.env.SCRAPE_PAGINAS) || 2,
      });
      if (r.omitido) {
        console.warn(`[WhatsApp] Escaneo omitido: ${r.motivo}`);
      } else {
        console.log(
          `[WhatsApp] Escaneo terminado en ${r.duracionMs} ms — ` +
            `${r.totalPostsCreados} post(s) nuevo(s)`
        );
      }
    } catch (err) {
      console.error("[WhatsApp] Error en escaneo programado:", err.message);
    }
  });

  // Primera pasada al arrancar (sin bloquear el arranque del servidor).
  setTimeout(() => {
    escanearTodo(prisma, { paginas: Number(process.env.SCRAPE_PAGINAS) || 2 })
      .then((r) => {
        if (r.omitido) console.warn(`[WhatsApp] Escaneo inicial omitido: ${r.motivo}`);
        else console.log(`[WhatsApp] Escaneo inicial: ${r.totalPostsCreados} post(s)`);
      })
      .catch((err) => console.error("[WhatsApp] Error en escaneo inicial:", err.message));
  }, 5000);
});