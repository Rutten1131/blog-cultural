/**
 * Utilidades compartidas — Agenda Cultural Loja.
 */

/**
 * Genera un slug determinista a partir del nombre, la fecha y el lugar.
 * Sin tildes, minúsculas, guiones. Sin IA.
 *
 * Ejemplo: "Noche de Jazz", "2026-08-10", "Parque Central"
 *       → "noche-de-jazz-2026-08-10-parque-central"
 */
export function generarSlug(
  nombre: string,
  fecha: string,
  lugar: string
): string {
  const raw = `${nombre}-${fecha}-${lugar}`;

  return raw
    .normalize("NFD")                    // descomponer acentos
    .replace(/[\u0300-\u036f]/g, "")     // quitar diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")       // solo alfanumérico, espacio, guión
    .trim()
    .replace(/\s+/g, "-")               // espacios → guiones
    .replace(/-+/g, "-");               // múltiples guiones → uno
}

/**
 * Metadata del sitio — fuente única de verdad para SEO base.
 */
export const SITE_CONFIG = {
  nombre: "Agenda Cultural Loja",
  descripcion:
    "Descubre los mejores eventos culturales de Loja: arte, teatro, música, ferias y artes vivas. Publicación abierta para gestores culturales.",
  url: "https://agendaculturalloja.com",
  locale: "es_EC",
} as const;
