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

  if (q.includes("esta semana") || (q.includes("semana") && !q.includes("fin de semana"))) {
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

    const aliados = await prisma.aliado.findMany({
      where: { activo: true },
      orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
      take: 6,
    });

    const atractivos = await prisma.atractivoCantonal.findMany({
      where: { activo: true },
      take: 6,
    });

    const ahora = nowEcuador();
    const fechaHoyStr = ahora.toLocaleDateString("es-EC", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const rangoFecha = extraerRangoFecha(lastUserMessage);

    // 1. Buscar eventos exactamente en el rango solicitado (si aplica)
    let eventosEnFecha: any[] = [];
    if (rangoFecha) {
      eventosEnFecha = await prisma.evento.findMany({
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

    // 2. Buscar eventos futuros generales desde hoy
    let eventosGenerales = await prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        fecha: { gte: startOfDayEcuador(ahora) },
      },
      orderBy: { fecha: "asc" },
      take: 6,
      select: {
        id: true, nombre: true, fecha: true, lugar: true,
        slug: true, imagenUrl: true, descripcion: true,
      },
    });

    if (eventosGenerales.length === 0) {
      eventosGenerales = await prisma.evento.findMany({
        where: { estado: "APROBADO" },
        orderBy: { fecha: "desc" },
        take: 6,
        select: {
          id: true, nombre: true, fecha: true, lugar: true,
          slug: true, imagenUrl: true, descripcion: true,
        },
      });
    }

    // Eventos a considerar para contexto
    const eventosParaContexto = rangoFecha
      ? (eventosEnFecha.length > 0 ? eventosEnFecha : [])
      : eventosGenerales;

    // Función para calcular distancia en km usando Haversine
    const calcularDistanciaKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radio de la Tierra en km
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
          distanciaTexto = ` | 📍 DISTANCIA AL USUARIO: a ${(distanciaKm * 1000).toFixed(0)} metros de distancia (¡MUY CERCA!)`;
        } else {
          distanciaTexto = ` | 📍 DISTANCIA AL USUARIO: a ${distanciaKm.toFixed(1)} km de distancia`;
        }
      }
      return {
        ...a,
        distanciaKm,
        distanciaTexto,
      };
    });

    // Si el usuario tiene ubicación, ordenar los aliados por cercanía
    if (ubicacion?.lat && ubicacion?.lng) {
      aliadosConDistancia.sort((a, b) => {
        if (a.distanciaKm !== null && b.distanciaKm !== null) {
          return a.distanciaKm - b.distanciaKm;
        }
        if (a.distanciaKm !== null) return -1;
        if (b.distanciaKm !== null) return 1;
        return 0;
      });
    }

    const aliadosContexto = aliadosConDistancia
      .map(
        (a) =>
          `[ID:${a.id}] ${a.nombre} | Tipo:${a.tipo} | Dirección:${a.ubicacion}${a.distanciaTexto} | Precio:${a.rangoPrecio || "Consultar"} | Cuartos:${a.cuartos || "Disponibles"} | Servicios:${a.servicios || "Todos"} | WhatsApp:${a.telefono || ""} | Web:${a.websiteUrl || ""} | Maps:${a.mapaUrl || ""} | Desc:${a.descripcion}`
      )
      .join("\n");

    const atractivosContexto = atractivos
      .map(
        (at) =>
          `[ID:${at.id}] ${at.nombre} | Cantón:${at.canton} | Dist:${at.distancia} | Ruta:${at.ruta} | Desc:${at.descripcion} | Maps:${at.mapaUrl || ""}`
      )
      .join("\n");

    const eventosContexto = eventosParaContexto
      .map(
        (e) =>
          `[ID:${e.id}] ${e.nombre} | Fecha:${new Date(e.fecha).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })} | Lugar:${e.lugar} | Enlace:/eventos/${e.slug}`
      )
      .join("\n");

    const detalleRango = rangoFecha
      ? `- El usuario pregunta por: ${rangoFecha.etiqueta} (${rangoFecha.desde.toLocaleDateString("es-EC")} al ${rangoFecha.hasta.toLocaleDateString("es-EC")}).\n- EVENTOS CONFIRMADOS PARA ESA FECHA: ${eventosEnFecha.length > 0 ? eventosEnFecha.length + " evento(s) encontrado(s)." : "NINGUNO. Informa explícitamente al usuario que no hay eventos programados para ese día específico y sugiérele los próximos eventos o actividades fijas (museos, Calle Lourdes, gastronomía)."}`
      : "";

    // Contexto de ubicación del usuario (si compartió su ubicación)
    const detalleUbicacion = ubicacion?.zona
      ? `\nUBICACIÓN REAL DEL USUARIO: El usuario se encuentra en "${ubicacion.zona}" (${ubicacion.ciudad || "Loja"}, ${ubicacion.provincia || "Loja"}, ${ubicacion.pais || "Ecuador"}). Coordenadas del usuario: [${ubicacion.lat}, ${ubicacion.lng}].
REGLA DE CERCANÍA:
- Se ha calculado la distancia exacta a los Aliados Comerciales registrados.
- Cuando el usuario pregunte dónde comer, hospedarse o qué hacer, PRIORIZA Y MENCIONA los aliados más cercanos a él destacando la proximidad (ej: "A solo 300 metros de donde estás encuentras...", o "El más cercano a tu ubicación es...").
- Adapta el lenguaje si el usuario es turista (está fuera de Loja) o si está en el centro/barrios locales.`
      : "";

    const systemPrompt = `Eres el asistente virtual oficial de la "Agenda Cultural Loja" (Ecuador).
${detalleUbicacion}

FECHA Y HORA ACTUAL EN LOJA (Ecuador, UTC-5):
- Hoy es: ${fechaHoyStr}
- Usa SIEMPRE esta fecha como referencia para "hoy", "mañana", "esta semana".
${detalleRango}

MISIÓN: Orientar con orgullo y exactitud sobre qué hacer en Loja: eventos culturales, lugares emblemáticos, gastronomía y aliados comerciales.

CONOCIMIENTO GENERAL SOBRE LOJA:
- Puerta de la Ciudad: museo de arte, mirador y salas de exhibición.
- Calle Lourdes: calle colonial más pintoresca, artesanías y cafeterías bohemias.
- Parque Jipiro: arquitectura de maravillas del mundo, laguna y áreas verdes.
- Mirador El Cisne y Parque Pucará Podocarpus: vistas panorámicas.
- Teatro Bolívar y Teatro Benjamín Carrión: artes vivas y música sinfónica.
- Gastronomía: Repe Lojano, Cecina Lojana, Tamal Lojano, Café de especialidad.
- Música: cuna del FIAVL (Festival Internacional Artes Vivas de Loja), noviembre.

REGLAS DE RESPUESTA:
1. Sé conciso: máximo 2–3 oraciones entusiastas.
2. SI EL USUARIO PREGUNTA POR UNA FECHA ESPECÍFICA:
   - Si HAY eventos para esa fecha: inclúyelos en "eventosRecomendadosIds" y menciónalos.
   - Si NO HAY eventos confirmados para esa fecha: DI CLARAMENTE que para esa fecha aún no hay eventos en cartelera, recomienda visitar la Calle Lourdes, Puerta de la Ciudad o Parque Jipiro, y en "eventosRecomendadosIds" pon [] (VACÍO, NO INVENTES NI PONGAS EVENTOS DE OTRAS FECHAS).
3. ALIADO ESPECÍFICO: si nombran un hotel/restaurante concreto, pon SOLO ese ID en "aliadosRecomendadosIds" y detalla cuartos, servicios, precio, ubicación.
4. HOSPEDAJE GENERAL: incluye 2–3 IDs de aliados en "aliadosRecomendadosIds".
5. NATURALEZA/CANTONES: incluye IDs en "atractivosRecomendadosIds".
6. NUNCA devuelvas "texto" vacío o con menos de 10 caracteres.

ALIADOS COMERCIALES:
${aliadosContexto || "Sin aliados registrados."}

ATRACTIVOS CANTONALES:
${atractivosContexto || "Sin atractivos registrados."}

EVENTOS DISPONIBLES:
${eventosContexto || "Sin eventos para la consulta."}

FORMATO DE RESPUESTA — SOLO JSON válido, sin markdown, sin bloques de código:
{
  "texto": "Tu respuesta conversacional concisa...",
  "eventosRecomendadosIds": [],
  "aliadosRecomendadosIds": [],
  "atractivosRecomendadosIds": []
}`;

    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    let aiContent = "";

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
                content: m.text || m.content || "",
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
                content: m.text || m.content || "",
              })),
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
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

    // Heurístico si el LLM no generó texto
    if (!parsedResult.texto || parsedResult.texto.trim().length < 10) {
      if (esSaludo) {
        parsedResult.texto = "¡Hola! 👋 Bienvenido a la Agenda Cultural de Loja, la capital musical del Ecuador. ¿Qué buscas? Puedo orientarte sobre eventos, lugares, gastronomía o dónde hospedarte.";
      } else if (esHospedaje) {
        parsedResult.texto = "Aquí tienes excelentes opciones de hospedaje en Loja con reserva directa por WhatsApp:";
        if (parsedResult.aliadosRecomendadosIds.length === 0) {
          parsedResult.aliadosRecomendadosIds = aliados.slice(0, 3).map((a) => a.id);
        }
      } else if (rangoFecha) {
        if (eventosEnFecha.length > 0) {
          parsedResult.texto = `🎭 Para el ${rangoFecha.etiqueta} tenemos estos eventos destacados en cartelera:`;
          parsedResult.eventosRecomendadosIds = eventosEnFecha.slice(0, 4).map((e) => e.id);
        } else {
          parsedResult.texto = `Para el ${rangoFecha.etiqueta} no tenemos eventos registrados en cartelera por el momento. Te recomendamos pasear por la Calle Lourdes o la Puerta de la Ciudad.`;
          parsedResult.eventosRecomendadosIds = [];
        }
      } else if (esEvento) {
        parsedResult.texto = "¡Loja vibra con su cartelera cultural! Aquí tienes los eventos destacados próximos:";
        parsedResult.eventosRecomendadosIds = eventosGenerales.slice(0, 4).map((e) => e.id);
      } else if (esNaturaleza) {
        parsedResult.texto = "Loja y sus cantones son un paraíso natural. Te recomiendo estos atractivos cercanos:";
        parsedResult.atractivosRecomendadosIds = atractivos.slice(0, 3).map((at) => at.id);
      } else {
        parsedResult.texto = "¡Con gusto te ayudo! Loja tiene mucho que ofrecer: eventos culturales, lugares emblemáticos, gastronomía típica y excelentes opciones de hospedaje. ¿Qué te interesa explorar?";
      }
    }

    // Regla estricta para rango de fecha:
    if (rangoFecha) {
      if (eventosEnFecha.length === 0) {
        // No hay eventos para esa fecha: NUNCA mostrar tarjetas de eventos de otros días
        parsedResult.eventosRecomendadosIds = [];
      } else if (parsedResult.eventosRecomendadosIds.length === 0) {
        parsedResult.eventosRecomendadosIds = eventosEnFecha.slice(0, 4).map((e) => e.id);
      }
    } else if (esEvento && parsedResult.eventosRecomendadosIds.length === 0 && eventosGenerales.length > 0) {
      parsedResult.eventosRecomendadosIds = eventosGenerales.slice(0, 4).map((e) => e.id);
    }

    if (esHospedaje && parsedResult.aliadosRecomendadosIds.length === 0) {
      parsedResult.aliadosRecomendadosIds = aliados
        .filter((a) => a.tipo === "HOSPEDAJE" || a.tipo === "GASTRONOMIA")
        .slice(0, 3)
        .map((a) => a.id);
      if (parsedResult.aliadosRecomendadosIds.length === 0) {
        parsedResult.aliadosRecomendadosIds = aliados.slice(0, 3).map((a) => a.id);
      }
    }

    const aliadoEspecifico = aliados.find((a) =>
      lowerUser.includes(a.nombre.toLowerCase()) ||
      (a.nombre.toLowerCase().includes("gran victoria") && lowerUser.includes("victoria")) ||
      (a.nombre.toLowerCase().includes("puerta del sol") && lowerUser.includes("puerta del sol"))
    );
    if (aliadoEspecifico) {
      parsedResult.aliadosRecomendadosIds = [aliadoEspecifico.id];
      const textoGenerico = !parsedResult.texto || parsedResult.texto.trim().length < 20 || parsedResult.texto === "Aquí tienes la información:";
      if (textoGenerico) {
        parsedResult.texto = `¡Excelente elección! ${aliadoEspecifico.nombre} se ubica en ${aliadoEspecifico.ubicacion}. Cuenta con ${aliadoEspecifico.cuartos || "habitaciones confortables"}, precios ${aliadoEspecifico.rangoPrecio || "a consultar"} e incluye: ${aliadoEspecifico.servicios || "servicios de calidad"}. Puedes reservar directamente por WhatsApp.`;
      }
    }

    if (esNaturaleza && parsedResult.atractivosRecomendadosIds.length === 0 && atractivos.length > 0) {
      parsedResult.atractivosRecomendadosIds = atractivos.slice(0, 3).map((at) => at.id);
    }

    const poolEventos = rangoFecha ? eventosEnFecha : eventosGenerales;
    const fullEventos = poolEventos.filter((e) =>
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
