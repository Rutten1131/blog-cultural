"use server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "./authAdmin";
import { revalidatePath } from "next/cache";
import { HabitacionInput, stringifyImagenesHabitacion } from "@/lib/habitaciones";

export async function getAliadosAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("No autorizado");

  return await prisma.aliado.findMany({
    orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
    include: { habitaciones: { orderBy: [{ orden: "asc" }, { id: "asc" }] } },
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
  ubicacionLat?: number | null;
  ubicacionLng?: number | null;
  mapaUrl?: string | null;
  rangoPrecio?: string | null;
  servicios?: string | null;
  cuartos?: string | null;
  numeroCuartos?: number | null;
  estrellas?: number | null;
  telefono?: string | null;
  websiteUrl?: string | null;
  redesUrl?: string | null;
  imagenUrl?: string | null;
  destacado?: boolean;
  activo?: boolean;
  habitaciones?: HabitacionInput[];
}) {
  const session = await getAdminSession();
  if (!session) throw new Error("No autorizado");

  const payload = {
    nombre: data.nombre.trim(),
    tipo: data.tipo,
    descripcion: data.descripcion.trim(),
    ubicacion: data.ubicacion.trim(),
    ubicacionLat: data.ubicacionLat !== undefined && data.ubicacionLat !== null && !isNaN(data.ubicacionLat) ? Number(data.ubicacionLat) : null,
    ubicacionLng: data.ubicacionLng !== undefined && data.ubicacionLng !== null && !isNaN(data.ubicacionLng) ? Number(data.ubicacionLng) : null,
    mapaUrl: data.mapaUrl?.trim() || null,
    rangoPrecio: data.rangoPrecio?.trim() || null,
    servicios: data.servicios?.trim() || null,
    cuartos: data.cuartos?.trim() || null,
    numeroCuartos:
      data.numeroCuartos !== undefined && data.numeroCuartos !== null && !isNaN(Number(data.numeroCuartos))
        ? Math.max(0, Math.trunc(Number(data.numeroCuartos)))
        : null,
    estrellas:
      data.estrellas !== undefined && data.estrellas !== null && !isNaN(Number(data.estrellas))
        ? Math.min(5, Math.max(1, Math.trunc(Number(data.estrellas))))
        : null,
    telefono: data.telefono?.trim() || null,
    websiteUrl: data.websiteUrl?.trim() || null,
    redesUrl: data.redesUrl?.trim() || null,
    imagenUrl: data.imagenUrl?.trim() || null,
    destacado: data.destacado ?? true,
    activo: data.activo ?? true,
  };

  // Categorías / tipos de habitación (precio, características y galería)
  const habitaciones = (data.habitaciones || [])
    .filter((h) => h && h.nombre && h.nombre.trim().length > 0)
    .map((h, i) => ({
      nombre: h.nombre.trim(),
      precio: h.precio?.trim() || null,
      caracteristicas: h.caracteristicas?.trim() || null,
      imagenes: stringifyImagenesHabitacion(h.imagenes),
      orden: i,
    }));

  if (data.id) {
    await prisma.$transaction([
      prisma.aliado.update({ where: { id: data.id }, data: payload }),
      prisma.aliadoHabitacion.deleteMany({ where: { aliadoId: data.id } }),
      ...(habitaciones.length > 0
        ? [
            prisma.aliadoHabitacion.createMany({
              data: habitaciones.map((h) => ({ ...h, aliadoId: data.id! })),
            }),
          ]
        : []),
    ]);
  } else {
    await prisma.aliado.create({
      data: {
        ...payload,
        habitaciones: habitaciones.length > 0 ? { create: habitaciones } : undefined,
      },
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
