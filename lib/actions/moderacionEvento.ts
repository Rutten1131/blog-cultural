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

  // Notificar a Hermes en el VPS (IA editorial para redes sociales)
  try {
    const { despacharEventoAHermes } = await import("@/lib/hermes");
    await despacharEventoAHermes(eventoId, "evento.aprobado");
  } catch (err) {
    console.error("[MODERACION] Error al notificar a Hermes:", err);
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

  await prisma.evento.update({
    where: { id: eventoId },
    data: {
      nombre,
      lugar,
      descripcion,
      nombreGestor,
      institucionRelacionada,
      imagenUrl,
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