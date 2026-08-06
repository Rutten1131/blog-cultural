"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

  revalidatePath("/admin");
}

export async function rechazarEvento(formData: FormData) {
  const eventoId = Number(formData.get("eventoId"));

  if (!eventoId) return;

  await prisma.evento.update({
    where: { id: eventoId },
    data: {
      estado: "RECHAZADO",
    },
  });

  revalidatePath("/admin");
}
