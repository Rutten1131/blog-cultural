"use server";

/**
 * Server Action — Crear un evento pendiente.
 * No asigna categoría ni zona (eso se hace en el paso de clasificación IA).
 *
 * REGLA de zona horaria (CONTEXTO-TECNICO.md §5):
 * El input de fecha puede venir en dos formatos:
 *   1. "YYYY-MM-DD" (legacy `type="date"`) → se interpreta como mediodía Ecuador
 *   2. "YYYY-MM-DDTHH:mm" (`type="datetime-local"`) → hora local Loja
 * Ambos se parsean vía `parseFechaInputLocal()` de lib/fechas.ts.
 */

import { prisma } from "@/lib/prisma";
import { generarSlug } from "@/lib/utils";
import { parseFechaInputLocal } from "@/lib/fechas";
import { revalidateAll } from "./revalidate";

export interface CrearEventoState {
  success: boolean;
  error?: string;
}

function imagenesUrl(imagenUrl: string | null, multimedia: string[]): string | null {
  if (imagenUrl) return imagenUrl;
  if (multimedia.length > 0) return multimedia[0];
  return null;
}

export async function crearEvento(
  _prevState: CrearEventoState,
  formData: FormData
): Promise<CrearEventoState> {
  // Extraer campos
  const nombre = formData.get("nombre")?.toString().trim() ?? "";
  const fechaInput = formData.get("fecha")?.toString().trim() ?? "";
  const lugar = formData.get("lugar")?.toString().trim() ?? "";
  const descripcion = formData.get("descripcion")?.toString().trim() ?? "";
  const imagenUrl = formData.get("imagenUrl")?.toString().trim() || null;
  const videoUrl = formData.get("videoUrl")?.toString().trim() || null;
  const multimediaRaw = formData.get("multimedia")?.toString().trim();
  let multimedia: string[] = [];
  if (multimediaRaw) {
    try {
      multimedia = JSON.parse(multimediaRaw);
    } catch {
      multimedia = [];
    }
  }

  const nombreGestor = formData.get("nombreGestor")?.toString().trim() ?? "";
  const institucionRelacionada =
    formData.get("institucionRelacionada")?.toString().trim() || null;

  // Validación de campos obligatorios
  if (!nombre || !fechaInput || !lugar || !descripcion || !nombreGestor) {
    return {
      success: false,
      error: "Todos los campos obligatorios deben estar completos.",
    };
  }

  // Validar fecha vía lib/fechas.ts (parsea formato YYYY-MM-DD o YYYY-MM-DDTHH:mm)
  const fechaDate = parseFechaInputLocal(fechaInput);
  if (!fechaDate) {
    return {
      success: false,
      error: "La fecha ingresada no es válida.",
    };
  }

  // Validar URL de imagen o primera de multimedia
  const mainImage = imagenesUrl(imagenUrl, multimedia);
  if (mainImage) {
    try {
      new URL(mainImage);
    } catch {
      return {
        success: false,
        error: "La URL de la imagen no es válida.",
      };
    }
  }

  // Generar slug determinista (sin IA). Usamos la fecha en formato ISO
  // en zona Loja para que el slug sea estable y refleje la fecha local.
  const fechaParaSlug = fechaInput.split("T")[0]; // "YYYY-MM-DD"
  const slug = generarSlug(nombre, fechaParaSlug, lugar);

  try {
    const nuevoEvento = await prisma.evento.create({
      data: {
        nombre,
        slug,
        fecha: fechaDate,
        lugar,
        descripcion,
        imagenUrl: mainImage,
        multimedia: multimedia.length > 0 ? multimedia : undefined,
        videoUrl,
        nombreGestor,
        institucionRelacionada,
      },
    });

    // En Serverless (Vercel), las promesas no awaitadas pueden ser congeladas (frozen)
    // antes de terminar el fetch de WhatsApp. Ejecutamos la clasificación y notificación de forma segura.
    let categoriaNombreSugerida: string | null = null;
    try {
      const { clasificarEvento } = await import("@/lib/clasificarEvento");
      const res = await clasificarEvento({ nombre, lugar, descripcion });

      let categoriaId: number | null = null;
      let zonaId: number | null = null;

      if (res.categoriaSlug) {
        const cat = await prisma.categoria.findUnique({
          where: { slug: res.categoriaSlug },
        });
        if (cat) {
          categoriaId = cat.id;
          categoriaNombreSugerida = cat.nombre;
        }
      }

      if (res.zonaNombre) {
        const zona = await prisma.zona.findUnique({
          where: { nombre: res.zonaNombre },
        });
        if (zona) zonaId = zona.id;
      }

      await prisma.evento.update({
        where: { id: nuevoEvento.id },
        data: {
          categoriaId,
          zonaId,
          confianzaClasificacion: res.confianza,
        },
      });
    } catch (err) {
      console.error("Error en clasificación por IA:", err);
    }

    // Notificar a los administradores por WhatsApp (Evolution API)
    try {
      const { notificarNuevoEventoAdmin } = await import("@/lib/notificarAdmin");
      const { formatFechaHoraLoja } = await import("@/lib/fechas");
      await notificarNuevoEventoAdmin({
        id: nuevoEvento.id,
        nombre: nuevoEvento.nombre,
        fechaFormateada: formatFechaHoraLoja(fechaDate),
        lugar: nuevoEvento.lugar,
        nombreGestor: nuevoEvento.nombreGestor,
        institucionRelacionada: nuevoEvento.institucionRelacionada,
        categoriaSugerida: categoriaNombreSugerida,
      });
    } catch (notifErr) {
      console.error("Error al notificar al admin por WhatsApp:", notifErr);
    }

    // Revalidar TODAS las rutas afectadas (no solo / y /admin)
    revalidateAll();

    return { success: true };
  } catch (error: unknown) {
    // Slug duplicado — evento con mismos datos ya existe
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return {
        success: false,
        error:
          "Ya existe un evento con este nombre, fecha y lugar. Si es un evento diferente, modificá ligeramente el nombre.",
      };
    }

    console.error("Error al crear evento:", error);
    return {
      success: false,
      error: "Ocurrió un error al guardar el evento. Intentá de nuevo.",
    };
  }
}