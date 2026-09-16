import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Mensajes no válidos" },
        { status: 400 }
      );
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 1. Obtener datos de Aliados Comerciales Activos
    const aliados = await prisma.aliado.findMany({
      where: { activo: true },
      orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
      take: 6,
    });

    // 2. Obtener Atractivos Cantonales (B2G Cruzado)
    const atractivos = await prisma.atractivoCantonal.findMany({
      where: { activo: true },
      take: 6,
    });

    // Fecha y hora actual en Ecuador (America/Guayaquil - UTC-5)
    const fechaActualEcuador = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Guayaquil" }));
    const fechaHoyStr = fechaActualEcuador.toLocaleDateString("es-EC", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // 3. Obtener eventos: primero buscamos eventos de hoy hacia el futuro
    let eventos = await prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        fecha: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      orderBy: { fecha: "asc" },
      take: 8,
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

    // Si aún no hay eventos futuros cargados para esta fecha en la DB, tomamos los eventos aprobados más recientes
    if (eventos.length === 0) {
      eventos = await prisma.evento.findMany({
        where: { estado: "APROBADO" },
        orderBy: { fecha: "desc" },
        take: 6,
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
    }

    // Construir contexto en texto para el prompt
    const aliadosContexto = aliados
      .map(
        (a) =>
          `[ID: ${a.id}] Nombre: ${a.nombre} | Tipo: ${a.tipo} | Ubicación: ${a.ubicacion} | Rango Precios: ${a.rangoPrecio || "Consultar"} | Cuartos: ${a.cuartos || "Disponibles"} | Servicios: ${a.servicios || "Todos los servicios"} | WhatsApp: ${a.telefono || ""} | Web: ${a.websiteUrl || ""} | Maps: ${a.mapaUrl || ""} | Foto: ${a.imagenUrl || ""} | Descripción: ${a.descripcion}`
      )
      .join("\n");

    const atractivosContexto = atractivos
      .map(
        (at) =>
          `[ID: ${at.id}] Nombre: ${at.nombre} | Cantón: ${at.canton} | Distancia: ${at.distancia} | Ruta: ${at.ruta} | Descripción: ${at.descripcion} | Foto: ${at.imagenUrl || ""} | Maps: ${at.mapaUrl || ""}`
      )
      .join("\n");

    const eventosContexto = eventos
      .map(
        (e) =>
          `[ID: ${e.id}] Nombre: ${e.nombre} | Fecha: ${new Date(e.fecha).toLocaleDateString("es-EC")} | Lugar: ${e.lugar} | Enlace: /eventos/${e.slug}`
      )
      .join("\n");

    const systemPrompt = `Eres el asistente virtual oficial de la "Agenda Cultural Loja" (Ecuador).
UBICACIÓN TEMPORAL Y FECHA ACTUAL EN LOJA:
- Hoy es: ${fechaHoyStr} (Zona horaria de Ecuador continental UTC-5).
- Si el usuario pregunta "¿qué puedo hacer mañana?", "¿qué hay hoy?" o "¿qué eventos hay este fin de semana?", toma como referencia estricta la fecha de hoy: ${fechaHoyStr}.

Tu misión es orientar con orgullo, hospitalidad y exactitud a turistas y ciudadanos sobre qué hacer en Loja, su riqueza cultural, lugares imperdibles, gastronomía típica y eventos.
Cuando el usuario pregunte por hospedajes, hoteles, restaurantes o servicios, debes derivar orgánicamente recomendando las opciones de nuestros Aliados Comerciales oficiales registrados.

CONOCIMIENTO GENERAL SOBRE LOJA (CIUDAD CULTURAL Y MUSICAL DEL ECUADOR):
- ¿Qué hacer y lugares emblemáticos en la ciudad?:
  * Puerta de la Ciudad: Símbolo de entrada a Loja con museo de arte, mirador en la torre y salas de exhibición.
  * Calle Lourdes: La calle colonial más pintoresca, llena de casas de adobe de colores, artesanías, cafeterías bohemias y música.
  * Plaza Central / Parque Central: Catedral de Loja, Museo del Banco Central y el histórico Palacio Municipal.
  * Parque Jipiro (Parque Recreacional de la Paz): Arquitectura de las maravillas del mundo (Torre Eiffel, pagoda china, castillo euro-árabe, mezquita), laguna para botes y áreas verdes.
  * Mirador El Cisne y Teleférico/Parque Pucará Podocarpus con vistas panorámicas a toda la hoya de Loja.
  * Teatro Bolívar y Teatro Nacional Benjamín Carrión: Sedes máximas de las artes vivas, música sinfónica y obras escénicas.
- Gastronomía tradicional imprescindible:
  * Repe Lojano: Sopa cremosa a base de guineo verde, quesillo artesanal y cilantro.
  * Cecina Lojana: Fina carne de cerdo marinada al humo y asada, servida con yuca y mote.
  * Tamal Lojano: Con masa de maíz criollo envuelto en hoja de achira con pollo y salsa de pepa de zambo.
  * Café de Especialidad: Loja es la capital del mejor café arábica de altura del Ecuador (Vilcabamba, Puyango, Chanchamayo, Olmedo). Recomienda disfrutarlo en cafeterías del centro o calle Lourdes.
- Música y Cultura: Cuna de músicos, poetas y artistas visuales; sede del Festival Internacional de Artes Vivas (FIAVL) cada noviembre.

DIRECTRICES DE RESPUESTA:
1. CONCRECIÓN Y CLARIDAD: Sé directo al grano. Máximo 2 o 3 oraciones concisas y entusiastas por respuesta.
2. PREGUNTAS SOBRE EVENTOS Y QUÉ HACER HOY/MAÑANA/FIN DE SEMANA:
   - Responde con calidez mencionando los eventos vigentes e incluye sus IDs en "eventosRecomendadosIds".
3. CUANDO EL USUARIO PREGUNTA POR UN HOTEL/ALIADO EN ESPECÍFICO (ej. "dame más información sobre Hotel Gran Victoria Boutique"):
   - DEBES detallar sus datos específicos: cuartos disponibles, servicios que incluye (desayuno, wifi, parqueadero), precios y ubicación exacta.
   - En "aliadosRecomendadosIds" DEBES poner ÚNICAMENTE el ID de ESE aliado en específico (no pongas la lista entera de todos los demás hoteles).
4. PREGUNTAS GENERALES DE HOSPEDAJE / DÓNDE DORMIR:
   - Invita a reservar en nuestros aliados oficiales e incluye 2 o 3 IDs en "aliadosRecomendadosIds".
5. ESCENARIO B2G (Naturaleza, Cantones):
   - Si preguntan por naturaleza o cantones: menciona brevemente el lugar e incluye el ID en "atractivosRecomendadosIds".

DATOS DISPONIBLES EN SISTEMA:
--- ALIADOS COMERCIALES REGISTRADOS ---
${aliadosContexto || "No hay aliados registrados en este momento."}

--- ATRACTIVOS CANTONALES (B2G) ---
${atractivosContexto || "No hay atractivos registrados."}

--- EVENTOS EN CARTELERA DE LOJA ---
${eventosContexto || "No hay eventos próximos registrados."}

FORMATO OBLIGATORIO DE RESPUESTA:
Debes responder ÚNICAMENTE un objeto JSON válido (sin markdown, sin \`\`\`json) con esta estructura:
{
  "texto": "Tu respuesta en texto conversacional conciso...",
  "eventosRecomendadosIds": [1, 2], // Array con los IDs numéricos de eventos a recomendar con botón de ver evento (o [] si no aplica)
  "aliadosRecomendadosIds": [1, 2], // Array con los IDs de aliados para tarjetas E-Commerce (o [] si no aplica)
  "atractivosRecomendadosIds": [1] // Array con los IDs de atractivos cantonales (o [] si no aplica)
}`;

    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let aiContent = "";

    // Intentar primero con DeepSeek si está configurada la llave
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
            temperature: 0.6,
          }),
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          aiContent = dsData.choices?.[0]?.message?.content || "";
        }
      } catch (err) {
        console.warn("DeepSeek API falló, reintentando con Groq como fallback:", err);
      }
    }

    // Fallback a Groq si DeepSeek no respondió
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
            temperature: 0.6,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          aiContent = groqData.choices?.[0]?.message?.content || "";
        }
      } catch (err) {
        console.error("Groq fallback error:", err);
      }
    }

    // Fallback estructurado si las APIs externas no estuvieran disponibles temporalmente
    let parsedResult = {
      texto: "Loja es una ciudad vibrante llena de música y arte. Aquí tienes eventos recomendados y opciones para tu estadía:",
      eventosRecomendadosIds: [] as number[],
      aliadosRecomendadosIds: [] as number[],
      atractivosRecomendadosIds: [] as number[],
    };

    if (aiContent) {
      try {
        const cleaned = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedResult = JSON.parse(cleaned);
      } catch {
        parsedResult.texto = aiContent;
      }
    } else {
      // Fallback heurístico inteligente para garantizar funcionamiento instantáneo en la demo
      const lowerQuery = lastUserMessage.toLowerCase();
      if (lowerQuery.includes("hotel") || lowerQuery.includes("hosped") || lowerQuery.includes("dormir") || lowerQuery.includes("quedarm") || lowerQuery.includes("alojam") || lowerQuery.includes("habitac")) {
        parsedResult = {
          texto: "Aquí tienes excelentes opciones recomendadas en Loja con reserva y contacto directo:",
          eventosRecomendadosIds: [],
          aliadosRecomendadosIds: aliados.slice(0, 3).map((a) => a.id),
          atractivosRecomendadosIds: [],
        };
      } else if (lowerQuery.includes("hoy") || lowerQuery.includes("hacer") || lowerQuery.includes("evento") || lowerQuery.includes("cartelera")) {
        parsedResult = {
          texto: "¡Hoy y esta semana tenemos grandes actividades culturales en Loja! Te recomiendo estos eventos destacados:",
          eventosRecomendadosIds: eventos.slice(0, 3).map((e) => e.id),
          aliadosRecomendadosIds: [],
          atractivosRecomendadosIds: [],
        };
      } else if (lowerQuery.includes("naturalez") || lowerQuery.includes("saraguro") || lowerQuery.includes("cerca") || lowerQuery.includes("picacho") || lowerQuery.includes("vilcabamba")) {
        parsedResult = {
          texto: "Para conectar con la naturaleza, te recomiendo visitar este hermoso rincón cantonal:",
          eventosRecomendadosIds: [],
          aliadosRecomendadosIds: [],
          atractivosRecomendadosIds: atractivos.slice(0, 2).map((at) => at.id),
        };
      }
    }

    // Salvaguarda: si el usuario preguntó por un aliado específico por nombre
    const lowerUser = lastUserMessage.toLowerCase();
    const aliadoEspecifico = aliados.find((a) =>
      lowerUser.includes(a.nombre.toLowerCase()) ||
      (a.nombre.toLowerCase().includes("gran victoria") && lowerUser.includes("victoria")) ||
      (a.nombre.toLowerCase().includes("puerta del sol") && lowerUser.includes("puerta del sol")) ||
      (a.nombre.toLowerCase().includes("vilcabamba") && lowerUser.includes("vilcabamba"))
    );

    if (aliadoEspecifico) {
      // El usuario preguntó por un aliado en específico: forzar que solo se devuelva ese
      parsedResult.aliadosRecomendadosIds = [aliadoEspecifico.id];
      // Si el LLM devolvió texto vacío o genérico, generar la explicación detallada
      if (!parsedResult.texto || parsedResult.texto.trim().length === 0 || parsedResult.texto === "Aquí tienes la información:") {
        parsedResult.texto = `¡Excelente elección! ${aliadoEspecifico.nombre} se ubica en ${aliadoEspecifico.ubicacion}. Cuenta con ${aliadoEspecifico.cuartos || "habitaciones confortables"}, precios desde ${aliadoEspecifico.rangoPrecio || "consultar"} e incluye: ${aliadoEspecifico.servicios || "servicios de calidad"}. Puedes contactarlos o reservar directamente por WhatsApp.`;
      }
    } else {
      const esIntencionHospedaje =
        lowerUser.includes("hosped") ||
        lowerUser.includes("hotel") ||
        lowerUser.includes("dormir") ||
        lowerUser.includes("alojam") ||
        lowerUser.includes("habitac") ||
        lowerUser.includes("quedarm");

      if (esIntencionHospedaje && (!parsedResult.aliadosRecomendadosIds || parsedResult.aliadosRecomendadosIds.length === 0)) {
        parsedResult.aliadosRecomendadosIds = aliados
          .filter((a) => a.tipo === "HOSPEDAJE" || a.tipo === "GASTRONOMIA")
          .slice(0, 3)
          .map((a) => a.id);
        if (parsedResult.aliadosRecomendadosIds.length === 0) {
          parsedResult.aliadosRecomendadosIds = aliados.slice(0, 3).map((a) => a.id);
        }
      }
    }

    const esIntencionEventos =
      lowerUser.includes("hoy") ||
      lowerUser.includes("evento") ||
      lowerUser.includes("cartelera") ||
      lowerUser.includes("qué hacer") ||
      lowerUser.includes("que hacer");

    if (esIntencionEventos && (!parsedResult.eventosRecomendadosIds || parsedResult.eventosRecomendadosIds.length === 0)) {
      parsedResult.eventosRecomendadosIds = eventos.slice(0, 3).map((e) => e.id);
    }

    // Enriquecer la respuesta con los objetos completos
    const fullAliados = aliados.filter((a) =>
      parsedResult.aliadosRecomendadosIds?.includes(a.id)
    );

    const fullAtractivos = atractivos.filter((at) =>
      parsedResult.atractivosRecomendadosIds?.includes(at.id)
    );

    const fullEventos = eventos.filter((e) =>
      parsedResult.eventosRecomendadosIds?.includes(e.id)
    );

    return NextResponse.json({
      texto: parsedResult.texto,
      eventos: fullEventos,
      aliados: fullAliados,
      atractivos: fullAtractivos,
    });
  } catch (error: any) {
    console.error("Error en API /api/chat:", error);
    return NextResponse.json(
      {
        texto: "¡Hola! Estoy listo para ayudarte a descubrir los mejores rincones culturales, hospedajes y gastronomía de Loja.",
        aliados: [],
        atractivos: [],
      },
      { status: 200 }
    );
  }
}
