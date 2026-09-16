"use server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "./authAdmin";
import { revalidatePath } from "next/cache";

export async function getAliadosAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("No autorizado");

  return await prisma.aliado.findMany({
    orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
  });
}

export async function toggleAliadoActivo(id: number, activo: boolean) {
  const session = await getAdminSession();
  if (!session) throw new Error("No autorizado");

  await prisma.aliado.update({
    where: { id },
    data: { activo },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function guardarAliado(data: {
  id?: number;
  nombre: string;
  tipo: any;
  descripcion: string;
  ubicacion: string;
  mapaUrl?: string | null;
  rangoPrecio?: string | null;
  servicios?: string | null;
  cuartos?: string | null;
  telefono?: string | null;
  websiteUrl?: string | null;
  redesUrl?: string | null;
  imagenUrl?: string | null;
  destacado?: boolean;
  activo?: boolean;
}) {
  const session = await getAdminSession();
  if (!session) throw new Error("No autorizado");

  const payload = {
    nombre: data.nombre.trim(),
    tipo: data.tipo,
    descripcion: data.descripcion.trim(),
    ubicacion: data.ubicacion.trim(),
    mapaUrl: data.mapaUrl?.trim() || null,
    rangoPrecio: data.rangoPrecio?.trim() || null,
    servicios: data.servicios?.trim() || null,
    cuartos: data.cuartos?.trim() || null,
    telefono: data.telefono?.trim() || null,
    websiteUrl: data.websiteUrl?.trim() || null,
    redesUrl: data.redesUrl?.trim() || null,
    imagenUrl: data.imagenUrl?.trim() || null,
    destacado: data.destacado ?? true,
    activo: data.activo ?? true,
  };

  if (data.id) {
    await prisma.aliado.update({
      where: { id: data.id },
      data: payload,
    });
  } else {
    await prisma.aliado.create({
      data: payload,
    });
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function eliminarAliado(id: number) {
  const session = await getAdminSession();
  if (!session) throw new Error("No autorizado");

  await prisma.aliado.delete({
    where: { id },
  });

  revalidatePath("/admin");
  return { success: true };
}
