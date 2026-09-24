/**
 * Utilidades para las categorías/tipos de habitación de un aliado.
 * Las imágenes se guardan en la BD como un string JSON (array de URLs).
 */

export interface HabitacionInput {
  nombre: string;
  precio?: string | null;
  caracteristicas?: string | null;
  imagenes?: string[] | null;
}

export interface HabitacionView {
  id: number;
  nombre: string;
  precio: string | null;
  caracteristicas: string | null;
  imagenes: string[];
}

/** Convierte el texto JSON guardado en BD a un array de URLs seguro. */
export function parseImagenesHabitacion(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const valor = JSON.parse(raw);
    if (!Array.isArray(valor)) return [];
    return valor.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  } catch {
    return [];
  }
}

/** Convierte un array de URLs al string JSON que se guarda en BD (null si está vacío). */
export function stringifyImagenesHabitacion(imgs: string[] | null | undefined): string | null {
  const limpias = (imgs || []).map((u) => (u || "").trim()).filter(Boolean);
  return limpias.length > 0 ? JSON.stringify(limpias) : null;
}
