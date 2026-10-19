import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * 🍲 API ENDPOINT PÚBLICO: /api/eventos/gastronomicos
 * 
 * Diseñado específicamente para sincronización en tiempo real con quecomerenloja.com
 * y aplicaciones aliadas del ecosistema de Loja.
 * 
 * Características clave:
 * 1. Purga determinista automática: Solo entrega eventos cuya fecha/fechaFin sea >= now - 2h.
 * 2. Formato sindicado anti-canibalización: Incluye canonicalUrl, badge temporal y resumen.
 * 3. Cache-Control Stale-While-Revalidate: Para máximo rendimiento sin saturar la BD.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 12, 1), 50);

    // Purga determinista: ahora menos 2 horas
    const umbralPurga = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const eventos = await prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        categoria: {
          slug: "eventos-gastronomicos",
        },
        OR: [
          { fechaFin: { gte: umbralPurga } },
          { fecha: { gte: umbralPurga } },
        ],
      },
      orderBy: { fecha: "asc" },
      take: limit,
      select: {
        id: true,
        nombre: true,
        slug: true,
        fecha: true,
        fechaFin: true,
        lugar: true,
        descripcion: true,
        imagenUrl: true,
        mapaUrl: true,
        nombreGestor: true,
        zona: {
          select: {
            nombre: true,
            tipo: true,
          },
        },
      },
    });

    // Formatear payload optimizado para Que Comer en Loja
    const sindicacion = eventos.map((ev) => {
      const canonicalUrl = `${SITE_CONFIG.url}/eventos/${ev.slug}`;
      const fInicio = new Date(ev.fecha);
      const fFin = ev.fechaFin ? new Date(ev.fechaFin) : null;
      
      // Clasificación semántica de chip
      const texto = `${ev.nombre} ${ev.descripcion} ${ev.lugar}`.toLowerCase();
      let tipoEvento = "feria";
      if (texto.includes("ruta") || texto.includes("cafe") || texto.includes("café") || texto.includes("cacao")) {
        tipoEvento = "ruta";
      } else if (texto.includes("festival") || texto.includes("concurso") || texto.includes("cata") || texto.includes("degustaci")) {
        tipoEvento = "festival";
      }

      return {
        id: ev.id,
        nombre: ev.nombre,
        slug: ev.slug,
        fechaInicio: ev.fecha.toISOString(),
        fechaFin: ev.fechaFin ? ev.fechaFin.toISOString() : null,
        lugar: ev.lugar,
        resumen: ev.descripcion.length > 220 ? `${ev.descripcion.slice(0, 217)}...` : ev.descripcion,
        descripcionCompleta: ev.descripcion,
        imagenUrl: ev.imagenUrl,
        mapaUrl: ev.mapaUrl,
        organizador: ev.nombreGestor,
        parroquia: ev.zona?.nombre ?? "Loja",
        tipoEvento,
        canonicalUrl,
        flywheelLink: `${canonicalUrl}?ref=quecomerenloja`,
      };
    });

    const response = NextResponse.json({
      success: true,
      fuente: "Agenda Cultural Loja (agendaculturalloja.com)",
      total: sindicacion.length,
      timestamp: new Date().toISOString(),
      eventos: sindicacion,
    });

    // Headers CORS abiertos para el ecosistema de Loja
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

    return response;
  } catch (error: any) {
    console.error("Error en GET /api/eventos/gastronomicos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error al sincronizar eventos gastronómicos",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
