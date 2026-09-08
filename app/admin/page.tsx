import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/actions/authAdmin";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const metadata: Metadata = {
  title: "Panel de Moderación y Control | Admin",
  description: "Administración integral de eventos, moderación, sugerencias y alertas de la Agenda Cultural de Loja.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const esSuperadmin = session.role === "SUPERADMIN";

  // 1. Filtrar eventos pendientes por institución si no es superadmin
  const eventosPendientes = await prisma.evento.findMany({
    where: {
      estado: "PENDIENTE",
      ...(!esSuperadmin && session.nombre
        ? { institucionRelacionada: session.nombre }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Filtrar todos los eventos por institución si no es superadmin
  const todosLosEventos = await prisma.evento.findMany({
    where: !esSuperadmin && session.nombre
      ? { institucionRelacionada: session.nombre }
      : {},
    orderBy: { fecha: "desc" },
    include: {
      categoria: { select: { nombre: true } },
      zona: { select: { nombre: true } },
    },
  });

  // 3. Recomendaciones / Buzón: solo para superadmin
  const recomendaciones = esSuperadmin
    ? await prisma.recomendacion.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  // 4. Números de WhatsApp:
  // Si es superadmin: todos los números
  // Si es institución: solo los números vinculados a su id
  const numerosNotificacion = await prisma.numeroNotificacion.findMany({
    where: !esSuperadmin && session.institucionId
      ? { institucionId: session.institucionId }
      : {},
    orderBy: { createdAt: "asc" },
    include: {
      institucion: { select: { nombre: true } },
    },
  });

  // 5. Instituciones y contraseñas: solo para superadmin
  const instituciones = esSuperadmin
    ? await prisma.institucion.findMany({
        orderBy: { nombre: "asc" },
      })
    : [];

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
  });

  const zonas = await prisma.zona.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <AdminDashboardClient
      session={session}
      eventosPendientes={eventosPendientes}
      todosLosEventos={todosLosEventos}
      recomendaciones={recomendaciones}
      numerosNotificacion={numerosNotificacion}
      instituciones={instituciones}
      categorias={categorias}
      zonas={zonas}
    />
  );
}
