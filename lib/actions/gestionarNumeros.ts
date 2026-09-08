"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "./authAdmin";

export interface NumeroNotificacionState {
  success: boolean;
  error?: string;
}

// Crear nuevo número de notificación
export async function agregarNumero(
  _prevState: NumeroNotificacionState,
  formData: FormData
): Promise<NumeroNotificacionState> {
  const session = await getAdminSession();
  const nombre = formData.get("nombre")?.toString().trim() ?? "";
  const numeroRaw = formData.get("numero")?.toString().trim() ?? "";

  // Si se envió institucionId desde form (ej: Superadmin asignando a una institución específica)
  const institucionIdRaw = formData.get("institucionId")?.toString().trim();
  let institucionId: number | null = null;

  if (session?.role === "INSTITUCION" && session.institucionId) {
    institucionId = session.institucionId;
  } else if (institucionIdRaw && institucionIdRaw !== "GENERAL") {
    institucionId = parseInt(institucionIdRaw, 10) || null;
  }

  if (!nombre || !numeroRaw) {
    return { success: false, error: "El nombre y el número son obligatorios." };
  }

  // Limpiar número: extraer solo dígitos (remueve +, espacios, guiones, etc.)
  const numero = numeroRaw.replace(/\D/g, "");
  if (numero.length < 8 || numero.length > 18) {
    return {
      success: false,
      error: "Número inválido. Ingresa el código de país y número (Ej: +5491127886554 o 593987654321).",
    };
  }

  try {
    await prisma.numeroNotificacion.create({
      data: {
        nombre,
        numero,
        institucionId,
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "Ese número ya está registrado." };
    }
    console.error("Error agregando número:", error);
    return { success: false, error: "Error al guardar el número. Intenta de nuevo." };
  }
}

// Eliminar número de notificación
export async function eliminarNumero(id: number): Promise<void> {
  await prisma.numeroNotificacion.delete({ where: { id } });
  revalidatePath("/admin");
}

// Activar / desactivar número
export async function toggleNumero(id: number, activo: boolean): Promise<void> {
  await prisma.numeroNotificacion.update({
    where: { id },
    data: { activo },
  });
  revalidatePath("/admin");
}
