import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const metadata: Metadata = {
  title: "Panel de Moderación y Control | Admin",
  description: "Administración integral de eventos, moderación, sugerencias y alertas de la Agenda Cultural de Loja.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const eventosPendientes = await prisma.evento.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { createdAt: "desc" },
  });

  // Todos los eventos para gestión completa
  const todosLosEventos = await prisma.evento.findMany({
    orderBy: { fecha: "desc" },
    include: {
      categoria: { select: { nombre: true } },
      zona: { select: { nombre: true } },
    },
  });

  const recomendaciones = await prisma.recomendacion.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const numerosNotificacion = await prisma.numeroNotificacion.findMany({
    orderBy: { createdAt: "asc" },
  });

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
  });

  const zonas = await prisma.zona.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <AdminDashboardClient
      eventosPendientes={eventosPendientes}
      todosLosEventos={todosLosEventos}
      recomendaciones={recomendaciones}
      numerosNotificacion={numerosNotificacion}
      categorias={categorias}
      zonas={zonas}
    />
  );
}
