/**
 * SKILL: Eventos Culturales
 * ─────────────────────────────────────────────────────────────────────────────
 * Se activa cuando el router detecta intención: EVENTOS_CULTURALES
 *
 * FUENTE DE DATOS ACTUAL:
 *   ✅ DB Eventos (Agenda Cultural): agendaculturalbd-313930d0fa
 *   Variables: DATABASE_URL
 *   Cliente Prisma: prisma (lib/prisma.ts)
 *   Tablas: eventos (estado=APROBADO)
 *
 * FUENTE DE DATOS FUTURA:
 *   🔜 Esta DB es ya la definitiva — no requiere migración futura.
 *      Los eventos siempre provienen de la DB principal de Agenda Cultural.
 *
 * LÓGICA DE BÚSQUEDA (en orden de prioridad):
 *   1. Si quierePasados → obtenerPasados()
 *   2. Si hay terminosBusqueda → obtenerPorTematica()
 *      → Si no hay futuros, intenta pasados del mismo tema
 *   3. Si hay rangoFecha específico → obtenerPorRango()
 *   4. Si no hay ninguno → obtenerProximos() (cartelera general)
 *   + Si hay pregunta referencial sobre un evento: obtenerCandidatosReferenciales()
 */

import { eventosService } from "@/lib/chat/contenidoService";
import type { SkillInput, SkillResult } from "./types";

const DIAS_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESES_ES = ["enero","febrero","marzo","abril","mayo","junio",
                  "julio","agosto","septiembre","octubre","noviembre","diciembre"];

function formatearFechaEvento(fecha: Date, ahora: Date, hoyInicio: Date): {
  estadoTemporal: string;
  fechaStr: string;
  horaStr: string;
} {
  const esMismaFecha =
    fecha.getUTCFullYear() === ahora.getUTCFullYear() &&
    fecha.getUTCMonth() === ahora.getUTCMonth() &&
    fecha.getUTCDate() === ahora.getUTCDate();

  let estadoTemporal = "PRÓXIMO";
  if (esMismaFecha) estadoTemporal = "¡HOY!";
  else if (fecha < hoyInicio) estadoTemporal = "FINALIZADO / PASADO";

  const horaStr = fecha.toISOString().slice(11, 16);
  const fechaStr = `${DIAS_ES[fecha.getUTCDay()]} ${fecha.getUTCDate()} de ${MESES_ES[fecha.getUTCMonth()]} de ${fecha.getUTCFullYear()}`;

  return { estadoTemporal, fechaStr, horaStr };
}

export async function ejecutarSkillEventos(input: SkillInput, ahora: Date, hoyInicio: Date): Promise<SkillResult> {
  const { terminosBusqueda, rangoFecha, quierePasados, mensajeUsuario } = input;

  let eventos: Awaited<ReturnType<typeof eventosService.obtenerProximos>> = [];
  let tipoBusqueda = "general";
  let guiaBusqueda = "";

  // ── 1. Eventos PASADOS ────────────────────────────────────────────────────
  if (quierePasados) {
    tipoBusqueda = "pasados";
    eventos = await eventosService.obtenerPasados(hoyInicio, terminosBusqueda, 6);
    guiaBusqueda = `\nCONSULTA DE HISTORIAL / PASADOS: El usuario pregunta por eventos pasados. Resúmelos brevemente indicando que ya finalizaron.`;
  }
  // ── 2. Búsqueda TEMÁTICA por palabras clave ───────────────────────────────
  else if (terminosBusqueda.length > 0) {
    tipoBusqueda = "tematica";
    eventos = await eventosService.obtenerPorTematica(
      terminosBusqueda,
      rangoFecha ? rangoFecha.desde : hoyInicio,
      rangoFecha ? rangoFecha.hasta : undefined,
      6
    );

    // Fallback: si no hay futuros del tema, buscar pasados del mismo
    if (eventos.length === 0 && !rangoFecha) {
      const pasadosTema = await eventosService.obtenerPasados(hoyInicio, terminosBusqueda, 3);
      if (pasadosTema.length > 0) {
        tipoBusqueda = "tematica_pasada";
        eventos = pasadosTema;
        guiaBusqueda = `\nRESULTADO TEMÁTICO: No hay eventos futuros de "${terminosBusqueda.join(", ")}", solo eventos pasados. Dilo cordialmente en 1 frase y sugiere los eventos vigentes preguntándole si le gustaría explorarlos.`;
      } else {
        guiaBusqueda = `\nSIN COINCIDENCIAS: No hay eventos de "${terminosBusqueda.join(", ")}" en cartelera. Dilo con amabilidad en 1 oración y sugiere revisar la cartelera general.`;
      }
    } else if (eventos.length > 0) {
      guiaBusqueda = `\nRESULTADO TEMÁTICO: Se encontraron ${eventos.length} evento(s) sobre "${terminosBusqueda.join(", ")}". Responde con entusiasmo y haz una pregunta sugerente.`;
    }
  }
  // ── 3. Rango de FECHA específico ─────────────────────────────────────────
  else if (rangoFecha) {
    tipoBusqueda = "rango_fecha";
    eventos = await eventosService.obtenerPorRango(rangoFecha.desde, rangoFecha.hasta, 8);
  }

  // ── 4. Fallback: Cartelera general (próximos) ────────────────────────────
  if (eventos.length === 0 && !rangoFecha && !quierePasados) {
    tipoBusqueda = "general";
    eventos = await eventosService.obtenerProximos(hoyInicio, 6);
  }

  // ── 5. Formatear contexto para el prompt ─────────────────────────────────
  const eventosContexto = eventos.map((e) => {
    const fechaEv = new Date(e.fecha);
    const { estadoTemporal, fechaStr, horaStr } = formatearFechaEvento(fechaEv, ahora, hoyInicio);
    return `[ID:${e.id}] ${e.nombre} | Estado:${estadoTemporal} | Fecha:${fechaStr} ${horaStr} | Lugar:${e.lugar} | Descripción:${(e.descripcion || "").slice(0, 600)} | Enlace:/eventos/${e.slug}`;
  }).join("\n");

  const detalleRango = rangoFecha
    ? `\nRANGO DE FECHA: Consulta para ${rangoFecha.etiqueta}. ${eventos.length === 0 ? "No hay eventos para esa fecha." : ""}`
    : "";

  return {
    contextoPrompt: `EVENTOS DISPONIBLES:\n${eventosContexto || "Sin eventos en cartelera en este momento."}\n${detalleRango}\n${guiaBusqueda}`,
    eventos,
    aliados: [],
    atractivos: [],
    respuestasRapidas: [
      "🎭 Ver cartelera completa",
      "🎵 Conciertos y música",
      "🎬 Teatro y danza",
      "🌿 Qué visitar en Loja",
    ],
    meta: {
      tipoBusqueda,
      totalEncontrado: eventos.length,
      tieneUbicacion: false,
      origenDatos: "agendacultural",
    },
  };
}
