"use server";

import { prisma } from "@/lib/prisma";

export interface CrearRecomendacionState {
  success: boolean;
  error?: string;
}

export async function crearRecomendacion(
  _prevState: CrearRecomendacionState,
  formData: FormData
): Promise<CrearRecomendacionState> {
  const mensaje = formData.get("mensaje")?.toString().trim() ?? "";
  const contacto = formData.get("contacto")?.toString().trim() || null;

  if (!mensaje || mensaje.length < 5) {
    return {
      success: false,
      error: "Por favor comparte una recomendación o sugerencia con un poco más de detalle.",
    };
  }

  try {
    await prisma.recomendacion.create({
      data: {
        mensaje,
        contacto,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al guardar recomendación:", error);
    return {
      success: false,
      error: "No pudimos enviar tu mensaje en este momento. Por favor inténtalo de nuevo.",
    };
  }
}
