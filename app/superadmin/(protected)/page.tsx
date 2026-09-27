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

  // Stats del CRM y Chatbot Analytics
  const totalSessions = await prisma.chatSession.count();
  const conUbicacion = await prisma.chatSession.count({
    where: { ubicacionLat: { not: null } },
  });
  const totalMensajes = await prisma.chatMessage.count();

  const zonasRaw = await prisma.chatSession.groupBy({
    by: ["zonaDetectada"],
    _count: { zonaDetectada: true },
    orderBy: { _count: { zonaDetectada: "desc" } },
    take: 5,
  });
  const zonasFrecuentes = zonasRaw
    .filter((z: any) => z.zonaDetectada)
    .map((z: any) => ({ zona: z.zonaDetectada as string, count: z._count.zonaDetectada as number }));

  // Agrupación de intenciones detectadas por el Chatbot
  const intencionesRaw = await prisma.chatSession.groupBy({
    by: ["intencionDetectada"],
    _count: { intencionDetectada: true },
    orderBy: { _count: { intencionDetectada: "desc" } },
    take: 8,
  });
  const intencionesFrecuentes = intencionesRaw
    .filter((it: any) => it.intencionDetectada)
    .map((it: any) => ({
      intencion: it.intencionDetectada as string,
      count: it._count.intencionDetectada as number,
    }));

  // Cargar buzón de sugerencias
  const recomendaciones = await prisma.recomendacion.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

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
        direccionDetallada: s.direccionDetallada ?? null,
        ciudad: s.ciudad ?? null,
        provincia: s.provincia ?? null,
        pais: s.pais ?? null,
        userAgent: s.userAgent ?? null,
        ipAddress: s.ipAddress ?? null,
        contextoResumen: s.contextoResumen ?? null,
        intencionDetectada: s.intencionDetectada ?? null,
        mensajes: s.mensajes.map((m: any) => ({
          ...m,
          aliadosIds: m.aliadosIds as number[] | null,
          eventosIds: m.eventosIds as number[] | null,
          atractivosIds: m.atractivosIds as number[] | null,
        })),
      }))}
      stats={{ total: totalSessions, conUbicacion, zonasFrecuentes, intencionesFrecuentes, totalMensajes }}
      initialRecomendaciones={recomendaciones}
    />
  );
}
