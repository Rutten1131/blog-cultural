/**
 * lib/fechas.ts — ÚNICA fuente de verdad para manejo de fechas en Agenda Cultural Loja.
 *
 * REGLA CRÍTICA (ver CONTEXTO-TECNICO.md §5):
 * Ecuador continental = UTC-5 todo el año (sin DST).
 * Toda fecha almacenada en BD es DateTime UTC.
 * Toda conversión a "fecha en Loja" pasa por este archivo.
 *
 * Está PROHIBIDO hacer `new Date(fechaString)` o `toLocaleDateString()`
 * directamente en cualquier otro archivo de la app.
 */

import "server-only";

/** Zona horaria canónica del proyecto. Ecuador continental. */
export const TZ_LOJA = "America/Guayaquil" as const;

/** Locale para formateo en español ecuatoriano. */
export const LOCALE_LOJA = "es-EC" as const;

/**
 * Parsea una fecha viniendo del formulario público (o de cualquier input
 * del usuario). Acepta dos formatos:
 *
 * 1. `"2026-08-14"` (solo fecha, sin hora) — se interpreta como
 *    **mediodía Ecuador = 17:00 UTC** para evitar off-by-one de un día.
 *    (Bug detectado el 2026-08-14: `new Date("2026-08-14")` daba UTC midnight
 *    = día anterior en Ecuador.)
 *
 * 2. `"2026-08-14T20:00"` o `"2026-08-14T20:00:00"` (datetime-local) — se
 *    interpreta como **hora local de Loja**, convertido a UTC.
 *
 * @param input fecha en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm[:ss]
 * @returns Date en UTC listo para guardar en BD, o null si el input es inválido
 */
export function parseFechaInputLocal(input: string): Date | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Formato 1: solo fecha (YYYY-MM-DD)
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (soloFecha) {
    const [, y, m, d] = soloFecha;
    // Mediodía Ecuador = 12:00 en TZ Loja = 17:00 UTC
    return new Date(`${y}-${m}-${d}T17:00:00Z`);
  }

  // Formato 2: datetime-local (YYYY-MM-DDTHH:mm[:ss])
  const conHora = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    trimmed,
  );
  if (conHora) {
    const [, y, m, d, hh, mm, ss = "00"] = conHora;
    // Interpretar como hora de Loja y convertir a UTC usando offset -05:00
    // (Ecuador no usa DST, así que el offset es constante).
    const isoLoja = `${y}-${m}-${d}T${hh}:${mm}:${ss}-05:00`;
    const fecha = new Date(isoLoja);
    return isNaN(fecha.getTime()) ? null : fecha;
  }

  return null;
}

/**
 * "Ahora" en UTC. Equivalente a `new Date()` pero declarado aquí
 * para tener un único punto de auditoría si en el futuro queremos
 * mockear el tiempo en tests.
 */
export function ahoraUTC(): Date {
  return new Date();
}

/**
 * Formatea una fecha (Date o string ISO) para mostrar al usuario,
 * siempre en zona horaria de Loja, en español ecuatoriano.
 *
 * @param fecha Date | string | number
 * @param opciones estilo: "corto" (ej. "vie, 14 ago") | "medio" (ej. "14 ago 2026") | "largo" (ej. "viernes, 14 de agosto de 2026") | "iso" (YYYY-MM-DD)
 */
export function formatFechaLoja(
  fecha: Date | string | number,
  opciones: "corto" | "medio" | "largo" | "iso" = "medio",
): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return "";

  if (opciones === "iso") {
    // Devuelve YYYY-MM-DD en zona Loja (no UTC)
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ_LOJA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const y = partes.find((p) => p.type === "year")?.value ?? "0000";
    const m = partes.find((p) => p.type === "month")?.value ?? "01";
    const day = partes.find((p) => p.type === "day")?.value ?? "01";
    return `${y}-${m}-${day}`;
  }

  const config: Intl.DateTimeFormatOptions = {
    timeZone: TZ_LOJA,
    localeMatcher: "best fit",
  };

  if (opciones === "corto") {
    Object.assign(config, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } else if (opciones === "medio") {
    Object.assign(config, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } else {
    Object.assign(config, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return new Intl.DateTimeFormat(LOCALE_LOJA, config).format(d);
}

/**
 * Formatea fecha + hora en zona Loja. Ej: "vie, 14 ago 2026, 19:00".
 */
export function formatFechaHoraLoja(
  fecha: Date | string | number,
  opciones: "corto" | "medio" | "largo" = "medio",
): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return "";

  const config: Intl.DateTimeFormatOptions = {
    timeZone: TZ_LOJA,
    localeMatcher: "best fit",
  };

  if (opciones === "corto") {
    Object.assign(config, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else if (opciones === "medio") {
    Object.assign(config, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else {
    Object.assign(config, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return new Intl.DateTimeFormat(LOCALE_LOJA, config).format(d);
}

/**
 * ¿La fecha ya pasó (en hora de Loja)? Útil para queries
 * "eventos próximos" — filtra fechas que todavía no han ocurrido.
 */
export function esEventoPasado(fecha: Date | string | number): boolean {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return true;
  return d.getTime() < Date.now();
}

/**
 * Devuelve los límites del día en zona Loja para una fecha dada.
 * Útil para queries "eventos de hoy" o "eventos de este finde".
 */
export function getDayBoundsLoja(
  fecha: Date | string | number,
): { inicio: Date; fin: Date } | null {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return null;

  const ymd = formatFechaLoja(d, "iso"); // YYYY-MM-DD en zona Loja
  // 00:00:00 hora Loja = 05:00 UTC
  const inicio = new Date(`${ymd}T00:00:00-05:00`);
  // 23:59:59.999 hora Loja del mismo día
  const fin = new Date(`${ymd}T23:59:59.999-05:00`);
  return { inicio, fin };
}