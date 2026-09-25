"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidateAll } from "./revalidate";

/**
 * Aprobar un evento pendiente.
 * Acepta correcciones de categoría y zona desde el panel admin.
 */
export async function aprobarEvento(formData: FormData) {
  const eventoId = Number(formData.get("eventoId"));
  const categoriaId = Number(formData.get("categoriaId")) || null;
  const zonaId = Number(formData.get("zonaId")) || null;

  if (!eventoId) return;

  await prisma.evento.update({
    where: { id: eventoId },
    data: {
      estado: "APROBADO",
      categoriaId,
      zonaId,
    },
  });

  // Notificar a Hermes en el VPS (IA editorial)
  try {
    const { despacharEventoAHermes } = await import("@/lib/hermes");
    await despacharEventoAHermes(eventoId, "evento.aprobado");
  } catch (err) {
    console.error("[MODERACION] Error al notificar a Hermes:", err);
  }

  // Programar publicación en Redes Sociales (Facebook e Instagram de Agenda Cultural)
  try {
    const { programarPublicacionEnRedes } = await import("@/lib/redesSociales");
    await programarPublicacionEnRedes({ eventoId, forzar: true });
  } catch (err) {
    console.error("[MODERACION] Error al programar en Redes Sociales:", err);
  }

  // Revalidar TODAS las rutas (home, listados, ficha, sitemap, etc.)
  revalidateAll();
}

/**
 * Rechazar un evento pendiente.
 */
export async function rechazarEvento(formData: FormData) {
  const eventoId = Number(formData.get("eventoId"));

  if (!eventoId) return;

  await prisma.evento.update({
    where: { id: eventoId },
    data: {
      estado: "RECHAZADO",
    },
  });

  revalidateAll();
}

/**
 * Eliminar definitivamente un evento (cualquier estado).
 */
export async function eliminarEvento(formData: FormData) {
  const eventoId = Number(formData.get("eventoId"));
  if (!eventoId) return;

  await prisma.evento.delete({ where: { id: eventoId } });
  revalidateAll();
}

/**
 * Editar todos los campos de un evento desde admin.
 */
export async function editarEvento(formData: FormData) {
  const eventoId = Number(formData.get("eventoId"));
  if (!eventoId) return;

  const nombre = (formData.get("nombre") as string)?.trim();
  const lugar = (formData.get("lugar") as string)?.trim();
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const nombreGestor = (formData.get("nombreGestor") as string)?.trim();
  const institucionRelacionada =
    (formData.get("institucionRelacionada") as string)?.trim() || null;
  const imagenUrl = (formData.get("imagenUrl") as string)?.trim() || null;
  const fechaStr = formData.get("fecha") as string;
  const fechaFinStr = formData.get("fechaFin") as string;
  const categoriaId = Number(formData.get("categoriaId")) || null;
  const zonaId = Number(formData.get("zonaId")) || null;
  const estado = formData.get("estado") as "PENDIENTE" | "APROBADO" | "RECHAZADO";

  if (!nombre || !lugar || !descripcion || !nombreGestor || !fechaStr) return;

  // Parsear fecha usando helper canónico de fechas de Loja (UTC-5)
  const { parseFechaInputLocal } = await import("@/lib/fechas");
  const fecha = parseFechaInputLocal(fechaStr);
  if (!fecha) return;
  const fechaFin = fechaFinStr ? parseFechaInputLocal(fechaFinStr) : null;

  const mapaUrl = (formData.get("mapaUrl") as string)?.trim() || null;
  const multimediaRaw = formData.get("multimedia")?.toString().trim();
  const videoUrlRaw = formData.get("videoUrl")?.toString().trim();

  let multimediaData: string[] | undefined = undefined;
  if (multimediaRaw !== undefined && multimediaRaw !== null) {
    try {
      const parsed = JSON.parse(multimediaRaw);
      if (Array.isArray(parsed)) {
        multimediaData = parsed.map(String).filter(Boolean);
      }
    } catch {
      multimediaData = [];
    }
  }

  const patrocinadoresRaw = formData.get("patrocinadores")?.toString().trim();
  let patrocinadoresData: Array<{ nombre: string; logoUrl: string }> | undefined = undefined;
  if (patrocinadoresRaw !== undefined && patrocinadoresRaw !== null) {
    try {
      const parsed = JSON.parse(patrocinadoresRaw);
      if (Array.isArray(parsed)) {
        patrocinadoresData = parsed
          .filter((p) => p && typeof p === "object" && (p.nombre?.trim() || p.logoUrl?.trim()))
          .map((p) => ({
            nombre: String(p.nombre || "").trim(),
            logoUrl: String(p.logoUrl || "").trim(),
          }));
      }
    } catch {
      patrocinadoresData = [];
    }
  }

  // Si se actualizan imágenes multimedia, asegurarse de que imagenUrl no quede huérfano
  let finalImagenUrl = imagenUrl;
  if (!finalImagenUrl && multimediaData && multimediaData.length > 0) {
    finalImagenUrl = multimediaData[0];
  }

  await prisma.evento.update({
    where: { id: eventoId },
    data: {
      nombre,
      lugar,
      mapaUrl,
      descripcion,
      nombreGestor,
      institucionRelacionada,
      imagenUrl: finalImagenUrl,
      ...(multimediaData !== undefined
        ? { multimedia: multimediaData.length > 0 ? multimediaData : Prisma.DbNull }
        : {}),
      ...(videoUrlRaw !== undefined ? { videoUrl: videoUrlRaw || null } : {}),
      ...(patrocinadoresData !== undefined
        ? { patrocinadores: patrocinadoresData.length > 0 ? patrocinadoresData : Prisma.DbNull }
        : {}),
      fecha,
      fechaFin,
      categoriaId,
      zonaId,
      estado,
    },
  });

  revalidateAll();
}