/**
 * SKILL ORCHESTRATOR — Dispatcher Central de Skills de Datos
 * ─────────────────────────────────────────────────────────────────────────────
 * Recibe la decisión del chatRouter y activa la Skill de Datos correspondiente.
 * Las Skills de Datos se activan SOLO cuando el usuario pide información concreta.
 * La conversación general, el flujo de venta y la memoria los maneja route.ts.
 *
 * MAPA DE INTENCIONES → SKILL:
 *   HOSPEDAJE_HOTEL        → skillHospedaje   (Botempresas)
 *   GASTRONOMIA_CAFETERIA  → skillGastronomia (Botempresas)
 *   EVENTOS_CULTURALES     → skillEventos     (agendaculturalbd)
 *   TURISMO_LUGARES_LOJA   → skillTurismo     (Botempresas)
 *   PLANIFICA_VISITA       → skillPlanVisita  (Mixto: todas las fuentes)
 *   Cualquier otra         → null (la conversación general la maneja el prompt central)
 *
 * ARQUITECTURA MULTI-DB ACTUAL:
 *   ┌───────────────────────────┬─────────────────────────────────────┐
 *   │ Dominio                   │ DB Actual (TRANSITORIA)              │
 *   ├───────────────────────────┼─────────────────────────────────────┤
 *   │ Eventos Culturales        │ agendaculturalbd (DATABASE_URL)      │
 *   │ Hospedaje / Hoteles       │ Botempresas     (CHATBOT_DB_URL)     │
 *   │ Gastronomía               │ Botempresas     (CHATBOT_DB_URL)     │
 *   │ Atractivos Turísticos     │ Botempresas     (CHATBOT_DB_URL)     │
 *   │ Sesiones / Leads / CRM    │ Botempresas     (CHATBOT_DB_URL)     │
 *   └───────────────────────────┴─────────────────────────────────────┘
 *
 * MIGRACIÓN FUTURA (ver bot/ARQUITECTURA_TRANSICION_DBS.md):
 *   🔜 Hospedaje + Atractivos → DB_TURISMO_URL    (cuando exista)
 *   🔜 Gastronomía            → DB_GASTRONOMIA_URL (cuando exista)
 *   Para migrar: cambiar 1 línea en cada skill respectiva. Nada más.
 */

import type { DecisionRouter } from "@/lib/chat/chatRouter";
import { ejecutarSkillEventos } from "./skillEventos";
import { ejecutarSkillHospedaje } from "./skillHospedaje";
import { ejecutarSkillGastronomia } from "./skillGastronomia";
import { ejecutarSkillTurismo } from "./skillTurismo";
import { ejecutarSkillPlanVisita } from "./skillPlanVisita";
import type { SkillInput, SkillResult } from "./types";

/** Construye el SkillInput a partir de los datos disponibles en route.ts */
export function construirSkillInput(params: {
  decision: DecisionRouter;
  mensajeUsuario: string;
  ubicacion?: { lat: number; lng: number; zona?: string; ciudad?: string; provincia?: string; direccionDetallada?: string } | null;
  resumenSesion?: string | null;
  rangoFecha?: { desde: Date; hasta: Date; etiqueta: string } | null;
  quierePasados?: boolean;
}): SkillInput {
  return {
    terminosBusqueda: params.decision.terminosBusqueda || [],
    ubicacion: params.ubicacion ?? undefined,
    mensajeUsuario: params.mensajeUsuario,
    resumenSesion: params.resumenSesion,
    rangoFecha: params.rangoFecha,
    quierePasados: params.quierePasados ?? false,
  };
}

/**
 * Ejecuta la Skill de Datos apropiada para la intención detectada.
 * Devuelve null si la intención no requiere búsqueda de datos en DB
 * (ej: saludos, consultas generales, flujos de venta activos).
 */
export async function ejecutarSkillPorIntencion(
  decision: DecisionRouter,
  skillInput: SkillInput,
  ahora: Date,
  hoyInicio: Date,
  fechaLabel?: string
): Promise<SkillResult | null> {
  switch (decision.intencion) {
    case "EVENTOS_CULTURALES":
      return ejecutarSkillEventos(skillInput, ahora, hoyInicio);

    case "HOSPEDAJE_HOTEL":
      return ejecutarSkillHospedaje(skillInput);

    case "GASTRONOMIA_CAFETERIA":
      return ejecutarSkillGastronomia(skillInput);

    case "TURISMO_LUGARES_LOJA":
      return ejecutarSkillTurismo(skillInput);

    case "PLANIFICA_VISITA":
      return ejecutarSkillPlanVisita(skillInput, hoyInicio, fechaLabel ?? "próximos días");

    // Las siguientes intenciones NO disparan una skill de datos:
    // - SALUDO_CORTE: El prompt central responde sin DB
    // - AMBIGUO_CONTRADICTORIO: route.ts hace retorno temprano
    // - WHATSAPP_HANDOFF: route.ts hace retorno temprano
    // - VENTA_ALIADO_CONTINUAR: El flujo de venta ya tiene el aliado en contexto
    // - CONSULTA_GENERAL: El prompt central maneja con contexto general
    default:
      return null;
  }
}
