/**
 * SKILL: Gastronomía (Restaurantes y Cafeterías)
 * ─────────────────────────────────────────────────────────────────────────────
 * Se activa cuando el router detecta intención: GASTRONOMIA_CAFETERIA
 *
 * FUENTE DE DATOS ACTUAL (TRANSITORIA):
 *   ✅ DB Central del Bot: Botempresas-353039368f96
 *   Variable: CHATBOT_DB_URL
 *   Cliente Prisma: prismaBot (lib/prisma-bot.ts)
 *   Tablas: aliados (tipo=GASTRONOMIA o CAFETERIA) + aliado_habitaciones (= opciones de menú)
 *   Datos copiados desde Agenda Cultural en Oct 2026.
 *
 * FUENTE DE DATOS FUTURA (cuando esté disponible):
 *   🔜 DB propia de Qué Comer en Loja: DB_GASTRONOMIA_URL
 *   Para migrar: en contenidoService.ts → gastronomiaService.obtenerRestaurantesYCafes()
 *   → solo cambiar prismaBot por un nuevo prismaGastro (1 línea).
 *   Ver bot/ARQUITECTURA_TRANSICION_DBS.md para el SQL de migración.
 *
 * LÓGICA DE BÚSQUEDA:
 *   1. Carga restaurantes y cafeterías activas (hasta 20)
 *   2. Filtra por palabras clave si las hay (tipo de cocina, plato, etc.)
 *   3. Si hay GPS → ordena por distancia (Haversine)
 *   4. Formatea el contexto con: nombre, tipo, ubicación, GPS, platos/especialidades,
 *      precio, WhatsApp, web y Maps
 */

import { gastronomiaService, enriquecerConDistanciaGPS } from "@/lib/chat/contenidoService";
import type { SkillInput, SkillResult } from "./types";
import type { HabitacionItem } from "@/lib/chat/contenidoService";

export async function ejecutarSkillGastronomia(input: SkillInput): Promise<SkillResult> {
  const { ubicacion, terminosBusqueda } = input;

  // ── 1. Cargar restaurantes y cafeterías desde Botempresas ────────────────
  let lugares = await gastronomiaService.obtenerRestaurantesYCafes(input.limite ?? 20);

  // ── 2. Filtrar por palabras clave si las hay ─────────────────────────────
  if (terminosBusqueda.length > 0) {
    const filtrados = lugares.filter((g) => {
      const haystack = `${g.nombre} ${g.descripcion} ${g.ubicacion} ${g.servicios || ""}`.toLowerCase();
      return terminosBusqueda.some((t) => haystack.includes(t.toLowerCase()));
    });
    if (filtrados.length > 0) lugares = filtrados;
  }

  // ── 3. Enriquecer con distancia GPS si aplica ────────────────────────────
  if (ubicacion?.lat && ubicacion?.lng) {
    lugares = enriquecerConDistanciaGPS(lugares, { lat: ubicacion.lat, lng: ubicacion.lng });
  }

  // ── 4. Formatear contexto para el prompt ─────────────────────────────────
  const aliadosContexto = lugares.map((a) => {
    const opcionesMenu = (a.habitaciones || [])
      .map((h: HabitacionItem) =>
        `${h.nombre}${h.precio ? ` (${h.precio})` : ""}${h.caracteristicas ? `: ${h.caracteristicas}` : ""}`
      )
      .join(" / ");
    const tipoLabel = a.tipo === "CAFETERIA" ? "Cafetería" : "Restaurante";
    return `[ID:${a.id}] ${a.nombre} | Tipo:${tipoLabel} | Dirección:${a.ubicacion}${a.distanciaTexto || ""} | Precio:${a.rangoPrecio || "Consultar"} | WhatsApp:${a.telefono || ""} | Web:${a.websiteUrl || ""} | Maps:${a.mapaUrl || ""}${opcionesMenu ? ` | Menú/Especialidades:${opcionesMenu}` : ""} | Desc:${a.descripcion}`;
  }).join("\n");

  const contextoGPS = ubicacion?.zona
    ? `\nUBICACIÓN GPS DEL USUARIO: Zona "${ubicacion.zona}". Los restaurantes están ordenados por cercanía.`
    : "";

  const hayRestaurantes = lugares.some((g) => g.tipo === "GASTRONOMIA");
  const hayCafeterias = lugares.some((g) => g.tipo === "CAFETERIA");

  return {
    contextoPrompt: `ALIADOS DE GASTRONOMÍA DISPONIBLES:\n${aliadosContexto || "Sin restaurantes o cafeterías registrados."}\n${contextoGPS}\n\nREGLA: Cuando el usuario pida dónde comer o tomar café, incluye SIEMPRE en "aliadosRecomendadosIds" los IDs de los lugares más relevantes (máximo 3).`,
    eventos: [],
    aliados: lugares,
    atractivos: [],
    respuestasRapidas: [
      lugares[0] ? `🍽️ Háblame de ${lugares[0].nombre}` : "🍽️ Ver restaurantes",
      hayCafeterias ? "☕ Ver cafeterías" : "🍕 Ver opciones de menú",
      "💰 ¿Cuánto cuesta comer?",
      hayRestaurantes ? "🥩 Comida típica lojana" : "☕ Especialidades de café",
    ],
    meta: {
      tipoBusqueda: ubicacion ? "gps" : terminosBusqueda.length > 0 ? "keyword" : "general",
      totalEncontrado: lugares.length,
      tieneUbicacion: !!(ubicacion?.lat),
      origenDatos: "botempresas",
    },
  };
}
