/**
 * SKILL: Planifica tu Visita (Multi-Intención)
 * ─────────────────────────────────────────────────────────────────────────────
 * Se activa cuando el router detecta intención: PLANIFICA_VISITA
 *
 * Esta skill ORQUESTA las otras 3 skills (Eventos + Hospedaje + Gastronomía)
 * en paralelo para armar un plan completo de visita en 1 sola respuesta.
 *
 * FUENTES DE DATOS:
 *   🎭 Eventos: agendaculturalbd (DATABASE_URL) — via eventosService
 *   🏨 Hoteles: Botempresas (CHATBOT_DB_URL) — via turismoService
 *   🍽️ Restaurantes: Botempresas (CHATBOT_DB_URL) — via gastronomiaService
 *   🌿 Atractivos: Botempresas (CHATBOT_DB_URL) — via turismoService
 *
 * LÓGICA:
 *   1. Extrae rango de fechas si el usuario lo mencionó
 *   2. Lanza 4 consultas en paralelo (Promise.all)
 *   3. Combina el contexto y construye el prompt unificado
 *   4. Devuelve respuestasRápidas que apuntan a profundizar en cada sub-tema
 */

import {
  eventosService,
  turismoService,
  gastronomiaService,
} from "@/lib/chat/contenidoService";
import type { SkillInput, SkillResult } from "./types";
import type { HabitacionItem } from "@/lib/chat/contenidoService";

export async function ejecutarSkillPlanVisita(
  input: SkillInput,
  hoyInicio: Date,
  fechaLabel: string
): Promise<SkillResult> {
  const { rangoFecha, ubicacion } = input;

  // ── 1. Consulta en paralelo las 4 fuentes ────────────────────────────────
  const [eventosVisita, hotelesVisita, gastroVisita, atractivosVisita] = await Promise.all([
    eventosService.obtenerParaPlanVisita(
      rangoFecha ? rangoFecha.desde : hoyInicio,
      rangoFecha ? rangoFecha.hasta : undefined,
      4
    ),
    turismoService.obtenerHoteles(3),
    gastronomiaService.obtenerRestaurantesYCafes(3),
    turismoService.obtenerAtractivos(3),
  ]);

  // ── 2. Formatear para el prompt ──────────────────────────────────────────
  const eventosStr = eventosVisita.length > 0
    ? eventosVisita.map((e) =>
        `- ${e.nombre} | ${new Date(e.fecha).toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })} | ${e.lugar}`
      ).join("\n")
    : "- Sin eventos programados para esa fecha aún (la cartelera se actualiza constantemente)";

  const hotelesStr = hotelesVisita.length > 0
    ? hotelesVisita.map((h) => {
        const tiposHabitacion = (h.habitaciones || [])
          .map((hab: HabitacionItem) => `${hab.nombre}${hab.precio ? ` (${hab.precio})` : ""}`)
          .join(" / ");
        return `- [ID:${h.id}] ${h.nombre} | ${h.rangoPrecio || "Consultar precio"} | ${h.ubicacion}${tiposHabitacion ? ` | Habitaciones: ${tiposHabitacion}` : ""}`;
      }).join("\n")
    : "- Sin hoteles";

  const gastroStr = gastroVisita.length > 0
    ? gastroVisita.map((g) =>
        `- [ID:${g.id}] ${g.nombre} (${g.tipo === "CAFETERIA" ? "Cafetería" : "Restaurante"}) | ${g.ubicacion}`
      ).join("\n")
    : "- Sin restaurantes";

  const contextoPrompt = `El usuario quiere PLANIFICAR UNA VISITA completa a Loja.

Tu misión: responder en UNA SOLA respuesta integrada y cálida con 3 secciones:
1. 🎭 QUÉ HACER: menciona 1 o 2 eventos de la cartelera para ${fechaLabel}
2. 🏨 DÓNDE DORMIR: recomienda 1 hotel destacado con precio orientativo
3. 🍽️ DÓNDE COMER: recomienda 1 restaurante o cafetería típica de Loja

EVENTOS DISPONIBLES para ${fechaLabel}:
${eventosStr}

HOTELES RECOMENDADOS:
${hotelesStr}

RESTAURANTES/CAFETERÍAS:
${gastroStr}

Reglas de formato:
- Máximo 5-6 frases en total. Responde con calidez y entusiasmo lojano.
- Termina invitando a profundizar en cualquiera de los 3 temas.`;

  const todosAliados = [...hotelesVisita, ...gastroVisita];

  return {
    contextoPrompt,
    eventos: eventosVisita,
    aliados: todosAliados,
    atractivos: atractivosVisita,
    respuestasRapidas: [
      eventosVisita[0] ? `🎭 Más info de ${eventosVisita[0].nombre}` : "🎭 Ver cartelera completa",
      hotelesVisita[0] ? `🏨 Háblame de ${hotelesVisita[0].nombre}` : "🏨 Ver hoteles",
      gastroVisita[0] ? `🍽️ Háblame de ${gastroVisita[0].nombre}` : "🍽️ Ver restaurantes",
      "🌿 Qué más ver en Loja",
    ],
    meta: {
      tipoBusqueda: "planvisita_completo",
      totalEncontrado: eventosVisita.length + hotelesVisita.length + gastroVisita.length + atractivosVisita.length,
      tieneUbicacion: !!(ubicacion?.lat),
      origenDatos: "mixto_agendacultural+botempresas",
    },
  };
}
