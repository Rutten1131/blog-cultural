/**
 * Helper centralizado de revalidación para server actions.
 *
 * REGLA (CONTEXTO-TECNICO.md §9):
 * Cualquier server action que muta eventos debe invalidar TODAS las
 * rutas afectadas (home, admin, listados, fichas, categorías, zonas,
 * sitemap) para que el ISR no muestre datos viejos hasta 60 segundos.
 *
 * Usar SIEMPRE `revalidateAll()` después de un `prisma.evento.create`,
 * `update`, `delete` o cambio de estado.
 */

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalida todas las rutas públicas + admin + sitemap.
 * Llamar después de cualquier mutación de eventos.
 */
export function revalidateAll(): void {
  // Rutas exactas
  revalidatePath("/");
  revalidatePath("/eventos");
  revalidatePath("/admin");

  // Layouts (reflejan en todas las páginas bajo ellos)
  revalidatePath("/eventos", "layout");
  revalidatePath("/admin", "layout");

  // Sitemap (no es una ruta visible pero sí cacheada)
  revalidatePath("/sitemap.xml", "page");
  revalidatePath("/robots.txt", "page");

  // Tag genérico por si en el futuro se migra a fetch con tags
  revalidateTag("eventos", "max");
}