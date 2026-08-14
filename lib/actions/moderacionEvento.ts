"use server";

import { prisma } from "@/lib/prisma";
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