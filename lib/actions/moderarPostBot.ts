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
  publicadoDirecto?: boolean;
}

/** Etiqueta con la que quedan los eventos creados desde el bot. */
const GESTOR_BOT = "🤖 Bot WhatsApp — Agenda Cultural";

/**
 * Aprueba un post del bot: lo convierte en un evento (publicado o pendiente).
 */
export async function aprobarPostBot(
  postId: number,
  moderadoPor: string,
  publicarDirecto: boolean = true
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

    // Las fotos del carrusel viajan con el evento. Si solo hay una, no hace
    // falta el arreglo: `imagenUrl` ya la cubre.
    const fotos = Array.isArray(post.multimedia)
      ? post.multimedia.filter(
          (u): u is string => typeof u === "string" && u.trim().length > 0
        )
      : [];

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

    // Inferir Categoría y Zona según catálogos existentes en Loja
    let categoriaId: number | null = null;
    let zonaId: number | null = null;

    const textoCompleto = `${nombre} ${lugar} ${descripcion}`.toLowerCase();

    // Buscar zona en el texto o lugar
    const zonas = await prisma.zona.findMany();
    for (const z of zonas) {
      const zNorm = z.nombre.toLowerCase();
      if (textoCompleto.includes(zNorm) || (lugar && lugar.toLowerCase().includes(zNorm))) {
        zonaId = z.id;
        break;
      }
    }
    // Si no coincide una parroquia específica y dice "Loja" o es céntrico (San Sebastián/Sagrario/El Valle/Teatro Bolívar)
    if (!zonaId) {
      if (
        textoCompleto.includes("teatro bolívar") ||
        textoCompleto.includes("catedral") ||
        textoCompleto.includes("san sebastián") ||
        textoCompleto.includes("rocafuerte")
      ) {
        const sanSeb = zonas.find((z) => z.nombre.toLowerCase().includes("sebastián"));
        const sagrario = zonas.find((z) => z.nombre.toLowerCase().includes("sagrario"));
        zonaId = sanSeb?.id || sagrario?.id || null;
      }
    }

    // Buscar categoría en base a palabras clave de los catálogos
    const categorias = await prisma.categoria.findMany();
    if (
      textoCompleto.includes("concierto") ||
      textoCompleto.includes("música") ||
      textoCompleto.includes("sinfónica") ||
      textoCompleto.includes("rock") ||
      textoCompleto.includes("bolero") ||
      textoCompleto.includes("canta")
    ) {
      const cat = categorias.find((c) => c.slug === "musica");
      if (cat) categoriaId = cat.id;
    } else if (
      textoCompleto.includes("teatro") ||
      textoCompleto.includes("escénic") ||
      textoCompleto.includes("obra") ||
      textoCompleto.includes("actor")
    ) {
      const cat = categorias.find((c) => c.slug === "teatro");
      if (cat) categoriaId = cat.id;
    } else if (
      textoCompleto.includes("feria") ||
      textoCompleto.includes("expoferia") ||
      textoCompleto.includes("mercado") ||
      textoCompleto.includes("artesan") ||
      textoCompleto.includes("coleccion")
    ) {
      const cat = categorias.find((c) => c.slug === "ferias");
      if (cat) categoriaId = cat.id;
    } else if (
      textoCompleto.includes("danza") ||
      textoCompleto.includes("circo") ||
      textoCompleto.includes("artes vivas") ||
      textoCompleto.includes("fiavl")
    ) {
      const cat = categorias.find((c) => c.slug === "artes-vivas");
      if (cat) categoriaId = cat.id;
    } else if (
      textoCompleto.includes("exposición") ||
      textoCompleto.includes("pintura") ||
      textoCompleto.includes("galería") ||
      textoCompleto.includes("arte")
    ) {
      const cat = categorias.find((c) => c.slug === "arte-y-exposiciones");
      if (cat) categoriaId = cat.id;
    }

    const evento = await prisma.evento.create({
      data: {
        nombre,
        slug,
        fecha,
        lugar,
        descripcion,
        imagenUrl: post.imagenUrl,
        multimedia: fotos.length > 1 ? fotos : undefined,
        nombreGestor: GESTOR_BOT,
        confianzaClasificacion: post.confianzaIA,
        categoriaId,
        zonaId,
        // Publicado directamente a la agenda si el admin lo aprueba
        estado: publicarDirecto ? "APROBADO" : "PENDIENTE",
      },
    });

    await prisma.postSocial.update({
      where: { id: postId },
      data: {
        estado: "APROBADO",
        moderadoPor,
        moderadoAt: new Date(),
        moderationComentario: `Convertido en evento #${evento.id} (${publicarDirecto ? "Publicado directamente" : "Pendiente"})`,
      },
    });

    // Si se publica directo, notificar a Hermes en el VPS (IA editorial)
    if (publicarDirecto) {
      try {
        const { despacharEventoAHermes } = await import("@/lib/hermes");
        await despacharEventoAHermes(evento.id, "evento.aprobado");
      } catch (err) {
        console.error("[MODERACION] Error al notificar a Hermes:", err);
      }
    }

    revalidateAll();

    return { success: true, eventoId: evento.id, publicadoDirecto: publicarDirecto };
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
