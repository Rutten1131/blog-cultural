import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      aliadoId,
      nombreCliente,
      telefonoCliente,
      fechaInicio,
      fechaFin,
      numPersonas,
      detalle,
    } = body;

    if (!aliadoId || !nombreCliente || !telefonoCliente) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: aliado, nombre y teléfono." },
        { status: 400 }
      );
    }

    const aliado = await prisma.aliado.findUnique({
      where: { id: Number(aliadoId) },
      select: { id: true, nombre: true, telefono: true, tipo: true },
    });

    if (!aliado) {
      return NextResponse.json(
        { error: "El aliado comercial especificado no existe." },
        { status: 404 }
      );
    }

    // 1. Guardar solicitud en base de datos
    const db = prisma as any;
    const solicitud = db.solicitudReserva
      ? await db.solicitudReserva.create({
          data: {
            sessionId: sessionId || null,
            aliadoId: aliado.id,
            nombreCliente: String(nombreCliente).trim(),
            telefonoCliente: String(telefonoCliente).trim(),
            fechaInicio: fechaInicio ? String(fechaInicio).trim() : null,
            fechaFin: fechaFin ? String(fechaFin).trim() : null,
            numPersonas: Number(numPersonas) || 1,
            detalle: detalle ? String(detalle).trim() : null,
            estado: "PENDIENTE",
          },
        })
      : { id: Date.now() };

    // 2. Si la sesión existe, guardar también el nombre de cliente en la sesión
    if (sessionId) {
      await prisma.chatSession.update({
        where: { sessionId },
        data: { nombreUsuario: String(nombreCliente).trim() },
      }).catch(() => null);

      // Registrar mensaje en el historial del chat
      const textoConfirmacion = `📋 Solicitud de reserva registrada para ${aliado.nombre} a nombre de ${nombreCliente}.`;
      await prisma.chatMessage.create({
        data: {
          sessionId,
          sender: "bot",
          contenido: textoConfirmacion,
          aliadosIds: [aliado.id],
        },
      }).catch(() => null);
    }

    // 3. Preparar enlace de WhatsApp para nosotros o para el aliado con todo redactado
    const telLimpio = aliado.telefono ? aliado.telefono.replace(/[^\d]/g, "") : "";
    const tipoLabel = aliado.tipo === "HOSPEDAJE" ? "Hotel" : aliado.tipo === "CAFETERIA" ? "Cafetería" : "Restaurante";
    const fechasTexto = fechaInicio
      ? `Fecha: ${fechaInicio}${fechaFin ? ` hasta ${fechaFin}` : ""}`
      : "Fechas a coordinar";

    const mensajeReserva = encodeURIComponent(
      `🔔 *NUEVA RESERVA — AGENDA CULTURAL LOJA*\n\n` +
      `👤 *Cliente:* ${nombreCliente}\n` +
      `📱 *Teléfono:* ${telefonoCliente}\n` +
      `🏢 *${tipoLabel}:* ${aliado.nombre}\n` +
      `👥 *Personas:* ${numPersonas || 1}\n` +
      `📅 *${fechasTexto}*\n` +
      (detalle ? `📝 *Detalle/Preferencia:* ${detalle}\n\n` : "\n") +
      `Por favor confirmar disponibilidad.`
    );

    const whatsappUrl = telLimpio
      ? `https://wa.me/${telLimpio}?text=${mensajeReserva}`
      : null;

    return NextResponse.json({
      ok: true,
      solicitudId: solicitud.id,
      aliadoNombre: aliado.nombre,
      whatsappUrl,
      mensaje: "¡Solicitud registrada exitosamente!",
    });
  } catch (error: any) {
    console.error("Error al registrar solicitud de reserva:", error);
    return NextResponse.json(
      { error: "Error al procesar la reserva." },
      { status: 500 }
    );
  }
}
