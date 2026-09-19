import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const lastUserMessage: string = messages[messages.length - 1]?.content || "";
    const lowerUser = lastUserMessage.toLowerCase();

    // Guardar/actualizar sesión CRM en background (sin bloquear respuesta)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const ua = req.headers.get("user-agent") || null;

    if (sessionId) {
      // Upsert de la sesión
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
          totalMensajes: { increment: 1 },
          updatedAt: new Date(),
        },
      }).catch(() => {/* fail silently */});

      // Guardar el mensaje del usuario
      prisma.chatMessage.create({
        data: {
          sessionId,
          sender: "user",
          contenido: lastUserMessage.slice(0, 5000),
        },
      }).catch(() => {/* fail silently */});
    }

    const ahora = nowEcuador();
    const hoyInicio = startOfDayEcuador(ahora);
    const fechaHoyStr = ahora.toLocaleDateString("es-EC", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    // Analizar tanto el último mensaje como los mensajes anteriores para mantener contexto
    const ultimosMensajesTexto = messages
      .slice(-3)
      .map((m: any) => m.content || m.text || "")
      .join(" ");

    // El rango de fecha SOLO se calcula a partir del mensaje actual del usuario (nunca se hereda accidentalmente)
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
      take: 8,
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
      .map(
        (a) =>
          `[ID:${a.id}] ${a.nombre} | Tipo:${a.tipo} | Dirección:${a.ubicacion}${a.distanciaTexto} | Precio:${a.rangoPrecio || "Consultar"} | WhatsApp:${a.telefono || ""} | Web:${a.websiteUrl || ""} | Maps:${a.mapaUrl || ""} | Servicios:${a.servicios || ""} | Desc:${a.descripcion}`
      )
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

    const systemPrompt = `Eres el asistente turístico y cultural oficial de la Agenda Cultural Loja (Ecuador).
${detalleUbicacion}
${detalleRango}
${guiaBusqueda}

FECHA ACTUAL: ${fechaHoyStr}.

TONO Y ESTILO DE CONVERSACIÓN (NATURAL, AMABLE Y ENGAGEMENT):
1. EQUILIBRIO PERFECTO: Responde con calidez humana en 2 o 3 frases fluidas. No seas un robot que repite lo mismo.
2. CONTINUIDAD CONVERSACIONAL: Si el usuario pregunta "¿y eso de qué es?" o similar, responde directamente sobre el evento en discusión explicando de qué va.
3. CIERRE CONVERSACIONAL ACTIVO: Termina SIEMPRE con una pregunta sugerente o invitación natural para continuar la charla.
4. RELEVANCIA TEMÁTICA:
   - Mantente enfocado en lo que el usuario preguntó. Si pregunta por un evento, habla de ese evento.
   - Solo sugiere hospedaje o gastronomía si el usuario lo menciona o pregunta qué hacer de noche/dónde salir.
5. CERO ALUCINACIÓN: Solo asocia IDs de la lista EVENTOS DISPONIBLES.
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
              ...messages.map((m: any) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.content || m.text || "",
              })),
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
              ...messages.map((m: any) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.content || m.text || "",
              })),
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

    const esSaludo =
      /^(hola|buenas|buenos|saludos|hey|hi|ola)[?!\s.]*$/.test(lowerUser.trim()) ||
      lowerUser.trim() === "hola?";

    const esNaturaleza =
      lowerUser.includes("naturaleza") || lowerUser.includes("canton") ||
      lowerUser.includes("cantón") || lowerUser.includes("ruta") ||
      lowerUser.includes("parque") || lowerUser.includes("reserva") ||
      lowerUser.includes("vilcabamba") || lowerUser.includes("podocarpus");

    console.log("[Chat Debug] AI Content raw length:", aiContent.length, "Parsed text:", parsedResult.texto);

    // Heurístico ÚNICAMENTE si la IA falló por completo y vino vacía
    if (!parsedResult.texto || parsedResult.texto.trim().length === 0) {
      if (esSaludo) {
        parsedResult.texto = "¡Hola! 👋 Bienvenido a la Agenda Cultural de Loja. ¿Qué planes o eventos buscas para hoy?";
      } else if (esHospedaje) {
        parsedResult.texto = "Aquí tienes excelentes opciones recomendadas en Loja:";
        if (parsedResult.aliadosRecomendadosIds.length === 0) {
          parsedResult.aliadosRecomendadosIds = aliados.slice(0, 2).map((a) => a.id);
        }
      } else if (eventosParaContexto.length > 0) {
        parsedResult.texto = "Aquí tienes los eventos relacionados disponibles en cartelera. ¿Te gustaría saber más detalles de alguno?";
        parsedResult.eventosRecomendadosIds = eventosParaContexto.slice(0, 4).map((e: any) => e.id);
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
        parsedResult.eventosRecomendadosIds = eventosParaContexto.slice(0, 4).map((e: any) => e.id);
      }
    } else if (esEvento && parsedResult.eventosRecomendadosIds.length === 0 && eventosParaContexto.length > 0) {
      parsedResult.eventosRecomendadosIds = eventosParaContexto.slice(0, 4).map((e: any) => e.id);
    }

    const aliadoEspecifico = aliados.find((a) =>
      lowerUser.includes(a.nombre.toLowerCase()) ||
      (a.nombre.toLowerCase().includes("gran victoria") && lowerUser.includes("victoria")) ||
      (a.nombre.toLowerCase().includes("puerta del sol") && lowerUser.includes("puerta del sol"))
    );

    // Solo recomendar aliados si el usuario preguntó explícitamente por hospedaje, comida o por un aliado puntual
    if (!esHospedaje && !aliadoEspecifico) {
      parsedResult.aliadosRecomendadosIds = [];
    } else if (esHospedaje && parsedResult.aliadosRecomendadosIds.length === 0) {
      parsedResult.aliadosRecomendadosIds = aliados
        .filter((a) => a.tipo === "HOSPEDAJE" || a.tipo === "GASTRONOMIA")
        .slice(0, 2)
        .map((a) => a.id);
      if (parsedResult.aliadosRecomendadosIds.length === 0) {
        parsedResult.aliadosRecomendadosIds = aliados.slice(0, 2).map((a) => a.id);
      }
    }

    if (aliadoEspecifico) {
      parsedResult.aliadosRecomendadosIds = [aliadoEspecifico.id];
      const textoGenerico = !parsedResult.texto || parsedResult.texto.trim().length < 20 || parsedResult.texto === "Aquí tienes la información:";
      if (textoGenerico) {
        parsedResult.texto = `¡Excelente elección! ${aliadoEspecifico.nombre} se ubica en ${aliadoEspecifico.ubicacion}. Reserva directa por WhatsApp disponible.`;
      }
    }

    if (esNaturaleza && parsedResult.atractivosRecomendadosIds.length === 0 && atractivos.length > 0) {
      parsedResult.atractivosRecomendadosIds = atractivos.slice(0, 2).map((at) => at.id);
    }

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

    return NextResponse.json({
      texto: parsedResult.texto,
      eventos: fullEventos,
      aliados: fullAliados,
      atractivos: fullAtractivos,
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
