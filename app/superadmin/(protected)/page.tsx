import { prisma } from "@/lib/prisma";
import { SuperAdminDashboardClient } from "../superadmin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  // Cargar aliados
  const aliados = await prisma.aliado.findMany({
    orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
  });

  // Cargar sesiones CRM (últimas 50)
  const sessions = await prisma.chatSession.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      mensajes: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Stats del CRM
  const totalSessions = await prisma.chatSession.count();
  const conUbicacion = await prisma.chatSession.count({
    where: { ubicacionLat: { not: null } },
  });
  const zonasRaw = await prisma.chatSession.groupBy({
    by: ["zonaDetectada"],
    _count: { zonaDetectada: true },
    orderBy: { _count: { zonaDetectada: "desc" } },
    take: 5,
  });
  const zonasFrecuentes = zonasRaw
    .filter((z: any) => z.zonaDetectada)
    .map((z: any) => ({ zona: z.zonaDetectada as string, count: z._count.zonaDetectada as number }));

  return (
    <SuperAdminDashboardClient
      initialAliados={aliados.map((a: any) => ({
        ...a,
        ubicacionLat: a.ubicacionLat ?? null,
        ubicacionLng: a.ubicacionLng ?? null,
        mapaUrl: a.mapaUrl ?? null,
        rangoPrecio: a.rangoPrecio ?? null,
        servicios: a.servicios ?? null,
        cuartos: a.cuartos ?? null,
        telefono: a.telefono ?? null,
        websiteUrl: a.websiteUrl ?? null,
        redesUrl: a.redesUrl ?? null,
        imagenUrl: a.imagenUrl ?? null,
      }))}
      initialSessions={sessions.map((s: any) => ({
        ...s,
        ubicacionLat: s.ubicacionLat ?? null,
        ubicacionLng: s.ubicacionLng ?? null,
        zonaDetectada: s.zonaDetectada ?? null,
        ciudad: s.ciudad ?? null,
        provincia: s.provincia ?? null,
        pais: s.pais ?? null,
        userAgent: s.userAgent ?? null,
        ipAddress: s.ipAddress ?? null,
        mensajes: s.mensajes.map((m: any) => ({
          ...m,
          aliadosIds: m.aliadosIds as number[] | null,
          eventosIds: m.eventosIds as number[] | null,
          atractivosIds: m.atractivosIds as number[] | null,
        })),
      }))}
      stats={{ total: totalSessions, conUbicacion, zonasFrecuentes }}
    />
  );
}
