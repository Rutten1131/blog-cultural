import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reprogramar-redes
 * Reprograma en el calendario de redes sociales (Vercel) todos los eventos
 * APROBADOS en los próximos `dias` días que aún no fueron enviados.
 *
 * Body (opcional): { dias: 14, adminPassword: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const adminPassword = body.adminPassword || request.headers.get("x-admin-password") || "";

    if (adminPassword !== (process.env.ADMIN_PASSWORD || "admin123_loja")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const dias = Math.min(Number(body.dias) || 14, 60);

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const fechaLimite = new Date(Date.now() + dias * 24 * 3600 * 1000);

    const eventos = await prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        fecha: {
          gte: inicioHoy,
          lte: fechaLimite,
        },
      },
      orderBy: { fecha: "asc" },
      take: 50,
      select: { id: true, nombre: true, fecha: true },
    });

    if (eventos.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: `No hay eventos APROBADOS en los próximos ${dias} días para reprogramar.`,
        total: 0,
        resultados: [],
      });
    }

    const { programarPublicacionEnRedes } = await import("@/lib/redesSociales");

    const resultados: Array<{ id: number; nombre: string; success: boolean; motivo?: string }> = [];

    for (const evento of eventos) {
      const res = await programarPublicacionEnRedes({ eventoId: evento.id, forzar: true });
      resultados.push({
        id: evento.id,
        nombre: evento.nombre,
        success: res.success,
        motivo: res.motivo || res.error,
      });
    }

    const exitosos = resultados.filter((r) => r.success).length;
    const fallidos = resultados.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      mensaje: `Reprogramación completada: ${exitosos} enviados, ${fallidos} fallidos.`,
      total: eventos.length,
      exitosos,
      fallidos,
      resultados,
    });
  } catch (error: any) {
    console.error("[REPROGRAMAR_REDES] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error interno" },
      { status: 500 }
    );
  }
}
