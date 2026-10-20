/**
 * SKILL: Hospedaje (Hoteles, Hosterías, Hostales)
 * ─────────────────────────────────────────────────────────────────────────────
 * Se activa cuando el router detecta intención: HOSPEDAJE_HOTEL
 *
 * FUENTE DE DATOS ACTUAL (TRANSITORIA):
 *   ✅ DB Central del Bot: Botempresas-353039368f96
 *   Variable: CHATBOT_DB_URL
 *   Cliente Prisma: prismaBot (lib/prisma-bot.ts)
 *   Tablas: aliados (tipo=HOSPEDAJE) + aliado_habitaciones
 *   Datos copiados desde Agenda Cultural en Oct 2026.
 *
 * FUENTE DE DATOS FUTURA (cuando esté disponible):
 *   🔜 DB propia de Agenda Turística Loja: DB_TURISMO_URL
 *   Para migrar: en contenidoService.ts → turismoService.obtenerHoteles()
 *   → solo cambiar prismaBot por un nuevo prismaTurismo (1 línea).
 *   Ver bot/ARQUITECTURA_TRANSICION_DBS.md para el SQL de migración.
 *
 * LÓGICA DE BÚSQUEDA:
 *   1. Carga todos los hoteles activos (hasta 20) con sus habitaciones
 *   2. Si hay GPS → ordena por distancia (Haversine)
 *   3. Formatea el contexto con: nombre, tipo, ubicación, GPS, rango de precios,
 *      servicios, habitaciones (tipos + precio), WhatsApp, web y Maps
 */

import { turismoService, enriquecerConDistanciaGPS } from "@/lib/chat/contenidoService";
import type { SkillInput, SkillResult } from "./types";
import type { HabitacionItem } from "@/lib/chat/contenidoService";

// Cantones oficiales de la provincia de Loja para detección inteligente
const CANTONES_LOJA = [
  "Loja", "Catamayo", "Saraguro", "Paltas", "Calvas", "Puyango",
  "Macará", "Celica", "Gonzanamá", "Espíndola", "Chaguarpamba",
  "Pindal", "Sozoranga", "Zapotillo", "Olmedo", "Quilanga"
];

function extraerCantonDeTexto(texto: string): string | null {
  const normalizar = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const textoNorm = normalizar(texto);
  for (const c of CANTONES_LOJA) {
    const cNorm = normalizar(c);
    const regex = new RegExp(`\\b${cNorm}\\b`, "i");
    if (regex.test(textoNorm)) return c;
  }
  return null;
}

export async function ejecutarSkillHospedaje(input: SkillInput): Promise<SkillResult> {
  const { ubicacion, terminosBusqueda, mensajeUsuario } = input;

  // ── 1. Detectar si el usuario pregunta por un cantón específico ────────────
  const cantonDetectado = extraerCantonDeTexto(
    `${mensajeUsuario || ""} ${terminosBusqueda.join(" ")} ${ubicacion?.ciudad || ""} ${ubicacion?.provincia || ""}`
  );

  // ── 2. Cargar hoteles desde la DB (aprovechando filtro de cantón si existe) ─
  let hoteles = await turismoService.obtenerHoteles(input.limite ?? 20, cantonDetectado || undefined);

  // ── 3. Priorización estricta por cantón si fue detectado ──────────────────
  if (cantonDetectado) {
    const coincidenciasCanton = hoteles.filter((h) => {
      if (h.canton && h.canton.toLowerCase() === cantonDetectado.toLowerCase()) return true;
      const haystack = `${h.ubicacion} ${h.descripcion}`.toLowerCase();
      return haystack.includes(cantonDetectado.toLowerCase());
    });
    if (coincidenciasCanton.length > 0) {
      hoteles = coincidenciasCanton;
    }
  } else if (terminosBusqueda.length > 0) {
    // Filtrar por palabras clave si no fue búsqueda por cantón
    const filtrados = hoteles.filter((h) => {
      const haystack = `${h.nombre} ${h.descripcion} ${h.ubicacion} ${h.servicios || ""} ${h.canton || ""}`.toLowerCase();
      return terminosBusqueda.some((t) => haystack.includes(t.toLowerCase()));
    });
    if (filtrados.length > 0) hoteles = filtrados;
  }

  // ── 4. Enriquecer con distancia GPS si aplica ────────────────────────────
  if (ubicacion?.lat && ubicacion?.lng) {
    hoteles = enriquecerConDistanciaGPS(hoteles, { lat: ubicacion.lat, lng: ubicacion.lng });
  }

  // ── 5. Formatear contexto para el prompt ─────────────────────────────────
  const aliadosContexto = hoteles.map((a) => {
    const tiposHabitacion = (a.habitaciones || [])
      .map((h: HabitacionItem) =>
        `${h.nombre}${h.precio ? ` (${h.precio})` : ""}${h.caracteristicas ? `: ${h.caracteristicas}` : ""}`
      )
      .join(" / ");
    const cantonTexto = a.canton ? ` | Cantón:${a.canton}` : "";
    return `[ID:${a.id}] ${a.nombre} | Tipo:${a.tipo}${cantonTexto} | Dirección:${a.ubicacion}${a.distanciaTexto || ""} | Precio:${a.rangoPrecio || "Consultar"} | WhatsApp:${a.telefono || ""} | Web:${a.websiteUrl || ""} | Maps:${a.mapaUrl || ""} | Servicios:${a.servicios || ""}${tiposHabitacion ? ` | Habitaciones:${tiposHabitacion}` : ""} | Desc:${a.descripcion}`;
  }).join("\n");

  const contextoCanton = cantonDetectado
    ? `\nCANTÓN CONSULTADO POR EL USUARIO: "${cantonDetectado}". Los hoteles mostrados pertenecen o están vinculados a este cantón.`
    : "";

  const contextoGPS = ubicacion?.zona
    ? `\nUBICACIÓN GPS DEL USUARIO: Zona "${ubicacion.zona}". Los hoteles están ordenados por cercanía.`
    : "";

  return {
    contextoPrompt: `ALIADOS DE HOSPEDAJE DISPONIBLES:\n${aliadosContexto || "Sin hoteles registrados para esta búsqueda."}\n${contextoCanton}${contextoGPS}\n\nREGLA: Cuando el usuario pida hospedaje, incluye SIEMPRE en "aliadosRecomendadosIds" los IDs de los hoteles más relevantes (máximo 3). Si especificó un cantón, recomienda EXCLUSIVAMENTE los hoteles de ese cantón.`,
    eventos: [],
    aliados: hoteles,
    atractivos: [],
    respuestasRapidas: [
      hoteles[0] ? `🏨 Háblame de ${hoteles[0].nombre}` : "🏨 Ver hoteles disponibles",
      "💰 ¿Cuánto cuesta hospedarse?",
      "📍 ¿Cuál queda más cerca?",
      "🌿 Qué visitar en Loja",
    ],
    meta: {
      tipoBusqueda: ubicacion ? "gps" : terminosBusqueda.length > 0 ? "keyword" : "general",
      totalEncontrado: hoteles.length,
      tieneUbicacion: !!(ubicacion?.lat),
      origenDatos: "botempresas",
    },
  };
}
