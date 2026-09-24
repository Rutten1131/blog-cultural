"use server";

/**
 * Server Actions — Moderación de posts capturados por el bot de WhatsApp.
 *
 * FLUJO:
 *   El bot lee el grupo y guarda candidatos en `posts_social` (PENDIENTE).
 *   Estos NO se publican nunca solos: solo se ven en /admin.
 *
 *   - Aprobar  → crea un `Evento` en estado PENDIENTE, que entra a la cola
 *                normal de moderación (pestaña "Moderar Pendientes"), donde
 *                se puede editar y publicar con control total.
 *   - Rechazar → marca el post como RECHAZADO. No crea nada.
 *
 * IMPORTANTE: nunca se inventan datos. Si al post le falta la fecha o el
 * lugar, la aprobación se rechaza y se le dice al moderador qué falta.
 */

import { prisma } from "@/lib/prisma";
import { generarSlug } from "@/lib/utils";
import { formatFechaLoja } from "@/lib/fechas";
import { revalidateAll } from "./revalidate";

export interface ModerarPostState {
  success: boolean;
  error?: string;
  eventoId?: number;
}

/** Etiqueta con la que quedan los eventos creados desde el bot. */
const GESTOR_BOT = "🤖 Bot WhatsApp — Agenda Cultural";

/**
 * Aprueba un post del bot: lo convierte en un evento pendiente.
 */
export async function aprobarPostBot(
  postId: number,
  moderadoPor: string
): Promise<ModerarPostState> {
  try {
    const post = await prisma.postSocial.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { success: false, error: "El post no existe." };
    }

    if (post.estado !== "PENDIENTE") {
      return {
        success: false,
        error: `Este post ya fue ${post.estado === "APROBADO" ? "aprobado" : "rechazado"} antes.`,
      };
    }

    // El modelo Evento exige fecha y lugar. Si el bot no los pudo leer,
    // no inventamos nada: se le pide al moderador que los complete.
    const faltantes: string[] = [];
    if (!post.fechaPublicacion) faltantes.push("fecha");
    if (!post.lugar) faltantes.push("lugar");
    if (!post.titulo) faltantes.push("título");

    if (faltantes.length > 0) {
      return {
        success: false,
        error:
          `Este post no se puede aprobar todavía: falta ${faltantes.join(", ")}. ` +
          `Completalo a mano desde "Publicar evento".`,
      };
    }

    const nombre = post.titulo!.trim();
    const lugar = post.lugar!.trim();
    const fecha = post.fechaPublicacion!;

    const descripcion =
      (post.descripcion || post.textoOriginal || "").trim() ||
      `Evento difundido por la comunidad en WhatsApp. Más información: ${post.urlOriginal ?? "sin enlace"}`;

    // OJO: formatFechaLoja por defecto usa formato "medio" ("14 ago 2026").
    // Para el slug se necesita "YYYY-MM-DD" en zona Loja → opción "iso".
    const slug = generarSlug(nombre, formatFechaLoja(fecha, "iso"), lugar);

    // Evitar duplicados: si ya existe un evento con ese slug, no se repite.
    const existente = await prisma.evento.findUnique({ where: { slug } });
    if (existente) {
      await prisma.postSocial.update({
        where: { id: postId },
        data: {
          estado: "APROBADO",
          moderadoPor,
          moderadoAt: new Date(),
          moderationComentario: `Ya existía el evento #${existente.id} con el mismo slug.`,
        },
      });
      revalidateAll();
      return {
        success: true,
        eventoId: existente.id,
        error: `Ya existía un evento igual (#${existente.id}); no se duplicó.`,
      };
    }

    const evento = await prisma.evento.create({
      data: {
        nombre,
        slug,
        fecha,
        lugar,
        descripcion,
        imagenUrl: post.imagenUrl,
        nombreGestor: GESTOR_BOT,
        confianzaClasificacion: post.confianzaIA,
        // Queda PENDIENTE: no se publica hasta que un humano lo apruebe
        // en la cola normal. Así nunca aparece solo en la página pública.
        estado: "PENDIENTE",
      },
    });

    await prisma.postSocial.update({
      where: { id: postId },
      data: {
        estado: "APROBADO",
        moderadoPor,
        moderadoAt: new Date(),
        moderationComentario: `Convertido en evento #${evento.id}`,
      },
    });

    revalidateAll();

    return { success: true, eventoId: evento.id };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return {
        success: false,
        error: "Ya existe un evento con ese nombre, fecha y lugar.",
      };
    }
    console.error("Error aprobando post del bot:", error);
    return { success: false, error: "Ocurrió un error al aprobar el post." };
  }
}

/** Rechaza un post del bot. No crea ningún evento. */
export async function rechazarPostBot(
  postId: number,
  moderadoPor: string,
  comentario?: string
): Promise<ModerarPostState> {
  try {
    const post = await prisma.postSocial.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { success: false, error: "El post no existe." };
    }

    await prisma.postSocial.update({
      where: { id: postId },
      data: {
        estado: "RECHAZADO",
        moderadoPor,
        moderadoAt: new Date(),
        moderationComentario: comentario?.trim() || null,
      },
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error("Error rechazando post del bot:", error);
    return { success: false, error: "Ocurrió un error al rechazar el post." };
  }
}
