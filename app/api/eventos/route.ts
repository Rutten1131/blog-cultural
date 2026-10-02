import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/eventos
 * Consulta pública/interna de eventos filtrados para el bot y la plataforma.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fechaDesde = searchParams.get("fechaDesde");
    const fechaHasta = searchParams.get("fechaHasta");
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    const where: any = {
      estado: "APROBADO",
    };

    if (fechaDesde && fechaHasta) {
      where.fecha = {
        gte: new Date(`${fechaDesde}T00:00:00.000Z`),
        lte: new Date(`${fechaHasta}T23:59:59.999Z`),
      };
    } else if (fechaDesde) {
      where.fecha = {
        gte: new Date(`${fechaDesde}T00:00:00.000Z`),
      };
    }

    let eventos = await prisma.evento.findMany({
      where,
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
        categoria: { select: { nombre: true, slug: true } },
        zona: { select: { nombre: true } },
      },
    });

    // Fallback: si no hay eventos en ese rango exacto, traer los más próximos hacia adelante
    if (eventos.length === 0) {
      eventos = await prisma.evento.findMany({
        where: { estado: "APROBADO" },
        orderBy: { fecha: "desc" },
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
          categoria: { select: { nombre: true, slug: true } },
          zona: { select: { nombre: true } },
        },
      });
    }

    return NextResponse.json({
      success: true,
      total: eventos.length,
      eventos,
    });
  } catch (error: any) {
    console.error("Error en GET /api/eventos:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error interno al consultar eventos" },
      { status: 500 }
    );
  }
}
