/**
 * Tipos compartidos por todas las Skills de Datos del Chatbot.
 *
 * Una "Skill de Datos" es un módulo que se activa SOLO cuando el router detecta
 * una intención de consultar datos concretos (hospedaje, gastronomía, eventos, turismo).
 * NO aplica a la conversación general del bot — eso lo maneja el System Prompt central.
 */

import type { AliadoItem, AtractivoItem, EventoItem } from "@/lib/chat/contenidoService";

/** Ubicación GPS del usuario (opcional, mejora las recomendaciones por cercanía) */
export interface UbicacionInput {
  lat: number;
  lng: number;
  zona?: string;
  ciudad?: string;
  provincia?: string;
  direccionDetallada?: string;
}

/** Entrada estándar que recibe cualquier Skill de Datos */
export interface SkillInput {
  /** Palabras clave detectadas por el router (ej: ["rock", "jazz", "teatro"]) */
  terminosBusqueda: string[];
  /** Ubicación GPS del usuario (si la compartió) */
  ubicacion?: UbicacionInput;
  /** Mensaje original del usuario */
  mensajeUsuario: string;
  /** Resumen de la sesión anterior (memoria CRM) */
  resumenSesion?: string | null;
  /** Máximo de registros a devolver (default varía por skill) */
  limite?: number;
  /** Rango de fecha para eventos (desde / hasta / etiqueta legible) */
  rangoFecha?: {
    desde: Date;
    hasta: Date;
    etiqueta: string;
  } | null;
  /** Si el usuario quiere ver eventos pasados */
  quierePasados?: boolean;
}

/** Resultado estándar que devuelve cualquier Skill de Datos */
export interface SkillResult {
  /** Bloque de texto listo para inyectar en el System Prompt de la IA */
  contextoPrompt: string;
  /** Eventos encontrados (pueden estar vacíos si la skill no los usa) */
  eventos: EventoItem[];
  /** Aliados encontrados (hoteles, restaurantes, cafeterías) */
  aliados: AliadoItem[];
  /** Atractivos cantonales encontrados */
  atractivos: AtractivoItem[];
  /** Sugerencias de respuesta rápida para el widget */
  respuestasRapidas: string[];
  /** Metadatos adicionales de la búsqueda para el prompt */
  meta: {
    tipoBusqueda: string;
    totalEncontrado: number;
    tieneUbicacion: boolean;
    origenDatos: string; // "botempresas" | "agendacultural" | "simulado"
  };
}
