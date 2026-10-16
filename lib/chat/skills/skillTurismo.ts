/**
 * SKILL: Turismo y Atractivos Cantonales (Naturaleza, Rutas, Cantones)
 * ─────────────────────────────────────────────────────────────────────────────
 * Se activa cuando el router detecta intención: TURISMO_LUGARES_LOJA
 *
 * FUENTE DE DATOS ACTUAL (TRANSITORIA):
 *   ✅ DB Central del Bot: Botempresas-353039368f96
 *   Variable: CHATBOT_DB_URL
 *   Cliente Prisma: prismaBot (lib/prisma-bot.ts)
 *   Tablas: atractivos_cantonales
 *   Datos copiados desde Agenda Cultural en Oct 2026.
 *
 * FUENTE DE DATOS FUTURA (cuando esté disponible):
 *   🔜 DB propia de Agenda Turística Loja: DB_TURISMO_URL
 *   Para migrar: en contenidoService.ts → turismoService.obtenerAtractivos()
 *   → solo cambiar prismaBot por un nuevo prismaTurismo (1 línea).
 *   Ver bot/ARQUITECTURA_TRANSICION_DBS.md para el SQL de migración.
 *
 * LÓGICA DE BÚSQUEDA:
 *   1. Carga todos los atractivos activos (hasta 6 por defecto)
 *   2. Filtra por palabras clave si las hay (vilcabamba, saraguro, cascada, etc.)
 *   3. Formatea el contexto con: nombre, cantón, distancia, ruta, descripción, mapa
 *   4. Opcional: también carga hoteles si el usuario puede querer hospedarse
 */

import { turismoService } from "@/lib/chat/contenidoService";
import type { SkillInput, SkillResult } from "./types";

export async function ejecutarSkillTurismo(input: SkillInput): Promise<SkillResult> {
  const { terminosBusqueda } = input;

  // ── 1. Cargar atractivos desde Botempresas ───────────────────────────────
  let atractivos = await turismoService.obtenerAtractivos(input.limite ?? 6);

  // ── 2. Filtrar por palabras clave (canton, tipo de naturaleza, etc.) ─────
  if (terminosBusqueda.length > 0) {
    const filtrados = atractivos.filter((at) => {
      const haystack = `${at.nombre} ${at.canton} ${at.descripcion} ${at.ruta}`.toLowerCase();
      return terminosBusqueda.some((t) => haystack.includes(t.toLowerCase()));
    });
    if (filtrados.length > 0) atractivos = filtrados;
  }

  // ── 3. Formatear contexto para el prompt ─────────────────────────────────
  const atractivosContexto = atractivos.map((at) =>
    `[ID:${at.id}] ${at.nombre} | Cantón:${at.canton} | Distancia:${at.distancia} | Ruta:${at.ruta} | Desc:${at.descripcion}`
  ).join("\n");

  return {
    contextoPrompt: `ATRACTIVOS TURÍSTICOS CANTONALES:\n${atractivosContexto || "Sin atractivos registrados."}\n\nREGLA NATURALEZA PRIMERO: Si el usuario pide naturaleza, rutas, parques, cascadas, cerros, senderismo, miradores o actividades al aire libre, usa SIEMPRE "atractivosRecomendadosIds" con los IDs correspondientes. NO recomiendes eventos de cartelera para esta intención.`,
    eventos: [],
    aliados: [],
    atractivos,
    respuestasRapidas: [
      atractivos[0] ? `🌿 Cuéntame de ${atractivos[0].nombre}` : "🌿 Ver atractivos naturales",
      "🚶 Rutas de senderismo",
      "🏨 ¿Dónde hospedarse cerca?",
      "🗺️ Cantones de Loja",
    ],
    meta: {
      tipoBusqueda: terminosBusqueda.length > 0 ? "keyword" : "general",
      totalEncontrado: atractivos.length,
      tieneUbicacion: false,
      origenDatos: "botempresas",
    },
  };
}
