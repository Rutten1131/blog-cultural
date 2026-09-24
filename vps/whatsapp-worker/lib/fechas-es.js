/**
 * Utilidades de fecha/hora en español — Worker de WhatsApp
 *
 * REGLA DEL PROYECTO (espejo de lib/fechas.ts del sitio):
 *   Ecuador continental = UTC-5 TODO el año (sin DST).
 *
 *   - Si el texto solo da el DÍA (sin hora):
 *       guardar a las 17:00 UTC (= 12:00 mediodía en Loja).
 *       Esto evita el off-by-one de un día que ya se sufrió en el proyecto.
 *   - Si el texto da HORA explícita:
 *       interpretarla como hora de Loja y convertir a UTC con offset -05:00.
 *
 * IMPORTANTE — "sin inventarse nada":
 *   Este módulo NUNCA completa datos que no estén en el texto.
 *   Cuando infiere algo (por ejemplo el año), lo reporta explícitamente
 *   mediante la bandera `anioInferido` para que el moderador lo sepa.
 */

const MESES = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9, // variante ortográfica frecuente
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const ZONA_LOJA = "America/Guayaquil";
const OFFSET_LOJA = "-05:00";

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Valida que una terna año/mes/día exista realmente en el calendario. */
function fechaValida(y, m, d) {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return false;
  }
  if (y < 2000 || y > 2100) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;

  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Año actual según el calendario de Loja (no el del servidor). */
function anioActualLoja() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_LOJA,
    year: "numeric",
  });
  return Number(fmt.format(new Date()));
}

/** Fecha "solo día" en calendario Loja → 17:00 UTC (mediodía Loja). */
function fechaSoloDiaLoja(y, m, d) {
  if (!fechaValida(y, m, d)) return null;
  const dt = new Date(`${y}-${pad(m)}-${pad(d)}T17:00:00Z`);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Fecha con hora de Loja → Date UTC. */
function fechaHoraLoja(y, m, d, hh, mm) {
  if (!fechaValida(y, m, d)) return null;
  if (!Number.isInteger(hh) || hh < 0 || hh > 23) return null;
  if (!Number.isInteger(mm) || mm < 0 || mm > 59) return null;

  const dt = new Date(`${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00${OFFSET_LOJA}`);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Combina una terna de fecha con una hora opcional aplicando la regla de zona. */
function construirFecha(y, m, d, hora) {
  if (hora) {
    const conHora = fechaHoraLoja(y, m, d, hora.hh, hora.mm);
    if (conHora) return conHora;
  }
  return fechaSoloDiaLoja(y, m, d);
}

/** Convierte un valor ISO (JSON-LD, meta tags) a Date respetando la regla. */
function fechaDesdeIso(iso) {
  if (!iso || typeof iso !== "string") return null;
  const s = iso.trim();

  // "2026-10-20" → solo día, sin hora
  const soloDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (soloDia) {
    return fechaSoloDiaLoja(
      Number(soloDia[1]),
      Number(soloDia[2]),
      Number(soloDia[3])
    );
  }

  // ISO completo con hora/zona → confiar en el offset declarado
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

/**
 * Busca una hora en texto libre en español.
 * Soporta: "19h00", "19:00", "7:00 pm", "7pm", "19 horas".
 * @returns {{hh:number, mm:number}|null}
 */
function extraerHoraDeTexto(texto) {
  if (!texto) return null;

  // ── Primero am/pm: "7:00 pm" debe dar 19, no 7. ──
  // Si se probara después del patrón HH:MM, "7:00" ya lo habría capturado.
  let m = /(?<![\d/-])(\d{1,2})(?::(\d{2}))?\s*(a\.?\s?m\.?|p\.?\s?m\.?)(?!\w)/i.exec(texto);
  if (m) {
    let hh = Number(m[1]);
    const mm = m[2] ? Number(m[2]) : 0;
    const sufijo = m[3].toLowerCase().replace(/[.\s]/g, "");
    if (sufijo === "pm" && hh < 12) hh += 12;
    if (sufijo === "am" && hh === 12) hh = 0;
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return { hh, mm };
  }

  // "19h00" / "19:00" / "19h30"
  // El lookbehind evita capturar pedazos de fechas como "2026-10-20".
  m = /(?<![\d/-])(\d{1,2})\s*(?:h|:)\s*(\d{2})(?!\d)/.exec(texto);
  if (m) {
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return { hh, mm };
  }

  // "19 horas" / "a las 19"
  m = /(?<![\d/-])(\d{1,2})\s*horas?\b/i.exec(texto);
  if (m) {
    const hh = Number(m[1]);
    if (hh >= 0 && hh <= 23) return { hh, mm: 0 };
  }

  return null;
}

/**
 * Busca una fecha en texto libre en español.
 *
 * Reconoce:
 *   - "20 de octubre de 2026", "4 de octubre", "20 octubre"
 *   - "20/10/2026", "20-10-26"
 *   - "2026-10-20"
 *
 * @returns {{fecha: Date, anioInferido: boolean, tieneHora: boolean, coincidencia: string}|null}
 */
function extraerFechaDeTexto(texto) {
  if (!texto || typeof texto !== "string") return null;

  const anioActual = anioActualLoja();
  let y = null;
  let m = null;
  let d = null;
  let anioInferido = false;
  let coincidencia = "";

  // ── 1. ISO: 2026-10-20 (sin ambigüedad) ──
  const iso = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/.exec(texto);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
    coincidencia = iso[0];
  }

  // ── 2. "20 de octubre [de 2026]" / "20 octubre" ──
  if (!y) {
    const nombresMes = Object.keys(MESES).join("|");
    const re = new RegExp(
      String.raw`(?<!\d)(\d{1,2})\s*(?:de\s+)?(${nombresMes})(?:\s*(?:de|del)\s*(\d{4}))?`,
      "i"
    );
    const mm = re.exec(texto);
    if (mm) {
      d = Number(mm[1]);
      m = MESES[mm[2].toLowerCase()];
      coincidencia = mm[0].trim();

      if (mm[3]) {
        y = Number(mm[3]);
      } else {
        y = anioActual;
        anioInferido = true;
      }
    }
  }

  // ── 3. "20/10/2026" o "20-10-26" (convención día/mes) ──
  if (!y) {
    const num = /(?<![\d/-])(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?![\d/-])/.exec(texto);
    if (num) {
      const dd = Number(num[1]);
      const mmes = Number(num[2]);
      let aa = Number(num[3]);
      if (aa < 100) aa += 2000; // "26" → 2026

      d = dd;
      m = mmes;
      y = aa;
      coincidencia = num[0];
    }
  }

  if (!y || !m || !d) return null;

  // Si el año no venía explícito y la fecha ya pasó hace más de 30 días,
  // asumimos que el organizador habla del próximo año. Queda marcado.
  if (anioInferido) {
    const tentativa = fechaSoloDiaLoja(y, m, d);
    if (tentativa) {
      const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (tentativa.getTime() < hace30dias.getTime()) {
        y += 1;
      }
    }
  }

  const hora = extraerHoraDeTexto(texto);
  const fecha = construirFecha(y, m, d, hora);

  if (!fecha) return null;

  return {
    fecha,
    anioInferido,
    tieneHora: Boolean(hora),
    coincidencia,
  };
}

/**
 * Extrae el rango completo (inicio y fin) de un texto.
 *
 * Cubre el caso típico del grupo de WhatsApp y el formato de rango:
 *   - "Del 4 al 6 de octubre de 2026" → inicio 4, fin 6
 *   - "Sábado 4 de octubre, 19h00"    → solo inicio
 */
function extraerRangoDeTexto(texto) {
  if (!texto || typeof texto !== "string") return null;

  const anioActual = anioActualLoja();
  const hora = extraerHoraDeTexto(texto);

  // ── Caso explícito: "del 4 al 6 de octubre [de 2026]" ──
  const nombresMes = Object.keys(MESES).join("|");
  const reRango = new RegExp(
    String.raw`(?:\bdel\s+)?(?<!\d)(\d{1,2})\s+(?:al|hasta\s+el)\s+(\d{1,2})\s+de\s+(${nombresMes})(?:\s+(?:de|del)\s*(\d{4}))?`,
    "i"
  );
  const mr = reRango.exec(texto);

  if (mr) {
    const d1 = Number(mr[1]);
    const d2 = Number(mr[2]);
    const mes = MESES[mr[3].toLowerCase()];
    let anio = mr[4] ? Number(mr[4]) : anioActual;
    const anioInferido = !mr[4];

    let f1 = construirFecha(anio, mes, d1, hora);
    let f2 = construirFecha(anio, mes, d2, hora);

    // Si el año se infirió y el rango ya pasó, asumimos el próximo año.
    if (anioInferido && f1) {
      const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (f1.getTime() < hace30dias.getTime()) {
        anio += 1;
        f1 = construirFecha(anio, mes, d1, hora);
        f2 = construirFecha(anio, mes, d2, hora);
      }
    }

    if (f1) {
      return {
        fecha: f1,
        fechaFin: f2 && f2.getTime() > f1.getTime() ? f2 : null,
        anioInferido,
        tieneHora: Boolean(hora),
        coincidenciaInicio: mr[0],
        coincidenciaFin: mr[0],
      };
    }
  }

  // ── Caso general: una sola fecha ──
  const inicio = extraerFechaDeTexto(texto);
  if (!inicio) return null;

  // Buscar una segunda fecha distinta para el fin.
  const resto = texto.replace(inicio.coincidencia, " ");
  const fin = extraerFechaDeTexto(resto);

  return {
    fecha: inicio.fecha,
    fechaFin: fin && fin.fecha.getTime() > inicio.fecha.getTime() ? fin.fecha : null,
    anioInferido: inicio.anioInferido || Boolean(fin && fin.anioInferido),
    tieneHora: inicio.tieneHora,
    coincidenciaInicio: inicio.coincidencia,
    coincidenciaFin: fin ? fin.coincidencia : null,
  };
}

module.exports = {
  MESES,
  ZONA_LOJA,
  fechaValida,
  anioActualLoja,
  fechaSoloDiaLoja,
  fechaHoraLoja,
  fechaDesdeIso,
  extraerHoraDeTexto,
  extraerFechaDeTexto,
  extraerRangoDeTexto,
};
