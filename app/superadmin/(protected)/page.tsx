import { prisma } from "@/lib/prisma";
import { SuperAdminDashboardClient } from "../superadmin-dashboard-client";
import type { AliadoAnalyticsData } from "../superadmin-aliados-analytics";

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

  // ─── ANALYTICS POR ALIADO ───
  // Obtenemos los últimos 1000 mensajes del bot para auditar menciones de aliados de forma ultra rápida
  const mensajesBotRecientes = await prisma.chatMessage.findMany({
    where: { sender: "bot" },
    select: {
      id: true,
      sessionId: true,
      contenido: true,
      aliadosIds: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const aliadosAnalytics: AliadoAnalyticsData[] = await Promise.all(
    aliados.map(async (aliado) => {
      // Filtrar mensajes bot que recomendaron a este aliado
      const relevantes = mensajesBotRecientes.filter((m) => {
        if (!m.aliadosIds) return false;
        const ids = Array.isArray(m.aliadosIds) ? m.aliadosIds : [];
        return ids.includes(aliado.id);
      });

      if (relevantes.length === 0) {
        return {
          id: aliado.id,
          nombre: aliado.nombre,
          tipo: aliado.tipo,
          imagenUrl: aliado.imagenUrl ?? null,
          totalSesiones: 0,
          totalMensajes: 0,
          leads: [],
          sesionesRecientes: [],
        };
      }

      // Sesiones únicas que mencionaron este aliado
      const sessionIdsUnicos = Array.from(new Set(relevantes.map((m) => m.sessionId)));

      // Obtener las sesiones completas con sus mensajes
      const sesionesCompletas = await prisma.chatSession.findMany({
        where: { sessionId: { in: sessionIdsUnicos } },
        include: {
          mensajes: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      });

      // Leads: sesiones con nombreUsuario guardado
      const leads = sesionesCompletas
        .filter((s) => s.nombreUsuario)
        .map((s) => ({
          sessionId: s.sessionId,
          nombre: s.nombreUsuario!,
          fecha: s.updatedAt,
          zona: s.zonaDetectada,
        }));

      // Construir detalle de sesiones recientes
      const sesionesRecientes = sesionesCompletas.map((s) => {
        const idsRelevantesEnSesion = new Set(
          relevantes.filter((r) => r.sessionId === s.sessionId).map((r) => r.id)
        );
        const mensajesRelevantes = s.mensajes
          .filter((m) => {
            if (m.sender === "bot" && idsRelevantesEnSesion.has(m.id)) return true;
            if (m.sender === "user") return true;
            return false;
          })
          .slice(-10)
          .map((m) => ({
            sender: m.sender,
            contenido: m.contenido,
            createdAt: m.createdAt,
          }));

        return {
          sessionId: s.sessionId,
          nombreUsuario: s.nombreUsuario ?? null,
          zonaDetectada: s.zonaDetectada ?? null,
          ciudad: s.ciudad ?? null,
          intencionDetectada: s.intencionDetectada ?? null,
          contextoResumen: s.contextoResumen ?? null,
          createdAt: s.createdAt,
          mensajesCount: s.mensajes.length,
          mensajesRelevantes,
        };
      });

      return {
        id: aliado.id,
        nombre: aliado.nombre,
        tipo: aliado.tipo,
        imagenUrl: aliado.imagenUrl ?? null,
        totalSesiones: sessionIdsUnicos.length,
        totalMensajes: relevantes.length,
        leads,
        sesionesRecientes,
      };
    })
  );

  // Ordenar: primero los que tienen actividad y luego por nombre
  const aliadosOrdenados = [...aliadosAnalytics].sort((a, b) => {
    if (b.totalSesiones !== a.totalSesiones) {
      return b.totalSesiones - a.totalSesiones;
    }
    return a.nombre.localeCompare(b.nombre);
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
        nombreUsuario: s.nombreUsuario ?? null,
        mensajes: s.mensajes.map((m: any) => ({
          ...m,
          aliadosIds: m.aliadosIds as number[] | null,
          eventosIds: m.eventosIds as number[] | null,
          atractivosIds: m.atractivosIds as number[] | null,
        })),
      }))}
      aliadosAnalytics={aliadosOrdenados}
      stats={{ total: totalSessions, conUbicacion, zonasFrecuentes, intencionesFrecuentes, totalMensajes }}
      initialRecomendaciones={recomendaciones}
    />
  );
}

