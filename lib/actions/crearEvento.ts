"use server";

/**
 * Server Action — Crear un evento pendiente.
 * No asigna categoría ni zona (eso se hace en el paso de clasificación IA).
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generarSlug } from "@/lib/utils";

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
  const fecha = formData.get("fecha")?.toString().trim() ?? "";
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

  // Validación de campos obligatorios
  if (!nombre || !fecha || !lugar || !descripcion || !nombreGestor) {
    return {
      success: false,
      error: "Todos los campos obligatorios deben estar completos.",
    };
  }

  // Validar formato de fecha
  const fechaDate = new Date(fecha);
  if (isNaN(fechaDate.getTime())) {
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

  // Generar slug determinista (sin IA)
  const slug = generarSlug(nombre, fecha, lugar);

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
      },
    });

    // Disparar clasificación por IA en segundo plano (sin bloquear respuesta al usuario)
    (async () => {
      try {
        const { clasificarEvento } = await import("@/lib/clasificarEvento");
        const res = await clasificarEvento({ nombre, lugar, descripcion });

        let categoriaId: number | null = null;
        let zonaId: number | null = null;

        if (res.categoriaSlug) {
          const cat = await prisma.categoria.findUnique({
            where: { slug: res.categoriaSlug },
          });
          if (cat) categoriaId = cat.id;
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
        console.error("Error en clasificación en segundo plano:", err);
      }
    })();

    revalidatePath("/admin");
    revalidatePath("/");

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
