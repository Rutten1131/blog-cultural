"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "./authAdmin";

export interface InstitucionActionState {
  success: boolean;
  error?: string;
}

// Helper para generar slug simple
function generarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Crear una nueva institución
export async function crearInstitucion(
  _prevState: InstitucionActionState,
  formData: FormData
): Promise<InstitucionActionState> {
  const session = await getAdminSession();
  if (session?.role !== "SUPERADMIN") {
    return { success: false, error: "Solo el Administrador General puede crear instituciones." };
  }

  const nombre = formData.get("nombre")?.toString().trim() ?? "";
  const slugInput = formData.get("slug")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString().trim() ?? "";

  if (!nombre || !password) {
    return { success: false, error: "El nombre y la contraseña son obligatorios." };
  }

  const slug = slugInput ? generarSlug(slugInput) : generarSlug(nombre);

  try {
    await prisma.institucion.create({
      data: {
        nombre,
        slug,
        password,
        activa: true,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/publicar");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "Ya existe una institución con ese nombre o usuario/slug." };
    }
    console.error("Error creando institución:", error);
    return { success: false, error: "Error al registrar la institución." };
  }
}

// Modificar contraseña o datos de una institución
export async function actualizarPasswordInstitucion(
  id: number,
  nuevaPassword: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getAdminSession();
  if (session?.role !== "SUPERADMIN") {
    return { success: false, error: "No autorizado." };
  }

  if (!nuevaPassword || nuevaPassword.trim().length < 4) {
    return { success: false, error: "La contraseña debe tener al menos 4 caracteres." };
  }

  try {
    await prisma.institucion.update({
      where: { id },
      data: { password: nuevaPassword.trim() },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("Error actualizando password:", err);
    return { success: false, error: "Error al actualizar contraseña." };
  }
}

// Activar o desactivar institución
export async function toggleInstitucionActiva(
  id: number,
  activa: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await getAdminSession();
  if (session?.role !== "SUPERADMIN") {
    return { success: false, error: "No autorizado." };
  }

  try {
    await prisma.institucion.update({
      where: { id },
      data: { activa },
    });
    revalidatePath("/admin");
    revalidatePath("/publicar");
    return { success: true };
  } catch (err) {
    console.error("Error cambiando estado institución:", err);
    return { success: false, error: "Error al modificar estado." };
  }
}
