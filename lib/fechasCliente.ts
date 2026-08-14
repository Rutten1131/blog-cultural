/**
 * lib/fechasCliente.ts — Versión client-safe de utilitarios de fecha.
 *
 * Usado SOLO por Client Components que no pueden importar `lib/fechas.ts`
 * (que usa `import "server-only"`).
 *
 * Mantener en sincronía con `lib/fechas.ts`. La lógica de formateo es
 * idéntica (no toca BD, no toca server-only APIs), solo se separa por
 * la restricción arquitectónica.
 */

export const TZ_LOJA_CLIENTE = "America/Guayaquil" as const;
export const LOCALE_LOJA_CLIENTE = "es-EC" as const;

/**
 * Formatea una fecha (Date o string ISO) en zona horaria de Loja.
 * Equivalente a `formatFechaLoja` de lib/fechas.ts.
 */
export function formatFechaLojaCliente(
  fecha: Date | string | number,
  opciones: "corto" | "medio" | "largo" | "iso" = "medio",
): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return "";

  if (opciones === "iso") {
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ_LOJA_CLIENTE,
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
    timeZone: TZ_LOJA_CLIENTE,
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

  return new Intl.DateTimeFormat(LOCALE_LOJA_CLIENTE, config).format(d);
}

/**
 * Formatea fecha + hora en zona Loja.
 */
export function formatFechaHoraLojaCliente(
  fecha: Date | string | number,
  opciones: "corto" | "medio" | "largo" = "medio",
): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return "";

  const config: Intl.DateTimeFormatOptions = {
    timeZone: TZ_LOJA_CLIENTE,
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

  return new Intl.DateTimeFormat(LOCALE_LOJA_CLIENTE, config).format(d);
}