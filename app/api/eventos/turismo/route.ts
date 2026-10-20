import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { resolverCantonEvento, CANTONES_LOJA } from "@/lib/geoCanton";

export const dynamic = "force-dynamic";

/**
 * 🗺️ API ENDPOINT PARA AGENDATURISTICALOJA.COM
 * GET /api/eventos/turismo
 * 
 * Parámetros:
 * - canton: slug del cantón (ej: "catamayo", "saraguro", "loja", "zapotillo") o "todos"
 * - limit: número máximo de eventos (def: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cantonFiltro = searchParams.get("canton")?.toLowerCase().trim() || "todos";
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);

    // Purga determinista automática: ahora menos 2 horas
    const umbralPurga = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Consultamos eventos vigentes de la cartelera
    const eventos = await prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        OR: [
          { fechaFin: { gte: umbralPurga } },
          { fecha: { gte: umbralPurga } },
        ],
      },
      orderBy: { fecha: "asc" },
      take: 150, // Traemos una bolsa suficiente para filtrar por cantón
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
        categoria: {
          select: {
            slug: true,
            nombre: true,
          },
        },
        zona: {
          select: {
            nombre: true,
            tipo: true,
          },
        },
      },
    });

    // Enriquecer cada evento con su cantón resuelto deterministamente
    const eventosConCanton = eventos.map((ev) => {
      const canton = resolverCantonEvento({
        lugar: ev.lugar,
        parroquiaNombre: ev.zona?.nombre,
        nombre: ev.nombre,
        descripcion: ev.descripcion,
      });

      const canonicalUrl = `${SITE_CONFIG.url}/eventos/${ev.slug}`;

      return {
        id: ev.id,
        nombre: ev.nombre,
        slug: ev.slug,
        fechaInicio: ev.fecha.toISOString(),
        fechaFin: ev.fechaFin ? ev.fechaFin.toISOString() : null,
        lugar: ev.lugar,
        resumen: ev.descripcion.length > 200 ? `${ev.descripcion.slice(0, 197)}...` : ev.descripcion,
        imagenUrl: ev.imagenUrl,
        mapaUrl: ev.mapaUrl,
        organizador: ev.nombreGestor,
        categoria: ev.categoria?.nombre ?? "Cultura",
        categoriaSlug: ev.categoria?.slug ?? "cultura",
        parroquia: ev.zona?.nombre ?? null,
        canton: {
          slug: canton.slug,
          nombre: canton.nombre,
        },
        canonicalUrl,
        flywheelLink: `${canonicalUrl}?ref=agendaturistica_${canton.slug}`,
      };
    });

    // Filtrar por cantón si no se solicitó "todos"
    const eventosFiltrados = cantonFiltro === "todos"
      ? eventosConCanton
      : eventosConCanton.filter((ev) => ev.canton.slug === cantonFiltro);

    // Resumen de cantidad de eventos por cantón para la Home de Turismo
    const conteoPorCanton: Record<string, number> = {};
    for (const c of CANTONES_LOJA) {
      conteoPorCanton[c.slug] = 0;
    }
    for (const ev of eventosConCanton) {
      conteoPorCanton[ev.canton.slug] = (conteoPorCanton[ev.canton.slug] || 0) + 1;
    }

    const payload = {
      success: true,
      fuente: "Agenda Cultural Loja (agendaculturalloja.com)",
      cantonConsultado: cantonFiltro,
      total: eventosFiltrados.slice(0, limit).length,
      totalVigentesProvincia: eventosConCanton.length,
      conteoPorCanton,
      timestamp: new Date().toISOString(),
      eventos: eventosFiltrados.slice(0, limit),
    };

    const response = NextResponse.json(payload);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

    return response;
  } catch (error: any) {
    console.error("Error en GET /api/eventos/turismo:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error al sincronizar eventos cantonales" },
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
