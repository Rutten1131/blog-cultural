"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/actions/authAdmin";

export async function crearBannerHero(formData: FormData) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPERADMIN") {
    return { error: "No autorizado. Solo el superadmin puede gestionar banners." };
  }

  const titulo = (formData.get("titulo")?.toString() ?? "").trim();
  const subtitulo = (formData.get("subtitulo")?.toString() ?? "").trim() || null;
  const link = (formData.get("link")?.toString() ?? "").trim() || "/eventos";
  const botonTexto = (formData.get("botonTexto")?.toString() ?? "").trim() || "Ver evento";
  const imagenDesktop = (formData.get("imagenDesktop")?.toString() ?? "").trim();
  const imagenMobile = (formData.get("imagenMobile")?.toString() ?? "").trim() || null;
  const orden = parseInt(formData.get("orden")?.toString() ?? "0", 10) || 0;
  const activo = formData.get("activo") === "true" || formData.get("activo") === "on";

  if (!titulo) {
    return { error: "El título es obligatorio." };
  }
  if (!imagenDesktop) {
    return { error: "La imagen para escritorio (Desktop) es obligatoria." };
  }

  try {
    await prisma.bannerHero.create({
      data: {
        titulo,
        subtitulo,
        link,
        botonTexto,
        imagenDesktop,
        imagenMobile,
        orden,
        activo,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error al crear banner hero:", err);
    return { error: err.message || "Error al crear el banner." };
  }
}

export async function actualizarBannerHero(id: number, formData: FormData) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPERADMIN") {
    return { error: "No autorizado." };
  }

  const titulo = (formData.get("titulo")?.toString() ?? "").trim();
  const subtitulo = (formData.get("subtitulo")?.toString() ?? "").trim() || null;
  const link = (formData.get("link")?.toString() ?? "").trim() || "/eventos";
  const botonTexto = (formData.get("botonTexto")?.toString() ?? "").trim() || "Ver evento";
  const imagenDesktop = (formData.get("imagenDesktop")?.toString() ?? "").trim();
  const imagenMobile = (formData.get("imagenMobile")?.toString() ?? "").trim() || null;
  const orden = parseInt(formData.get("orden")?.toString() ?? "0", 10) || 0;
  const activo = formData.get("activo") === "true" || formData.get("activo") === "on";

  if (!titulo) {
    return { error: "El título es obligatorio." };
  }
  if (!imagenDesktop) {
    return { error: "La imagen para escritorio es obligatoria." };
  }

  try {
    await prisma.bannerHero.update({
      where: { id },
      data: {
        titulo,
        subtitulo,
        link,
        botonTexto,
        imagenDesktop,
        imagenMobile,
        orden,
        activo,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error al actualizar banner hero:", err);
    return { error: err.message || "Error al actualizar el banner." };
  }
}

export async function toggleBannerActivo(id: number, activoActual: boolean) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPERADMIN") {
    return { error: "No autorizado." };
  }

  try {
    await prisma.bannerHero.update({
      where: { id },
      data: { activo: !activoActual },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error toggle banner:", err);
    return { error: "No se pudo cambiar el estado del banner." };
  }
}

export async function eliminarBannerHero(id: number) {
  const session = await getAdminSession();
  if (!session || session.role !== "SUPERADMIN") {
    return { error: "No autorizado." };
  }

  try {
    await prisma.bannerHero.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error al eliminar banner:", err);
    return { error: "No se pudo eliminar el banner." };
  }
}
