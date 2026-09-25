import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

async function getEventoByToken(token: string) {
  const evento = await prisma.evento.findUnique({
    where: { editToken: token },
    include: { categoria: true, zona: true },
  });

  if (!evento) return { error: "Token inválido o no encontrado", status: 404 };

  const ahora = new Date();
  if (evento.editTokenExpiresAt && evento.editTokenExpiresAt < ahora) {
    return { error: "Este link de edición ya ha expirado (el evento ya concluyó).", status: 410 };
  }

  return { evento, status: 200 };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const resultado = await getEventoByToken(token);

  if ("error" in resultado) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }

  const { evento } = resultado;
  return NextResponse.json({
    id: evento.id,
    nombre: evento.nombre,
    slug: evento.slug,
    fecha: evento.fecha,
    fechaFin: evento.fechaFin,
    lugar: evento.lugar,
    descripcion: evento.descripcion,
    imagenUrl: evento.imagenUrl,
    estado: evento.estado,
    categoria: evento.categoria?.nombre ?? null,
    zona: evento.zona?.nombre ?? null,
    expiresAt: evento.editTokenExpiresAt,
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const resultado = await getEventoByToken(token);

  if ("error" in resultado) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }

  try {
    const body = await req.json();
    const { nombre, fecha, fechaFin, lugar, descripcion, imagenUrl } = body;

    const data: Record<string, unknown> = {};
    if (nombre && typeof nombre === "string") data.nombre = nombre.trim().slice(0, 255);
    if (fecha) {
      const d = new Date(fecha);
      if (!isNaN(d.getTime())) data.fecha = d;
    }
    if (fechaFin !== undefined) {
      if (fechaFin === null || fechaFin === "") {
        data.fechaFin = null;
      } else {
        const d = new Date(fechaFin);
        if (!isNaN(d.getTime())) data.fechaFin = d;
      }
    }
    if (lugar && typeof lugar === "string") data.lugar = lugar.trim().slice(0, 255);
    if (descripcion && typeof descripcion === "string") data.descripcion = descripcion.trim();
    if (imagenUrl && typeof imagenUrl === "string") data.imagenUrl = imagenUrl.trim();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No hay campos válidos para actualizar" }, { status: 400 });
    }

    const updated = await prisma.evento.update({
      where: { id: resultado.evento.id },
      data,
    });

    return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar evento" }, { status: 500 });
  }
}
