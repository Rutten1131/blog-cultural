import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerMemoriaSesion, sincronizarResumenSiCorresponde } from "@/lib/chat/chatMemory";
import { clasificarIntencionUsuario } from "@/lib/chat/chatRouter";
import { chatCache, chatRateLimiter } from "@/lib/chat/chatCache";

export const dynamic = "force-dynamic";

function nowEcuador(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Guayaquil" }));
}

function startOfDayEcuador(d: Date): Date {
  const local = new Date(d);
  local.setHours(0, 0, 0, 0);
  return local;
}

function extraerRangoFecha(query: string): { desde: Date; hasta: Date; etiqueta: string } | null {
  const q = query.toLowerCase();
  const hoy = nowEcuador();
  const anio = hoy.getFullYear();

  if (q.includes("mañana")) {
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const desde = startOfDayEcuador(manana);
    const hasta = new Date(desde);
    hasta.setHours(23, 59, 59, 999);
    return { desde, hasta, etiqueta: manana.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" }) };
  }

  if (q.includes("hoy") || q.includes("esta noche")) {
    const desde = startOfDayEcuador(hoy);
    const hasta = new Date(desde);
    hasta.setHours(23, 59, 59, 999);
    return { desde, hasta, etiqueta: "hoy" };
  }

  if (q.includes("fin de semana") || q.includes("finde")) {
    const dia = hoy.getDay();
    const difSab = dia <= 6 ? (6 - dia) : 0;
    const sab = new Date(hoy);
    sab.setDate(sab.getDate() + difSab);
    const dom = new Date(sab);
    dom.setDate(dom.getDate() + 1);
    const desde = startOfDayEcuador(sab);
    const hasta = new Date(startOfDayEcuador(dom));
    hasta.setHours(23, 59, 59, 999);
    return { desde, hasta, etiqueta: "este fin de semana" };
  }

  if (q.includes("esta semana")) {
    const desde = startOfDayEcuador(hoy);
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 7);
    hasta.setHours(23, 59, 59, 999);
    return { desde, hasta, etiqueta: "esta semana" };
  }

  if (q.includes("proxima semana") || q.includes("próxima semana") || q.includes("la otra semana") || q.includes("siguiente semana")) {
    const desde = startOfDayEcuador(hoy);
    desde.setDate(desde.getDate() + 7);
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 7);
    hasta.setHours(23, 59, 59, 999);
    return { desde, hasta, etiqueta: "la próxima semana" };
  }

  if (q.includes("semana") && !q.includes("fin de semana") && !q.includes("finde")) {
    const desde = startOfDayEcuador(hoy);
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 7);
    hasta.setHours(23, 59, 59, 999);
    return { desde, hasta, etiqueta: "esta semana" };
  }

  const MESES: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };

  const matchDiaMes = q.match(/(?:el\s+)?(?:d[ií]a\s+)?(\d{1,2})\s+de\s+(\w+)/);
  if (matchDiaMes) {
    const dia = parseInt(matchDiaMes[1], 10);
    const mesNombre = matchDiaMes[2];
    const mes = MESES[mesNombre];
    if (mes !== undefined && dia >= 1 && dia <= 31) {
      const desde = new Date(anio, mes, dia, 0, 0, 0, 0);
      const hasta = new Date(anio, mes, dia, 23, 59, 59, 999);
      return { desde, hasta, etiqueta: desde.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" }) };
    }
  }

  const matchSoloDia = q.match(/\bel\s+(?:d[ií]a\s+)?(\d{1,2})\b/);
  if (matchSoloDia) {
    const dia = parseInt(matchSoloDia[1], 10);
    if (dia >= 1 && dia <= 31) {
      const mes = hoy.getMonth();
      const desde = new Date(anio, mes, dia, 0, 0, 0, 0);
      const hasta = new Date(anio, mes, dia, 23, 59, 59, 999);
      return { desde, hasta, etiqueta: desde.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" }) };
    }
  }

  for (const [nombre, idx] of Object.entries(MESES)) {
    if (q.includes(nombre)) {
      const desde = new Date(anio, idx, 1, 0, 0, 0, 0);
      const hasta = new Date(anio, idx + 1, 0, 23, 59, 59, 999);
      return { desde, hasta, etiqueta: "en " + nombre };
    }
  }

  return null;
}

function extraerIntencionBusqueda(query: string) {
  const q = query.toLowerCase();

  // Detección de temporalidad especial
  const quierePasados =
    q.includes("pasad") || q.includes("anteriore") || q.includes("hubo") ||
    q.includes("ayer") || q.includes("historial") || q.includes("archivo");

  const quiereHoy =
    q.includes("hoy") || q.includes("esta noche") || q.includes("ahora") ||
    q.includes("en este momento");

  // Extracción de palabras clave de temática / género / lugar
  // Quitamos stopwords y palabras genéricas del chat
  const stopwords = new Set([
    "hay", "algo", "de", "un", "una", "unos", "unas", "el", "la", "los", "las",
    "en", "para", "por", "con", "que", "qué", "donde", "dónde", "cuando", "cuándo",
    "cual", "cuál", "como", "cómo", "evento", "eventos", "actividad", "actividades",
    "hacer", "puedo", "podemos", "ir", "recomiendas", "recomiéndame", "dime", "cuenta",
    "sobre", "hola", "buenas", "buenos", "dias", "días", "tardes", "noches", "porfavor",
    "favor", "este", "esta", "estos", "estas", "mes", "semana", "dia", "día", "loja"
  ]);

  const palabras = q
    .replace(/[^a-záéíóúñ0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  return {
    quierePasados,
    quiereHoy,
    palabrasClave: palabras,
  };
}

/** Normaliza texto para comparar nombres sin depender de acentos ni mayúsculas */
function sinAcentos(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Intenta extraer el nombre del usuario cuando responde a una pregunta sobre su nombre */
function extraerNombreUsuario(mensaje: string): string | null {
  const m = mensaje.trim();
  if (m.length > 50 || m.length < 2) return null;

  // Lista de palabras comunes que NUNCA son nombres
  const palabrasComunes = new Set([
    "hola", "buenas", "buenos", "dias", "días", "tardes", "noches",
    "gracias", "hotel", "hoteles", "restaurante", "restaurantes", "cafeteria", "cafetería",
    "habitacion", "habitación", "habitaciones", "familiar", "matrimonial", "suite", "doble", "simple",
    "precio", "precios", "cuanto", "cuánto", "costo", "tarifa", "valor", "nada", "ninguno", "ninguna",
    "nadie", "ver", "donde", "dónde", "cuando", "cuándo", "bueno", "si", "sí", "no", "ok", "okay",
    "porfavor", "por favor", "ayuda", "info", "informacion", "información", "menu", "menú", "carta",
    "plato", "comida", "desayuno", "almuerzo", "cena", "reservar", "reserva", "whatsapp", "fotos",
    "galeria", "ubicacion", "ubicación", "servicios", "estrellas"
  ]);

  // Patrón 1: "Me llamo Carlos", "Soy Maricela", "Mi nombre es Juan Pérez", "A nombre de Carlos"
  const patronesPrefijo = [
    /(?:me\s+llamo|mi\s+nombre\s+es|soy|nombre\s+es)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}){0,2})/i,
    /^a\s+nombre\s+de\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}){0,2})/i,
  ];

  for (const regex of patronesPrefijo) {
    const match = m.match(regex);
    if (match && match[1]) {
      const candidato = match[1].trim();
      const primeraPalabra = candidato.split(/\s+/)[0].toLowerCase();
      if (!palabrasComunes.has(primeraPalabra)) {
        return candidato
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    }
  }

  // Patrón 2: El usuario puso simplemente su nombre: "Maricela", "Carlos Gómez", etc.
  // 1 a 3 palabras puras de letras
  if (/^[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,20}){0,2}$/.test(m)) {
    const primeraPalabra = m.split(/\s+/)[0].toLowerCase();
    if (!palabrasComunes.has(primeraPalabra) && !palabrasComunes.has(m.toLowerCase())) {
      return m
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }

  return null;
}

/**
 * Mensaje de respaldo del flujo de venta, un paso por vez (por si la IA no responde).
 * Se construye SOLO con los datos cargados del aliado en el superadmin.
 */
function plantillaVentaPaso(
  aliado: {
    nombre: string;
    tipo?: string;
    estrellas: number | null;
    ubicacion: string;
    descripcion: string;
    numeroCuartos: number | null;
    servicios: string | null;
    rangoPrecio: string | null;
    telefono: string | null;
  },
  habitaciones: { nombre: string; precio: string | null; caracteristicas: string | null }[],
  paso: number,
  habitacionElegida?: { nombre: string; precio: string | null; caracteristicas: string | null } | null
): string {
  const estrellas = aliado.estrellas ? ` ${"⭐".repeat(Math.min(5, Math.max(1, aliado.estrellas)))}` : "";
  const categorias = habitaciones.map((h) => `${h.nombre}${h.precio ? ` (${h.precio})` : ""}`);
  const esHospedaje = !aliado.tipo || aliado.tipo === "HOSPEDAJE";
  const esCafeteria = aliado.tipo === "CAFETERIA";
  const palabraAliado = esHospedaje ? "hotel" : esCafeteria ? "cafetería" : "restaurante";
  const otroAliado = esHospedaje ? "otro hotel" : esCafeteria ? "otra cafetería" : "otro restaurante";
  const palabraCategorias = esHospedaje
    ? "tipos de habitación"
    : esCafeteria
    ? "especialidades de la casa"
    : "opciones del menú";

  switch (paso) {
    case 2:
      return `Contamos con ${habitaciones.length} ${palabraCategorias}: ${categorias
        .slice(0, 3)
        .join(" · ")}. ¿Cuál te llama más la atención?`;
    case 3:
      return `Los precios van así: ${categorias.join(" · ")}. ${
        aliado.rangoPrecio ? `En general ${aliado.rangoPrecio}. ` : ""
      }¿Querés que te cuente qué incluye cada una?`;
    case 4:
      if (habitacionElegida) {
        return `¡Excelente elección! La ${habitacionElegida.nombre} tiene un valor de ${habitacionElegida.precio || "precio regular"}${habitacionElegida.caracteristicas ? ` (${habitacionElegida.caracteristicas})` : ""}. ${aliado.telefono ? "Podemos conectarte directamente por WhatsApp con ellos para consultar fechas o reservar. " : ""}¿Te gustaría que te facilitemos la reserva?`;
      }
      return `Está en ${aliado.ubicacion}. ${
        esHospedaje && aliado.numeroCuartos ? `${aliado.numeroCuartos} habitaciones en total. ` : ""
      }${aliado.servicios ? `Incluye ${aliado.servicios}. ` : ""}¿Te gustaría reservar?`;
    case 5:
      return `${aliado.telefono ? "Escribinos por WhatsApp y te aseguramos el lugar. " : ""}${
        aliado.rangoPrecio ? `Precios ${aliado.rangoPrecio}. ` : ""
      }¿Reservamos ahora o preferís que te muestre ${otroAliado}?`;
    default:
      return `¡Excelente elección! ${aliado.nombre}${estrellas} te espera en ${aliado.ubicacion}. Tiene ${
        habitaciones.length || "varias"
      } ${palabraCategorias}. ¿Querés ver ${esHospedaje ? "las habitaciones" : "las opciones"} o los precios?`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId, ubicacion } = body as {
      messages: any[];
      sessionId?: string;
      ubicacion?: {
        lat: number;
        lng: number;
        ciudad?: string;
        zona?: string;
        direccionDetallada?: string;
        provincia?: string;
        pais?: string;
      };
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Mensajes no válidos" }, { status: 400 });
    }

    // Rate Limiting por IP (Protección de cuotas y costos DeepSeek)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    const limitCheck = chatRateLimiter.check(ip);
    if (!limitCheck.permitido) {
      return NextResponse.json(
        {
          texto: `Has enviado varios mensajes muy rápido. ⏳ Por favor espera ${limitCheck.resetEnSegundos} segundos para continuar descubriendo Loja.`,
          eventos: [],
          aliados: [],
          atractivos: [],
          respuestasRapidas: [],
        },
        { status: 429, headers: { "Retry-After": String(limitCheck.resetEnSegundos) } }
      );
    }

    const lastUserMessage: string = messages[messages.length - 1]?.content || "";
    const lowerUser = lastUserMessage.toLowerCase();

    // 1. Obtener Memoria de la Sesión (Últimos 10 mensajes y Resumen consolidado)
    let memoriaSesion = { resumen: null as string | null, mensajesRecientes: [] as any[], totalMensajes: 0 };
    if (sessionId) {
      memoriaSesion = await obtenerMemoriaSesion(sessionId);
    }

    // 1b. Obtener nombre del usuario de la sesión (Lead Qualification)
    let nombreUsuarioSesion: string | null = null;
    if (sessionId) {
      const sesionDb = await prisma.chatSession.findUnique({
        where: { sessionId },
        select: { nombreUsuario: true },
      }).catch(() => null);
      nombreUsuarioSesion = sesionDb?.nombreUsuario ?? null;
    }

    // Texto de contexto inmediato (los últimos mensajes)
    const ultimosMensajesTexto = messages
      .slice(-4)
      .map((m: any) => m.content || m.text || "")
      .join(" ");

    // 2. Ejecutar ROUTER de Intenciones
    const decisionRouter = clasificarIntencionUsuario(
      lastUserMessage,
      memoriaSesion.resumen,
      ultimosMensajesTexto
    );

    // Guardar/actualizar sesión CRM en background
    const ua = req.headers.get("user-agent") || null;

    const nombreDetectadoEnMensaje = !nombreUsuarioSesion ? extraerNombreUsuario(lastUserMessage) : null;
    if (nombreDetectadoEnMensaje) {
      nombreUsuarioSesion = nombreDetectadoEnMensaje;
    }

    if (sessionId) {
      prisma.chatSession.upsert({
        where: { sessionId },
        create: {
          sessionId,
          ubicacionLat: ubicacion?.lat ?? null,
          ubicacionLng: ubicacion?.lng ?? null,
          zonaDetectada: ubicacion?.zona ?? null,
          direccionDetallada: ubicacion?.direccionDetallada ?? null,
          ciudad: ubicacion?.ciudad ?? null,
          provincia: ubicacion?.provincia ?? null,
          pais: ubicacion?.pais ?? null,
          userAgent: ua ? ua.slice(0, 500) : null,
          ipAddress: ip ? ip.slice(0, 60) : null,
          totalMensajes: 1,
          intencionDetectada: decisionRouter.intencion,
          nombreUsuario: nombreDetectadoEnMensaje ?? null,
        },
        update: {
          ...(ubicacion?.lat && {
            ubicacionLat: ubicacion.lat,
            ubicacionLng: ubicacion.lng,
            zonaDetectada: ubicacion.zona ?? null,
            ...(ubicacion.direccionDetallada ? { direccionDetallada: ubicacion.direccionDetallada } : {}),
            ciudad: ubicacion.ciudad ?? null,
            provincia: ubicacion.provincia ?? null,
            pais: ubicacion.pais ?? null,
          }),
          ...(nombreDetectadoEnMensaje ? { nombreUsuario: nombreDetectadoEnMensaje } : {}),
          totalMensajes: { increment: 1 },
          intencionDetectada: decisionRouter.intencion,
          updatedAt: new Date(),
        },
      }).catch(() => {/* fail silently */});

      prisma.chatMessage.create({
        data: {
          sessionId,
          sender: "user",
          contenido: lastUserMessage.slice(0, 5000),
        },
      }).then(() => {
        // Disparar sincronización asíncrona de resumen si supera los 10 mensajes
        sincronizarResumenSiCorresponde(sessionId).catch(() => {/* fail silently */});
      }).catch(() => {/* fail silently */});
    }

    // 3a. RETORNO TEMPRANO: DEVOLUCIÓN DE LA PELOTA (ambiguo / contradictorio)
    if (decisionRouter.requiereRepregunta && decisionRouter.preguntaAclaratoria) {
      if (sessionId) {
        prisma.chatMessage.create({
          data: {
            sessionId,
            sender: "bot",
            contenido: decisionRouter.preguntaAclaratoria,
          },
        }).catch(() => {/* fail silently */});
      }
      return NextResponse.json({
        texto: decisionRouter.preguntaAclaratoria,
        eventos: [],
        aliados: [],
        atractivos: [],
        aliadoDetalle: null,
        ventaPaso: null,
        respuestasRapidas: [
          "🎭 Ver eventos culturales",
          "🏨 Hoteles recomendados",
          "🍽️ Restaurantes y Cafeterías",
          "🌿 Lugares para visitar en Loja"
        ],
      });
    }

    // 3a.2 CACHE HIT: Para preguntas generales o recurrentes sin hilo de venta activo
    const esConsultaCachable =
      messages.length <= 2 &&
      !memoriaSesion.resumen &&
      decisionRouter.intencion !== "VENTA_ALIADO_CONTINUAR" &&
      decisionRouter.intencion !== "WHATSAPP_HANDOFF" &&
      decisionRouter.intencion !== "AMBIGUO_CONTRADICTORIO";

    if (esConsultaCachable) {
      const cached = chatCache.get(lastUserMessage, ubicacion?.zona);
      if (cached) {
        // Cargar las entidades frescas correspondientes a los IDs cacheados
        const [cachedEventos, cachedAliados, cachedAtractivos] = await Promise.all([
          cached.eventosRecomendadosIds.length > 0
            ? prisma.evento.findMany({
                where: { id: { in: cached.eventosRecomendadosIds }, estado: "APROBADO" },
                select: { id: true, nombre: true, fecha: true, lugar: true, slug: true, imagenUrl: true, descripcion: true },
              })
            : [],
          cached.aliadosRecomendadosIds.length > 0
            ? prisma.aliado.findMany({
                where: { id: { in: cached.aliadosRecomendadosIds }, activo: true },
                include: { habitaciones: { orderBy: [{ orden: "asc" }, { id: "asc" }] } },
              })
            : [],
          cached.atractivosRecomendadosIds.length > 0
            ? prisma.atractivoCantonal.findMany({
                where: { id: { in: cached.atractivosRecomendadosIds }, activo: true },
              })
            : [],
        ]);

        if (sessionId) {
          prisma.chatMessage.create({
            data: {
              sessionId,
              sender: "bot",
              contenido: cached.texto.slice(0, 5000),
              eventosIds: cachedEventos.map((e) => e.id),
              aliadosIds: cachedAliados.map((a) => a.id),
              atractivosIds: cachedAtractivos.map((at) => at.id),
            },
          }).catch(() => {/* fail silently */});
        }

        return NextResponse.json({
          texto: cached.texto,
          eventos: cachedEventos,
          aliados: cachedAliados,
          atractivos: cachedAtractivos,
          aliadoDetalle: null,
          ventaPaso: null,
          respuestasRapidas: [
            "🎭 Ver eventos culturales",
            "🏨 Hoteles recomendados",
            "🍽️ Dónde comer en Loja",
            "🌿 Lugares para visitar"
          ],
        });
      }
    }

    // 3b. RETORNO TEMPRANO: WHATSAPP HANDOFF (alta intención de reserva)
    // Se resuelve aquí solo si no hay aliado activo en conversación;
    // si hay aliado en conversación el paso 5 del flujo de venta lo maneja mejor.
    if (decisionRouter.intencion === "WHATSAPP_HANDOFF") {
      // Buscamos el aliado más reciente mencionado en la conversación
      const aliadosMenciaonados = await prisma.aliado.findMany({
        where: { activo: true },
        select: { id: true, nombre: true, telefono: true, tipo: true },
        take: 20,
      });
      const textoConversacion = sinAcentos(ultimosMensajesTexto);
      const aliadoHandoff = aliadosMenciaonados.find((a) =>
        textoConversacion.includes(sinAcentos(a.nombre))
      );

      if (aliadoHandoff?.telefono) {
        const telLimpio = aliadoHandoff.telefono.replace(/[^\d]/g, "");
        const tipoLabel = aliadoHandoff.tipo === "GASTRONOMIA" ? "restaurante" : aliadoHandoff.tipo === "CAFETERIA" ? "cafetería" : "hotel";
        const nombreIntro = nombreUsuarioSesion ? `Mi nombre es ${nombreUsuarioSesion}. ` : "";
        const mensajeWA = encodeURIComponent(
          `Hola, vengo de la Agenda Cultural Loja. ${nombreIntro}Me interesa consultar y reservar en ${aliadoHandoff.nombre}. ¿Podrían ayudarme?`
        );
        const linkWA = `https://wa.me/${telLimpio}?text=${mensajeWA}`;
        const textoHandoff = `¡Perfecto! 🎉 Te conecto directamente con ${aliadoHandoff.nombre}. Solo haz clic en el botón de WhatsApp y ya tienen todos tus datos. ¡Que lo disfrutes mucho!`;
        if (sessionId) {
          prisma.chatMessage.create({
            data: {
              sessionId,
              sender: "bot",
              contenido: textoHandoff,
              aliadosIds: [aliadoHandoff.id],
            },
          }).catch(() => {/* fail silently */});
        }
        return NextResponse.json({
          texto: textoHandoff,
          eventos: [],
          aliados: [],
          atractivos: [],
          aliadoDetalle: null,
          ventaPaso: null,
          whatsappHandoff: { link: linkWA, nombre: aliadoHandoff.nombre, tipo: tipoLabel },
          respuestasRapidas: [],
        });
      }
    }

    const ahora = nowEcuador();
    const hoyInicio = startOfDayEcuador(ahora);
    const fechaHoyStr = ahora.toLocaleDateString("es-EC", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    // El rango de fecha SOLO se calcula a partir del mensaje actual del usuario
    const rangoFecha = extraerRangoFecha(lastUserMessage);
    const intencion = extraerIntencionBusqueda(lastUserMessage);

    // Detectar si el usuario hace una pregunta referencial sobre el evento recién conversado
    // Ejemplos: "y eso de que es?", "de que se trata?", "cuentame mas", "a que hora?", "cuanto cuesta?", "donde es?"
    const esPreguntaReferencial =
      /(eso\s+de\s+qu[eé]|de\s+qu[eé]\s+(es|se\s+trata|trata)|cu[eé]ntame\s+m[aá]s|m[aá]s\s+informaci[oó]n|d[oó]nde\s+es|a\s+qu[eé]\s+hora|qui[eé]n(es)?\s+toca(n)?|cu[aá]nto\s+cuesta|precio|entrada|de\s+qu[eé]\s+va)/i.test(lowerUser) ||
      (lowerUser.length < 35 && (lowerUser.includes("eso") || lowerUser.includes("trata") || lowerUser.includes("hora") || lowerUser.includes("donde") || lowerUser.includes("dónde") || lowerUser.includes("precio")));

    // Si es pregunta referencial, buscar el último evento mencionado en los mensajes recientes del bot
    let eventoEnDiscusion: any = null;
    if (esPreguntaReferencial && messages.length > 1) {
      const botMessages = messages.filter((m: any) => m.sender === "bot" || m.role === "assistant");
      const ultimoBotMsg = botMessages[botMessages.length - 1];
      const botTexto = (ultimoBotMsg?.content || ultimoBotMsg?.text || "").toLowerCase();

      // Buscar eventos activos en la DB que hayan sido mencionados en el texto del bot
      const eventosCandidatos = await prisma.evento.findMany({
        where: { estado: "APROBADO" },
        orderBy: { fecha: "asc" },
        select: {
          id: true,
          nombre: true,
          fecha: true,
          lugar: true,
          slug: true,
          imagenUrl: true,
          descripcion: true,
        },
      });

      eventoEnDiscusion = eventosCandidatos.find((e) =>
        botTexto.includes(e.nombre.toLowerCase()) ||
        botTexto.includes(e.slug.toLowerCase()) ||
        (e.nombre.length > 5 && lowerUser.includes(e.nombre.toLowerCase()))
      );
    }

    // Si el último mensaje es cortito temático (ej: "y boleros?", "o musica?") y no es referencial, combinar con el hilo reciente
    if (!esPreguntaReferencial && intencion.palabrasClave.length <= 1 && messages.length > 1) {
      const intencionHilo = extraerIntencionBusqueda(ultimosMensajesTexto);
      intencion.palabrasClave = Array.from(new Set([...intencion.palabrasClave, ...intencionHilo.palabrasClave]));
    }

    // ─── MODO PLANIFICA TU VISITA (multi-intent) ─────────────────────────────────
    // Carga eventos próximos + hoteles + restaurantes/cafeterías en paralelo
    // para armar una respuesta coordinada y completa de un solo vistazo.
    if (decisionRouter.intencion === "PLANIFICA_VISITA") {
      const rangoVisita = extraerRangoFecha(lastUserMessage);
      const ahora2 = nowEcuador();
      const hoyInicio2 = startOfDayEcuador(ahora2);

      const [eventosVisita, hotelesVisita, gastroVisita, atractivosVisita] = await Promise.all([
        prisma.evento.findMany({
          where: {
            estado: "APROBADO",
            ...(rangoVisita
              ? { fecha: { gte: rangoVisita.desde, lte: rangoVisita.hasta } }
              : { fecha: { gte: hoyInicio2 } }),
          },
          orderBy: { fecha: "asc" },
          take: 4,
          select: { id: true, nombre: true, fecha: true, lugar: true, slug: true, imagenUrl: true, descripcion: true },
        }),
        prisma.aliado.findMany({
          where: { activo: true, tipo: "HOSPEDAJE" },
          orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
          take: 3,
          include: { habitaciones: { orderBy: [{ orden: "asc" }], take: 3 } },
        }),
        prisma.aliado.findMany({
          where: { activo: true, tipo: { in: ["GASTRONOMIA", "CAFETERIA"] } },
          orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
          take: 3,
          include: { habitaciones: { orderBy: [{ orden: "asc" }], take: 3 } },
        }),
        prisma.atractivoCantonal.findMany({ where: { activo: true }, take: 3 }),
      ]);

      const fechaLabel = rangoVisita ? rangoVisita.etiqueta : "próximos días";
      const promptPlanificacion = `Eres el asistente turístico de la Agenda Cultural Loja (Ecuador). El usuario quiere PLANIFICAR UNA VISITA completa a Loja${decisionRouter.fechaVisita ? ` (mencionó: "${decisionRouter.fechaVisita}")` : ""}.

Tu misión: responder en UNA SOLA respuesta integrada y cálida con 3 secciones:
1. 🎭 QUÉ HACER: menciona 1 o 2 eventos de la cartelera para ${fechaLabel}
2. 🏨 DÓNDE DORMIR: recomienda 1 hotel destacado con precio orientativo
3. 🍽️ DÓNDE COMER: recomienda 1 restaurante o cafetería típica de Loja

Fecha actual: ${ahora2.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}

EVENTOS DISPONIBLES para ${fechaLabel}:
${eventosVisita.map((e) => `- ${e.nombre} | ${new Date(e.fecha).toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })} | ${e.lugar}`).join("\n") || "- Sin eventos para esa fecha aún, menciona que la cartelera se actualiza constantemente"}

HOTELES RECOMENDADOS:
${hotelesVisita.map((h) => `- [ID:${h.id}] ${h.nombre} | ${h.rangoPrecio || "Consultar precio"} | ${h.ubicacion}`).join("\n") || "Sin hoteles"}

RESTAURANTES/CAFETERÍAS:
${gastroVisita.map((g) => `- [ID:${g.id}] ${g.nombre} (${g.tipo === "CAFETERIA" ? "Cafetería" : "Restaurante"}) | ${g.ubicacion}`).join("\n") || "Sin restaurantes"}

Reglas de formato:
- Máximo 5-6 frases en total. Responde con calidez y entusiasmo lojano.
- Termina invitando a profundizar en cualquiera de los 3 temas.
- Devuelve JSON: {"texto": "...", "eventosRecomendadosIds": [...], "aliadosRecomendadosIds": [...], "atractivosRecomendadosIds": []}`;

      let planContent = "";
      const deepseekKeyPlan = process.env.DEEPSEEK_API_KEY;
      if (deepseekKeyPlan) {
        try {
          const planRes = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKeyPlan}` },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [{ role: "system", content: promptPlanificacion }, { role: "user", content: lastUserMessage }],
              response_format: { type: "json_object" },
              temperature: 0.5,
              max_tokens: 700,
            }),
          });
          if (planRes.ok) {
            const planData = await planRes.json();
            planContent = planData.choices?.[0]?.message?.content || "";
          }
        } catch { /* fallback below */ }
      }

      let planParsed = {
        texto: `¡Qué plan tan chevere! 🎉 Para ${fechaLabel} en Loja te recomiendo: ${eventosVisita[0] ? `🎭 *${eventosVisita[0].nombre}* el ${new Date(eventosVisita[0].fecha).toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}` : "explorar la cartelera cultural"}. ${hotelesVisita[0] ? `🏨 Para dormir, ${hotelesVisita[0].nombre} (${hotelesVisita[0].rangoPrecio || "gran opción"}).` : ""} ${gastroVisita[0] ? `🍽️ Y para comer, ${gastroVisita[0].nombre} es una delicia lojana. ` : ""}¿Quieres que profundice en alguno de estos?`,
        eventosRecomendadosIds: eventosVisita.slice(0, 2).map((e) => e.id),
        aliadosRecomendadosIds: [...hotelesVisita.slice(0, 2).map((h) => h.id), ...gastroVisita.slice(0, 1).map((g) => g.id)],
        atractivosRecomendadosIds: [] as number[],
      };

      if (planContent) {
        try {
          const raw = JSON.parse(planContent.replace(/```json/g, "").replace(/```/g, "").trim());
          planParsed = {
            texto: raw.texto || planParsed.texto,
            eventosRecomendadosIds: Array.isArray(raw.eventosRecomendadosIds) ? raw.eventosRecomendadosIds : planParsed.eventosRecomendadosIds,
            aliadosRecomendadosIds: Array.isArray(raw.aliadosRecomendadosIds) ? raw.aliadosRecomendadosIds : planParsed.aliadosRecomendadosIds,
            atractivosRecomendadosIds: Array.isArray(raw.atractivosRecomendadosIds) ? raw.atractivosRecomendadosIds : [],
          };
        } catch { /* usa fallback */ }
      }

      const todosAliados = [...hotelesVisita, ...gastroVisita];
      const fullEventosVisita = eventosVisita.filter((e) => planParsed.eventosRecomendadosIds.includes(e.id));
      const fullAliadosVisita = todosAliados.filter((a) => planParsed.aliadosRecomendadosIds.includes(a.id));
      const fullAtractivosVisita = atractivosVisita.filter((at) => planParsed.atractivosRecomendadosIds.includes(at.id));

      if (sessionId) {
        prisma.chatMessage.create({
          data: {
            sessionId, sender: "bot", contenido: planParsed.texto.slice(0, 5000),
            eventosIds: fullEventosVisita.map((e) => e.id),
            aliadosIds: fullAliadosVisita.map((a) => a.id),
          },
        }).catch(() => {/* fail silently */});
      }

      return NextResponse.json({
        texto: planParsed.texto,
        eventos: fullEventosVisita,
        aliados: fullAliadosVisita,
        atractivos: fullAtractivosVisita,
        aliadoDetalle: null,
        ventaPaso: null,
        respuestasRapidas: [
          eventosVisita[0] ? `🎭 Más info de ${eventosVisita[0].nombre}` : "🎭 Ver cartelera completa",
          hotelesVisita[0] ? `🏨 Háblame de ${hotelesVisita[0].nombre}` : "🏨 Ver hoteles",
          gastroVisita[0] ? `🍽️ Háblame de ${gastroVisita[0].nombre}` : "🍽️ Ver restaurantes",
          "🌿 Qué más ver en Loja",
        ],
      });
    }

    // ─── 1. BÚSQUEDA INTELIGENTE DE EVENTOS EN PRISMA (RAG TEMÁTICO Y TEMPORAL) ───
    let eventosParaContexto: any[] = [];
    let tipoBusqueda = "general";

    // A. Si el usuario pregunta por eventos PASADOS / HISTÓRICOS:
    if (intencion.quierePasados) {
      tipoBusqueda = "pasados";
      eventosParaContexto = await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          fecha: { lt: hoyInicio },
          ...(intencion.palabrasClave.length > 0 && {
            OR: intencion.palabrasClave.flatMap((palabra) => [
              { nombre: { contains: palabra } },
              { descripcion: { contains: palabra } },
              { lugar: { contains: palabra } },
            ]),
          }),
        },
        orderBy: { fecha: "desc" },
        take: 6,
        select: {
          id: true, nombre: true, fecha: true, lugar: true,
          slug: true, imagenUrl: true, descripcion: true,
        },
      });
    }
    // B. Si hay palabras clave temáticas (ej: "rock", "danza", "teatro", "infantil", "feria", "bolero"):
    else if (intencion.palabrasClave.length > 0) {
      tipoBusqueda = "tematica";
      const filtrosOr = intencion.palabrasClave.flatMap((palabra) => [
        { nombre: { contains: palabra } },
        { descripcion: { contains: palabra } },
        { lugar: { contains: palabra } },
      ]);

      // Buscar tanto eventos futuros como en el rango de fecha si fue pedido
      eventosParaContexto = await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          ...(rangoFecha
            ? { fecha: { gte: rangoFecha.desde, lte: rangoFecha.hasta } }
            : { fecha: { gte: hoyInicio } }),
          OR: filtrosOr,
        },
        orderBy: { fecha: "asc" },
        take: 6,
        select: {
          id: true, nombre: true, fecha: true, lugar: true,
          slug: true, imagenUrl: true, descripcion: true,
        },
      });

      // Si no hay futuros de ese tema, buscar si hubo alguno recientemente para informar al usuario
      if (eventosParaContexto.length === 0) {
        const eventosPasadosTema = await prisma.evento.findMany({
          where: {
            estado: "APROBADO",
            fecha: { lt: hoyInicio },
            OR: filtrosOr,
          },
          orderBy: { fecha: "desc" },
          take: 3,
          select: {
            id: true, nombre: true, fecha: true, lugar: true,
            slug: true, imagenUrl: true, descripcion: true,
          },
        });
        if (eventosPasadosTema.length > 0) {
          tipoBusqueda = "tematica_pasada";
          eventosParaContexto = eventosPasadosTema;
        }
      }
    }
    // C. Si preguntó por un rango de fecha específico (ej: "el 15 de octubre", "este fin de semana"):
    else if (rangoFecha) {
      tipoBusqueda = "rango_fecha";
      eventosParaContexto = await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          fecha: { gte: rangoFecha.desde, lte: rangoFecha.hasta },
        },
        orderBy: { fecha: "asc" },
        take: 8,
        select: {
          id: true, nombre: true, fecha: true, lugar: true,
          slug: true, imagenUrl: true, descripcion: true,
        },
      });
    }

    // D. Si no hubo resultados temáticos o no hubo búsqueda específica, traer próximos eventos vigentes
    if (eventosParaContexto.length === 0 && !rangoFecha && !intencion.quierePasados) {
      tipoBusqueda = "general";
      eventosParaContexto = await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          fecha: { gte: hoyInicio },
        },
        orderBy: { fecha: "asc" },
        take: 6,
        select: {
          id: true, nombre: true, fecha: true, lugar: true,
          slug: true, imagenUrl: true, descripcion: true,
        },
      });

      // Fallback si la cartelera futura estuviese vacía
      if (eventosParaContexto.length === 0) {
        eventosParaContexto = await prisma.evento.findMany({
          where: { estado: "APROBADO" },
          orderBy: { fecha: "desc" },
          take: 6,
          select: {
            id: true, nombre: true, fecha: true, lugar: true,
            slug: true, imagenUrl: true, descripcion: true,
          },
        });
      }
    }

    // ─── 2. OBTENCIÓN DE ALIADOS Y ATRACTIVOS ───
    const aliados = await prisma.aliado.findMany({
      where: { activo: true },
      orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
      take: 20,
      include: { habitaciones: { orderBy: [{ orden: "asc" }, { id: "asc" }] } },
    });

    const atractivos = await prisma.atractivoCantonal.findMany({
      where: { activo: true },
      take: 6,
    });

    // Función Haversine para distancia GPS
    const calcularDistanciaKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const aliadosConDistancia = aliados.map((a) => {
      let distanciaTexto = "";
      let distanciaKm: number | null = null;
      if (
        ubicacion?.lat &&
        ubicacion?.lng &&
        a.ubicacionLat !== null &&
        a.ubicacionLng !== null
      ) {
        distanciaKm = calcularDistanciaKm(
          ubicacion.lat,
          ubicacion.lng,
          a.ubicacionLat,
          a.ubicacionLng
        );
        if (distanciaKm < 1) {
          distanciaTexto = ` | DISTANCIA GPS: a ${(distanciaKm * 1000).toFixed(0)} metros (¡MUY CERCA!)`;
        } else {
          distanciaTexto = ` | DISTANCIA GPS: a ${distanciaKm.toFixed(1)} km`;
        }
      }
      return { ...a, distanciaKm, distanciaTexto };
    });

    // Ordenar aliados por cercanía al usuario
    if (ubicacion?.lat && ubicacion?.lng) {
      aliadosConDistancia.sort((a, b) => {
        if (a.distanciaKm !== null && b.distanciaKm !== null) return a.distanciaKm - b.distanciaKm;
        if (a.distanciaKm !== null) return -1;
        if (b.distanciaKm !== null) return 1;
        return 0;
      });
    }

    // ─── 3. FORMATEO DE CONTEXTO PARA EL SYSTEM PROMPT ───
    const aliadosContexto = aliadosConDistancia
      .map((a) => {
        const tiposHabitacion = (a.habitaciones || [])
          .map(
            (h) =>
              `${h.nombre}${h.precio ? ` (${h.precio})` : ""}${
                h.caracteristicas ? `: ${h.caracteristicas}` : ""
              }`
          )
          .join(" / ");
        return `[ID:${a.id}] ${a.nombre} | Tipo:${a.tipo} | Dirección:${a.ubicacion}${a.distanciaTexto} | Precio:${a.rangoPrecio || "Consultar"} | WhatsApp:${a.telefono || ""} | Web:${a.websiteUrl || ""} | Maps:${a.mapaUrl || ""} | Servicios:${a.servicios || ""}${tiposHabitacion ? ` | Tipos de habitación:${tiposHabitacion}` : ""} | Desc:${a.descripcion}`;
      })
      .join("\n");

    const atractivosContexto = atractivos
      .map(
        (at) =>
          `[ID:${at.id}] ${at.nombre} | Cantón:${at.canton} | Distancia:${at.distancia} | Ruta:${at.ruta} | Desc:${at.descripcion}`
      )
      .join("\n");

    // Si hay un evento en discusión referencial, asegurarlo como prioritario en eventosParaContexto
    if (eventoEnDiscusion && !eventosParaContexto.some((e) => e.id === eventoEnDiscusion.id)) {
      eventosParaContexto.unshift(eventoEnDiscusion);
      tipoBusqueda = "detalle_evento";
    }

    const eventosContexto = eventosParaContexto
      .map((e) => {
        const fechaEv = new Date(e.fecha);
        let estadoTemporal = "PRÓXIMO";
        if (fechaEv.toDateString() === ahora.toDateString()) {
          estadoTemporal = "¡HOY!";
        } else if (fechaEv < hoyInicio) {
          estadoTemporal = "FINALIZADO / PASADO";
        }
        const horaStr = fechaEv.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
        return `[ID:${e.id}] ${e.nombre} | Estado:${estadoTemporal} | Fecha:${fechaEv.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "long", year: "numeric" })} ${horaStr} | Lugar:${e.lugar} | Descripción Completa:${(e.descripcion || e.nombre || "").slice(0, 600)} | Enlace:/eventos/${e.slug}`;
      })
      .join("\n");

    // Información de auditoría contextual para guiar al modelo
    let guiaBusqueda = "";
    if (eventoEnDiscusion) {
      guiaBusqueda = `\nPREGUNTA SOBRE EVENTO ESPECÍFICO ("${eventoEnDiscusion.nombre}"):
El usuario está preguntando de qué trata, qué es o pidiendo más detalles sobre "${eventoEnDiscusion.nombre}" que se mencionó antes.
- Explícale amena y detalladamente de qué se trata el evento (género, música, ambiente, lugar: ${eventoEnDiscusion.lugar}).
- NO vuelvas a repetir el listado o menú de cartelera. Responde su duda con naturalidad y amabilidad.
- Cierra preguntando si desea saber los horarios exactos, cómo llegar o adquirir entradas.`;
    } else if (intencion.quierePasados) {
      guiaBusqueda = `\nCONSULTA DE HISTORIAL / PASADOS: El usuario pregunta por eventos pasados. Resúmelos muy brevemente indicando que ya finalizaron.`;
    } else if (tipoBusqueda === "tematica" && eventosParaContexto.length > 0) {
      guiaBusqueda = `\nRESULTADO TEMÁTICO: Se encontraron ${eventosParaContexto.length} evento(s) sobre "${intencion.palabrasClave.join(", ")}". Responde con entusiasmo, menciónalos y haz una pregunta sugerente.`;
    } else if (tipoBusqueda === "tematica_pasada") {
      guiaBusqueda = `\nRESULTADO TEMÁTICO: No hay eventos futuros de "${intencion.palabrasClave.join(", ")}", solo eventos pasados. Dilo cordialmente en 1 frase y sugiere los eventos vigentes disponibles preguntándole si le gustaría explorarlos.`;
    } else if (intencion.palabrasClave.length > 0 && eventosParaContexto.length === 0) {
      guiaBusqueda = `\nSIN COINCIDENCIAS: No hay eventos de "${intencion.palabrasClave.join(", ")}" en cartelera. Dilo con amabilidad en 1 oración clara y sugiere revisar la cartelera general o qué otro plan le gustaría.`;
    }

    const detalleRango = rangoFecha
      ? `\nRANGO DE FECHA: Consulta para ${rangoFecha.etiqueta}. ${eventosParaContexto.length === 0 ? "No hay eventos para esa fecha." : ""}`
      : "";

    const detalleUbicacion = ubicacion?.zona
      ? `\nUBICACIÓN GPS DEL USUARIO: Zona "${ubicacion.zona}" (${ubicacion.ciudad || "Loja"}). Solo si el usuario pregunta dónde comer, dormir o salir cerca, recomienda el aliado comercial más cercano.`
      : "";

    // ─── FLUJO DE VENTA INTERACTIVO (5 pasos) ───
    // "otro hotel / más opciones" reinicia el flujo y vuelve a mostrar la lista
    const pideOtraOpcion =
      /\botr[oa]s?\b|más opciones|mas opciones|ver todos|ver opciones|otras alternativas|otras opciones/.test(
        lowerUser
      );

    const quiereReservar = /reservar|reserva|disponibilidad|disponible|apartar|booking/.test(lowerUser);
    const quiereServicios =
      /servicio|incluye|comodidad|amenidad|qué tiene|que tiene|ubicaci|dónde queda|donde queda|cómo llego|como llego|desayun|piscina|wifi|estacionamiento|parqueadero/.test(
        lowerUser
      );
    const quierePrecios = /precio|cuesta|cuánto|cuanto|tarifa|valor|cost|barato|económic|economic/.test(lowerUser);
    const quiereHabitaciones =
      /habitaci|cuarto|pieza|tipos|foto|imagen|galer|categoría|categoria|suite|cama|especialidad|menú|menu|plato|carta|opciones|postre|bebida/.test(
        lowerUser
      );

    const consultaNorm = sinAcentos(lowerUser);
    const aliadoEspecifico = aliados.find(
      (a) =>
        consultaNorm.includes(sinAcentos(a.nombre)) ||
        (a.nombre.toLowerCase().includes("gran victoria") && lowerUser.includes("victoria")) ||
        (a.nombre.toLowerCase().includes("puerta del sol") && lowerUser.includes("puerta del sol"))
    );

    // Si no repite el nombre pero venía hablando de un hotel, seguimos el flujo con ese hotel
    const textoReciente = sinAcentos(
      messages
        .slice(-3)
        .map((m: any) => m.content || m.text || "")
        .join(" ")
    );
    const hotelEnConversacion = aliados.find((a) => textoReciente.includes(sinAcentos(a.nombre)));

    // Detectar si el usuario menciona una habitación específica (ej: "habitación familiar", "matrimonial", "suite")
    const todasLasHabitaciones = hotelEnConversacion?.habitaciones || aliadoEspecifico?.habitaciones || [];
    const habitacionMencionada = todasLasHabitaciones.find((h) => {
      const hNorm = sinAcentos(h.nombre);
      const palabrasHab = hNorm.split(/\s+/).filter((w) => w.length > 3 && !["habitacion", "suite", "para"].includes(w));
      return (
        consultaNorm.includes(hNorm) ||
        palabrasHab.some((p) => consultaNorm.includes(p))
      );
    });

    const quiereHabitacionPuntual = !!habitacionMencionada || /me interesa|quiero la|me gustar[ií]a la|cu[aá]nto sale la|informaci[oó]n de la/i.test(lowerUser);

    const continuarFlujo = quiereReservar || quiereServicios || quierePrecios || quiereHabitaciones || quiereHabitacionPuntual;
    const aliadoVenta =
      aliadoEspecifico || (continuarFlujo ? hotelEnConversacion : undefined);

    const esModoVenta = !!aliadoVenta && !pideOtraOpcion;

    // ─── LEAD QUALIFICATION: Detectar y guardar nombre del usuario ───
    // Si el bot preguntó el nombre en el mensaje anterior y el usuario respondió
    // con un mensaje corto (≤30 chars, sin palabras clave de navegación), asumimos que es el nombre.
    const botPidioNombre = messages.length >= 2 && (() => {
      const botMsgs = messages.filter((m: any) => m.sender === "bot" || m.role === "assistant");
      const ultimoBot = botMsgs[botMsgs.length - 1];
      const textoBot = (ultimoBot?.content || ultimoBot?.text || "").toLowerCase();
      return textoBot.includes("cómo te llamas") || textoBot.includes("como te llamas") ||
             textoBot.includes("cuál es tu nombre") || textoBot.includes("cual es tu nombre") ||
             textoBot.includes("a nombre de") || textoBot.includes("tu nombre");
    })();

    const nombreDetectadoEnVenta = !nombreUsuarioSesion ? extraerNombreUsuario(lastUserMessage) : null;
    if (nombreDetectadoEnVenta && sessionId) {
      prisma.chatSession.update({
        where: { sessionId },
        data: { nombreUsuario: nombreDetectadoEnVenta },
      }).catch(() => {/* fail silently */});
      nombreUsuarioSesion = nombreDetectadoEnVenta;
    }

    // Paso actual del flujo de venta (1..5)
    let pasoVenta = 0;
    if (esModoVenta) {
      if (quiereReservar) {
        pasoVenta = 5;
      } else if (habitacionMencionada || (quiereHabitacionPuntual && quiereHabitaciones)) {
        // Si ya eligió o preguntó por una habitación puntual, avanzamos al paso 4 (detalles, precio y enlace a reserva)
        pasoVenta = 4;
      } else if (quiereServicios) {
        pasoVenta = 4;
      } else if (quierePrecios) {
        pasoVenta = 3;
      } else if (quiereHabitaciones) {
        pasoVenta = 2;
      } else {
        pasoVenta = 1;
      }
    }

    const habitacionesVenta = aliadoVenta?.habitaciones || [];

    // Etiquetas según el tipo de aliado (hotel / restaurante / cafetería)
    const tipoAliadoVenta = aliadoVenta?.tipo;
    const palabraAliado =
      tipoAliadoVenta === "GASTRONOMIA" ? "restaurante" : tipoAliadoVenta === "CAFETERIA" ? "cafetería" : "hotel";
    const palabraCategorias =
      tipoAliadoVenta === "HOSPEDAJE"
        ? "tipos de habitación"
        : tipoAliadoVenta === "CAFETERIA"
        ? "especialidades de la casa"
        : "opciones del menú";
    const verboCategorias =
      tipoAliadoVenta === "HOSPEDAJE"
        ? "Ver habitaciones de"
        : tipoAliadoVenta === "CAFETERIA"
        ? "Ver especialidades de"
        : "Ver el menú de";
    const pluralAliado =
      tipoAliadoVenta === "GASTRONOMIA" ? "restaurantes" : tipoAliadoVenta === "CAFETERIA" ? "cafeterías" : "hoteles";
    const otroAliado =
      tipoAliadoVenta === "GASTRONOMIA"
        ? "otro restaurante"
        : tipoAliadoVenta === "CAFETERIA"
        ? "otra cafetería"
        : "otro hotel";

    const listaCategorias = habitacionesVenta
      .map(
        (h) =>
          `${h.nombre}${h.precio ? ` (${h.precio})` : ""}${h.caracteristicas ? ` — ${h.caracteristicas}` : ""}`
      )
      .join("\n  • ");
    const precioDesde = habitacionesVenta.find((h) => h.precio)?.precio;
    const textoCategorias = habitacionesVenta.length
      ? `Tiene ${habitacionesVenta.length} ${palabraCategorias}:\n  • ${listaCategorias}`
      : "";
    const textoPrecios = precioDesde
      ? `Desde ${precioDesde}${aliadoVenta?.rangoPrecio ? ` (rango general ${aliadoVenta.rangoPrecio})` : ""}`
      : aliadoVenta?.rangoPrecio || "Consultar precios por WhatsApp";

    const datosVenta = aliadoVenta
      ? [
          aliadoVenta.descripcion,
          `Estrellas: ${aliadoVenta.estrellas ?? "sin categoría"}`,
          tipoAliadoVenta === "HOSPEDAJE" && aliadoVenta.numeroCuartos
            ? `Habitaciones: ${aliadoVenta.numeroCuartos}`
            : "",
          `Ubicación: ${aliadoVenta.ubicacion}`,
          textoCategorias,
          `Servicios: ${aliadoVenta.servicios || "s/d"}`,
          `Precio: ${textoPrecios}`,
          aliadoVenta.telefono ? `WhatsApp de reservas: ${aliadoVenta.telefono}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    // Instrucción por paso: cada paso es CORTO y termina preguntando algo (no volcar todo)
    const instruccionHabitacionPuntual = habitacionMencionada
      ? `\nEL USUARIO ELIGIÓ LA OPCIÓN ESPECÍFICA: "${habitacionMencionada.nombre}"${habitacionMencionada.precio ? ` (${habitacionMencionada.precio})` : ""}${habitacionMencionada.caracteristicas ? ` con características: ${habitacionMencionada.caracteristicas}` : ""}. Confirma con entusiasmo su elección, dale su precio exacto y qué incluye, y ofrécele ponerlo en contacto directo por WhatsApp para consultar fechas o apartar.`
      : "";

    const instruccionPaso =
      pasoVenta === 1
        ? `PASO 1 DE 5 (ENGANCHE): saludá y presentá el ${palabraAliado} en 2 frases cortas y atractivas (nombre, estrellas, zona) y decí que tiene ${habitacionesVenta.length || "varias"} ${palabraCategorias}. NO menciones precios ni servicios todavía. Cerrá preguntando si quiere ver ${tipoAliadoVenta === "HOSPEDAJE" ? "las habitaciones" : "las opciones"} o los precios.`
        : pasoVenta === 2
        ? `PASO 2 DE 5 (${palabraCategorias.toUpperCase()}): contá que hay ${habitacionesVenta.length} ${palabraCategorias}, nombrá 2 o 3 con su precio más atractivo y preguntá cuál le llama más la atención. NO listes servicios ni ubicación.`
        : pasoVenta === 3
        ? `PASO 3 DE 5 (PRECIOS): explicá el precio de cada categoría de forma clara y destacá la mejor relación calidad/precio. Preguntá si quiere saber qué incluye cada una. NO repitas la descripción general del hotel.`
        : pasoVenta === 4
        ? `PASO 4 DE 5 (DETALLES Y RESERVA): ${instruccionHabitacionPuntual || `contá la ubicación y servicios destacados que justifiquen la reserva.`} Pregúntale si te gustaría que te conectemos directo por WhatsApp con ${aliadoVenta!.nombre} para verificar disponibilidad o reservar.`
        : pasoVenta === 5
        ? `PASO 5 DE 5 (CIERRE): invitá a reservar por WhatsApp (el número es: ${aliadoVenta?.telefono || "consultar"}), transmití urgencia suave (disponibilidad limitada) y preguntá si reservamos ahora o si prefiere ver ${otroAliado}. Máximo 3 frases. IMPORTANTE: menciona que pueden escribir directo al WhatsApp del ${palabraAliado} para confirmar.`
        : "";

    // WhatsApp Handoff automático en paso 4 y 5
    const whatsappHandoffVenta = esModoVenta && aliadoVenta?.telefono && (pasoVenta === 4 || pasoVenta === 5)
      ? (() => {
          const telLimpio = aliadoVenta.telefono!.replace(/[^\d]/g, "");
          const habTexto = habitacionMencionada ? ` para la ${habitacionMencionada.nombre}` : "";
          const nombreIntro = nombreUsuarioSesion ? `Mi nombre es ${nombreUsuarioSesion}. ` : "";
          const msg = encodeURIComponent(
            `Hola, vengo de la Agenda Cultural Loja. ${nombreIntro}Me interesa consultar disponibilidad y reservar en ${aliadoVenta.nombre}${habTexto}. ¿Me podrían ayudar?`
          );
          return { link: `https://wa.me/${telLimpio}?text=${msg}`, nombre: aliadoVenta.nombre, tipo: palabraAliado };
        })()
      : null;

    // Instrucción de lead qualification para el prompt de venta
    const instruccionLeadQual = esModoVenta && pasoVenta >= 2 && !nombreUsuarioSesion
      ? `\nLEAD QUALIFICATION (muy importante): En algún punto natural de la respuesta (al final o al cerrar tu frase), preguntale al usuario su nombre de forma amigable para personalizar su experiencia. Por ejemplo: "¡Por cierto, ¿cómo te llamas?" o "¿A nombre de quién guardamos la preferencia?". Solo hazlo UNA VEZ de forma muy natural, no insistas.`
      : nombreUsuarioSesion
      ? `\nNOMBRE DEL USUARIO: El usuario se llama ${nombreUsuarioSesion}. Úsalo ocasionalmente para personalizar (ej: "${nombreUsuarioSesion}, ¿qué te parece?"). No lo repitas en cada frase.`
      : "";

    const guiaVenta = esModoVenta
      ? `
════════ MODO VENTA INTERACTIVA — PASO ${pasoVenta} DE 5 ════════
Estás vendiendo "${aliadoVenta!.nombre}" en una CONVERSACIÓN de 5 pasos. El usuario está en el PASO ${pasoVenta}.
${instruccionPaso}
${instruccionLeadQual}

REGLAS DEL PASO (MUY IMPORTANTE):
- Escribí MÁXIMO 3 frases (una es la pregunta final). Nada de listas largas ni párrafos con toda la información.
- Si el usuario eligió una habitación ("familiar", "matrimonial", "suite"), dale el precio y características de ESA habitación y ofrécele reservar o verificar disponibilidad por WhatsApp.
- NO vuelvas a presentar el hotel como si fuera la primera vez si ya está en la conversación.
- Usá solo datos reales de la ficha de abajo. Tono vendedor, cálido y con emojis (1 o 2, no más).
- Terminá SIEMPRE con una pregunta corta que invite a seguir.
- Devolvé SIEMPRE "aliadosRecomendadosIds": [${aliadoVenta!.id}] y dejá eventosRecomendadosIds y atractivosRecomendadosIds VACÍOS.
- El campo "texto" NUNCA puede quedar vacío ni con espacios en blanco.

EJEMPLO DEL FORMATO ESPERADO (adaptá el contenido a este paso):
{"texto": "¡Excelente elección! La Habitación Familiar en Hotel-1 tiene un costo de $70 / noche e incluye desayuno lojano y wifi. ¿Te gustaría que te conectemos directo por WhatsApp con ellos para confirmar disponibilidad? 😊", "eventosRecomendadosIds": [], "aliadosRecomendadosIds": [${aliadoVenta!.id}], "atractivosRecomendadosIds": []}

FICHA REAL DEL ALIADO (usá solo esto):
${datosVenta}`
      : "";

    // Botones de respuesta rápida para que el usuario avance el flujo con un toque
    const nombreVenta = aliadoVenta?.nombre || "";
    const respuestasRapidas: string[] =
      pasoVenta === 1
        ? [
            `📸 ${verboCategorias} ${nombreVenta}`,
            `💰 Ver precios de ${nombreVenta}`,
            `📍 ¿Dónde queda ${nombreVenta}?`,
          ]
        : pasoVenta === 2
        ? [
            `💰 Ver precios de ${nombreVenta}`,
            `✨ Qué incluye ${nombreVenta}`,
            `📍 ¿Dónde queda ${nombreVenta}?`,
          ]
        : pasoVenta === 3
        ? [
            `✨ Qué incluye ${nombreVenta}`,
            `📸 ${verboCategorias} ${nombreVenta}`,
            `💬 Quiero reservar en ${nombreVenta}`,
          ]
        : pasoVenta === 4
        ? habitacionMencionada
          ? [
              `💬 Reservar ${habitacionMencionada.nombre}`,
              `✨ Qué incluye ${nombreVenta}`,
              `🔎 Ver ${pluralAliado}`,
            ]
          : [`💰 Ver precios de ${nombreVenta}`, `💬 Quiero reservar en ${nombreVenta}`, `🔎 Ver ${pluralAliado}`]
        : pasoVenta === 5
        ? [`🔎 Ver ${pluralAliado}`]
        : [];

    const detalleMemoria = memoriaSesion.resumen
      ? `\nRESUMEN DE LA CONVERSACIÓN PREVIA CON ESTE USUARIO:\n${memoriaSesion.resumen}\n(Usa este resumen para mantener consistencia, recordar qué hotel o evento le gustó y no contradecirte).`
      : "";

    const systemPrompt = `Eres el asistente turístico y cultural oficial de la Agenda Cultural Loja (Ecuador).
${detalleUbicacion}
${detalleRango}
${detalleMemoria}
${guiaBusqueda}
${guiaVenta}

FECHA ACTUAL: ${fechaHoyStr}.

TONO Y ESTILO DE CONVERSACIÓN (NATURAL, AMABLE Y ENGAGEMENT):
1. EQUILIBRIO PERFECTO: Responde con calidez humana en 2 o 3 frases fluidas. No seas un robot que repite lo mismo.
2. CONTINUIDAD CONVERSACIONAL: Si el usuario pregunta "¿y eso de qué es?" o similar, responde directamente sobre el evento o aliado en discusión.
3. CIERRE CONVERSACIONAL ACTIVO: Termina SIEMPRE con una pregunta sugerente o invitación natural para continuar la charla.
4. RELEVANCIA TEMÁTICA:
   - Mantente enfocado en lo que el usuario preguntó. Si pregunta por un evento, habla de ese evento.
   - Solo sugiere hospedaje o gastronomía si el usuario lo menciona, o si es oportuno vincularlo a un evento nocturno/fin de semana.
4.1 NATURALEZA PRIMERO: si el usuario pide naturaleza, rutas, parques, cascadas, cerros, senderismo, miradores, ríos o actividades al aire libre y NO pidió eventos de cartelera, NO recomiendes eventos: responde con los ATRACTIVOS CANTONALES y usa sus IDs en "atractivosRecomendadosIds".
5. CERO ALUCINACIÓN (ESTRICTO):
   - Solo asocia IDs de la lista EVENTOS DISPONIBLES o ALIADOS COMERCIALES.
   - NUNCA inventes platos, comidas, bebidas, servicios, tipos de habitación, precios o características que NO estén en la ficha del aliado de la base de datos.
   - Si el usuario te pregunta por algo puntual (un plato específico, un servicio o detalle) que NO figura en los datos provistos del aliado, responde con sinceridad y amabilidad diciendo que no dispones de ese dato exacto en sistema, e invítalo a consultarlo o confirmarlo directo por WhatsApp con el establecimiento.
5.1 ALIADOS COMERCIALES SON PRIORIDAD: si el usuario pregunta por hospedaje, hoteles, dónde dormir o dónde comer, incluye SIEMPRE en "aliadosRecomendadosIds" los IDs de los aliados comerciales prioritarios (máximo 3).
6. NO REPITAS datos obvios ni vuelvas a mandar la misma tarjeta si ya se la mostraste al usuario.

ALIADOS COMERCIALES:
${aliadosContexto || "Sin aliados."}

ATRACTIVOS CANTONALES:
${atractivosContexto || "Sin atractivos."}

EVENTOS DISPONIBLES:
${eventosContexto || "Sin eventos coincidentes."}

FORMATO DE RESPUESTA — SOLO JSON válido:
{
  "texto": "Tu respuesta cálida, explicativa y con pregunta final...",
  "eventosRecomendadosIds": [],
  "aliadosRecomendadosIds": [],
  "atractivosRecomendadosIds": []
}`;

    const groqKey = process.env.GROQ_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    let aiContent = "";

    // Ventana deslizante: últimos 10 mensajes en el contexto conversacional
    const mensajesParaModelo = (
      memoriaSesion.mensajesRecientes.length > 0
        ? memoriaSesion.mensajesRecientes
        : messages.slice(-10)
    ).map((m: any) => ({
      role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.contenido || m.content || m.text || "",
    }));

    // Asegurar que el último mensaje del usuario esté presente
    if (
      mensajesParaModelo.length === 0 ||
      mensajesParaModelo[mensajesParaModelo.length - 1].content !== lastUserMessage
    ) {
      mensajesParaModelo.push({ role: "user", content: lastUserMessage });
    }

    // Motor de IA Primario: DeepSeek (activo, funcional y con créditos)
    if (deepseekKey) {
      try {
        const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              ...mensajesParaModelo,
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: 600,
          }),
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          aiContent = dsData.choices?.[0]?.message?.content || "";
        } else {
          const errText = await dsRes.text();
          console.error("DeepSeek error HTTP:", dsRes.status, errText);
        }
      } catch (err) {
        console.error("DeepSeek excepción:", err);
      }
    }

    // Fallback secundario con Groq si DeepSeek no respondiera
    if (!aiContent && groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...mensajesParaModelo,
            ],
            response_format: { type: "json_object" },
            temperature: 0.5,
            max_tokens: 600,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          aiContent = groqData.choices?.[0]?.message?.content || "";
        } else {
          const errText = await groqRes.text();
          console.error("Groq error HTTP:", groqRes.status, errText);
        }
      } catch (err) {
        console.error("Groq excepción:", err);
      }
    }

    let parsedResult: {
      texto: string;
      eventosRecomendadosIds: number[];
      aliadosRecomendadosIds: number[];
      atractivosRecomendadosIds: number[];
    } = {
      texto: "",
      eventosRecomendadosIds: [],
      aliadosRecomendadosIds: [],
      atractivosRecomendadosIds: [],
    };

    if (aiContent) {
      try {
        const cleaned = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        parsedResult = {
          texto: parsed.texto || "",
          eventosRecomendadosIds: Array.isArray(parsed.eventosRecomendadosIds) ? parsed.eventosRecomendadosIds : [],
          aliadosRecomendadosIds: Array.isArray(parsed.aliadosRecomendadosIds) ? parsed.aliadosRecomendadosIds : [],
          atractivosRecomendadosIds: Array.isArray(parsed.atractivosRecomendadosIds) ? parsed.atractivosRecomendadosIds : [],
        };
      } catch {
        parsedResult.texto = aiContent.slice(0, 500);
      }
    }

    const esHospedaje =
      lowerUser.includes("hosped") || lowerUser.includes("hotel") ||
      lowerUser.includes("dormir") || lowerUser.includes("alojam") ||
      lowerUser.includes("habitac") || lowerUser.includes("quedarm");

    const esEvento =
      lowerUser.includes("hoy") || lowerUser.includes("hacer") ||
      lowerUser.includes("evento") || lowerUser.includes("cartelera") ||
      lowerUser.includes("mañana") || lowerUser.includes("semana") ||
      lowerUser.includes("fin de semana") || !!rangoFecha;

    // El usuario pidió EVENTOS explícitamente (no adivinamos: palabras de cartelera o fecha)
    const esEventoExplicito =
      lowerUser.includes("evento") || lowerUser.includes("cartelera") ||
      lowerUser.includes("concierto") || lowerUser.includes("festival") ||
      lowerUser.includes("teatro") || lowerUser.includes("obra") ||
      lowerUser.includes("música") || lowerUser.includes("musica") ||
      lowerUser.includes("feria") || lowerUser.includes("exposici") ||
      lowerUser.includes("agenda") || lowerUser.includes("presentaci") ||
      lowerUser.includes("hoy") || lowerUser.includes("mañana") ||
      lowerUser.includes("fin de semana") || lowerUser.includes("finde") ||
      !!rangoFecha;

    const esSaludo =
      /^(hola|buenas|buenos|saludos|hey|hi|ola)[?!\s.]*$/.test(lowerUser.trim()) ||
      lowerUser.trim() === "hola?";

    const esNaturaleza =
      lowerUser.includes("naturaleza") || lowerUser.includes("canton") ||
      lowerUser.includes("cantón") || lowerUser.includes("ruta") ||
      lowerUser.includes("parque") || /\breservas?\b/.test(lowerUser) ||
      lowerUser.includes("vilcabamba") || lowerUser.includes("podocarpus") ||
      lowerUser.includes("cascada") || lowerUser.includes("cerro") ||
      lowerUser.includes("senderis") || lowerUser.includes("montaña") ||
      lowerUser.includes("bosque") || lowerUser.includes("mirador") ||
      lowerUser.includes("ecoturis") || lowerUser.includes("aire libre") ||
      lowerUser.includes("rio") || lowerUser.includes("río") ||
      lowerUser.includes("camping") || lowerUser.includes("paisaje") ||
      lowerUser.includes("mandango") || lowerUser.includes("picachos") ||
      lowerUser.includes("puyango") || lowerUser.includes("termal") ||
      lowerUser.includes("visitar") || lowerUser.includes("visita") ||
      lowerUser.includes("conocer") || lowerUser.includes("atractiv") ||
      lowerUser.includes("turismo") || lowerUser.includes("turístic") ||
      lowerUser.includes("turistico") || lowerUser.includes("turístico") ||
      lowerUser.includes("lugares");

    // Cafeterías: preferencia cuando el usuario pregunta por café
    const esCafe =
      lowerUser.includes("café") || lowerUser.includes("cafe") ||
      lowerUser.includes("cafeter") || lowerUser.includes("barista") ||
      lowerUser.includes("espresso") || lowerUser.includes("capuchino") ||
      lowerUser.includes("latte") || lowerUser.includes("tostado");

    // Gastronomía = también es un aliado comercial prioritario
    const esGastronomia =
      lowerUser.includes("comer") || lowerUser.includes("comida") ||
      lowerUser.includes("gastronom") || lowerUser.includes("restaurant") ||
      lowerUser.includes("restaurante") || lowerUser.includes("cafeter") ||
      lowerUser.includes("café") || lowerUser.includes("cafe") ||
      lowerUser.includes("desayun") || lowerUser.includes("almorz") ||
      lowerUser.includes("cenar") || lowerUser.includes("cena") ||
      lowerUser.includes("pizza") || lowerUser.includes("parrillad") ||
      lowerUser.includes("marisc") || lowerUser.includes("típic") ||
      lowerUser.includes("tipic") || lowerUser.includes("donde comer") ||
      lowerUser.includes("dónde comer");

    // ─── ALIADOS COMERCIALES = PRIORIDAD ───
    // Se muestran SIEMPRE completos (máx. 3 tarjetas) cuando el usuario busca hospedaje o gastronomía.
    const aliadosComerciales = aliados.filter(
      (a) => a.tipo === "HOSPEDAJE" || a.tipo === "GASTRONOMIA" || a.tipo === "CAFETERIA"
    );
    // Prioridad por tema: cafeterías si piden café, restaurantes si piden comer, hoteles si buscan dormir
    const aliadosAfines = esCafe
      ? aliados.filter((a) => a.tipo === "CAFETERIA")
      : esGastronomia && !esHospedaje
      ? aliados.filter((a) => a.tipo === "GASTRONOMIA")
      : aliados.filter((a) => a.tipo === "HOSPEDAJE");
    // Prioridad: si el usuario pidió un tema (dormir / comer / café) se muestran SOLO los aliados de ese rubro.
    // Si no hay tema claro, se muestran todos los comerciales.
    const hayTemaAliado = esCafe || esGastronomia || esHospedaje;
    const idsPrioridadAliados = Array.from(
      new Set([
        ...aliadosAfines.map((a) => a.id),
        ...aliadosComerciales.map((a) => a.id),
        ...aliados.map((a) => a.id),
      ])
    );
    const baseAliados = (
      hayTemaAliado && aliadosAfines.length > 0
        ? aliadosAfines
        : aliadosComerciales.length > 0
        ? aliadosComerciales
        : aliados
    ).slice(0, 6);

    // (La detección del MODO VENTA y sus datos se calculan arriba, antes de construir el prompt)

    console.log("[Chat Debug] AI Content raw length:", aiContent.length, "Parsed text:", parsedResult.texto);

    // Heurístico ÚNICAMENTE si la IA falló por completo y vino vacía
    if (!parsedResult.texto || parsedResult.texto.trim().length === 0) {
      if (esModoVenta && aliadoVenta) {
        // El flujo de venta NUNCA debe caer en textos de cartelera
        parsedResult.texto = plantillaVentaPaso(aliadoVenta, habitacionesVenta, pasoVenta, habitacionMencionada);
      } else if (esSaludo) {
        parsedResult.texto = "¡Hola! 👋 Bienvenido a la Agenda Cultural de Loja. ¿Qué planes o eventos buscas para hoy?";
      } else if ((esHospedaje || esGastronomia) && !esModoVenta) {
        parsedResult.texto = "Aquí tienes excelentes opciones recomendadas en Loja:";
        if (parsedResult.aliadosRecomendadosIds.length === 0) {
          parsedResult.aliadosRecomendadosIds = baseAliados.map((a) => a.id);
        }
      } else if (eventosParaContexto.length > 0) {
        parsedResult.texto = "Aquí tienes los eventos relacionados disponibles en cartelera. ¿Te gustaría saber más detalles de alguno?";
        parsedResult.eventosRecomendadosIds = eventosParaContexto.slice(0, 6).map((e: any) => e.id);
      } else {
        parsedResult.texto = "Por el momento no encuentro eventos específicos para esa consulta en cartelera. ¿Te gustaría explorar otras fechas o actividades?";
      }
    }

    // Regla para tarjetas de eventos:
    if (eventoEnDiscusion) {
      // Si el usuario pregunta de qué trata o detalles de un evento ya mencionado, NO repetir las tarjetas (a menos que la IA explícitamente lo decida)
      // Mantener lo que la IA haya decidido en eventosRecomendadosIds
    } else if (rangoFecha) {
      if (eventosParaContexto.length === 0) {
        // No hay eventos para esa fecha: NUNCA mostrar tarjetas de eventos de otros días
        parsedResult.eventosRecomendadosIds = [];
      } else if (parsedResult.eventosRecomendadosIds.length === 0) {
        parsedResult.eventosRecomendadosIds = eventosParaContexto.slice(0, 6).map((e: any) => e.id);
      }
    } else if (esEvento && parsedResult.eventosRecomendadosIds.length === 0 && eventosParaContexto.length > 0) {
      parsedResult.eventosRecomendadosIds = eventosParaContexto.slice(0, 6).map((e: any) => e.id);
    }

    // ─── NATURALEZA MANDA ───
    // Si piden naturaleza/rutas/parques y NO pidieron eventos explícitamente,
    // no mezclamos cartelera: se muestran solo los atractivos cantonales.
    if (esNaturaleza && !esEventoExplicito && atractivos.length > 0) {
      parsedResult.eventosRecomendadosIds = [];
      if (parsedResult.atractivosRecomendadosIds.length === 0) {
        parsedResult.atractivosRecomendadosIds = atractivos.slice(0, 6).map((at) => at.id);
      }
    }

    // Solo recomendar aliados si el usuario preguntó explícitamente por hospedaje, comida o por un aliado puntual
    if (esModoVenta && aliadoVenta) {
      // ─── FLUJO DE VENTA: una sola ficha (con su paso actual), sin eventos ni atractivos ───
      parsedResult.aliadosRecomendadosIds = [aliadoVenta.id];
      parsedResult.eventosRecomendadosIds = [];
      parsedResult.atractivosRecomendadosIds = [];

      const textoGenerico =
        !parsedResult.texto ||
        parsedResult.texto.trim().length < 40 ||
        parsedResult.texto.trim() === "Aquí tienes la información:" ||
        parsedResult.texto.trim() === "Aquí tienes excelentes opciones recomendadas en Loja:";
      if (textoGenerico) {
        parsedResult.texto = plantillaVentaPaso(aliadoVenta, habitacionesVenta, pasoVenta, habitacionMencionada);
      }
    } else if (!esHospedaje && !esGastronomia && !pideOtraOpcion) {
      parsedResult.aliadosRecomendadosIds = [];
    } else {
      // Los aliados comerciales son PRIORIDAD: se completan SIEMPRE todos (máx. 3 tarjetas),
      // respetando primero lo que la IA recomendó y rellenando con los aliados prioritarios.
      const idsValidosIA = parsedResult.aliadosRecomendadosIds.filter((id) =>
        baseAliados.some((a) => a.id === id)
      );
      parsedResult.aliadosRecomendadosIds = Array.from(
        new Set([...idsValidosIA, ...baseAliados.map((a) => a.id)])
      ).slice(0, 6);
    }

    if (esNaturaleza && !esModoVenta && parsedResult.atractivosRecomendadosIds.length === 0 && atractivos.length > 0) {
      parsedResult.atractivosRecomendadosIds = atractivos.slice(0, 6).map((at) => at.id);
    }

    // En modo venta la ficha del aliado viaja en el mensaje, junto con el paso actual y los botones del flujo
    const aliadoDetalle = esModoVenta ? aliadoVenta : null;

    // Resolver tarjetas de eventos a mostrar a partir de los eventos analizados en el contexto
    const fullEventos = eventosParaContexto.filter((e) =>
      parsedResult.eventosRecomendadosIds?.includes(e.id)
    );

    const fullAliados = aliados.filter((a) =>
      parsedResult.aliadosRecomendadosIds?.includes(a.id)
    );
    const fullAtractivos = atractivos.filter((at) =>
      parsedResult.atractivosRecomendadosIds?.includes(at.id)
    );

    // Guardar mensaje del bot en CRM
    if (sessionId) {
      prisma.chatMessage.create({
        data: {
          sessionId,
          sender: "bot",
          contenido: parsedResult.texto.slice(0, 5000),
          eventosIds: fullEventos.map((e) => e.id),
          aliadosIds: fullAliados.map((a) => a.id),
          atractivosIds: fullAtractivos.map((at) => at.id),
        },
      }).catch(() => {/* fail silently */});
    }

    // Guardar en Caché si es consulta general/frecuente sin modo venta
    if (!esModoVenta && messages.length <= 2 && parsedResult.texto && parsedResult.texto.length > 30) {
      chatCache.set(
        lastUserMessage,
        {
          texto: parsedResult.texto,
          aliadosRecomendadosIds: fullAliados.map((a) => a.id),
          eventosRecomendadosIds: fullEventos.map((e) => e.id),
          atractivosRecomendadosIds: fullAtractivos.map((at) => at.id),
        },
        ubicacion?.zona
      );
    }

    return NextResponse.json({
      texto: parsedResult.texto,
      eventos: fullEventos,
      aliados: fullAliados,
      atractivos: fullAtractivos,
      aliadoDetalle: aliadoDetalle || null,
      ventaPaso: pasoVenta || null,
      respuestasRapidas,
      // WhatsApp Handoff: disponible en paso 4 y 5 del flujo de venta
      whatsappHandoff: whatsappHandoffVenta || null,
      // Aliado disponible para abrir formulario de reserva directa
      aliadoReserva: (esModoVenta && aliadoVenta && (pasoVenta === 4 || pasoVenta === 5)) ? {
        id: aliadoVenta.id,
        nombre: aliadoVenta.nombre,
        tipo: aliadoVenta.tipo,
        habitacionSugerida: habitacionMencionada?.nombre || null,
      } : null,
    });
  } catch (error: any) {
    console.error("Error en /api/chat:", error);
    return NextResponse.json(
      {
        texto: "¡Hola! Estoy listo para ayudarte a descubrir los mejores rincones culturales, hospedajes y gastronomía de Loja. ¿Por dónde empezamos?",
        aliados: [],
        atractivos: [],
        eventos: [],
      },
      { status: 200 }
    );
  }
}
