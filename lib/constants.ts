/**
 * Constantes de la taxonomía — Agenda Cultural Loja.
 * Catálogos cerrados: solo editables desde admin, nunca por el usuario final.
 *
 * Fuente: División parroquial oficial del cantón Loja (Municipio de Loja).
 */

import { CATEGORIAS } from "@/types";
export { CATEGORIAS };

/* ─── Zonas / Parroquias oficiales del cantón Loja ───────── */

export interface ZonaDefinicion {
  nombre: string;
  tipo: "URBANA" | "RURAL";
}

/** 6 parroquias urbanas + 13 rurales = 19 total */
export const ZONAS: ZonaDefinicion[] = [
  // Parroquias urbanas (6)
  { nombre: "El Sagrario", tipo: "URBANA" },
  { nombre: "Sucre", tipo: "URBANA" },
  { nombre: "El Valle", tipo: "URBANA" },
  { nombre: "San Sebastián", tipo: "URBANA" },
  { nombre: "Punzara", tipo: "URBANA" },
  { nombre: "Carigán", tipo: "URBANA" },
  // Parroquias rurales (13)
  { nombre: "Chantaco", tipo: "RURAL" },
  { nombre: "Chuquiribamba", tipo: "RURAL" },
  { nombre: "El Cisne", tipo: "RURAL" },
  { nombre: "Gualel", tipo: "RURAL" },
  { nombre: "Jimbilla", tipo: "RURAL" },
  { nombre: "Malacatos", tipo: "RURAL" },
  { nombre: "Quinara", tipo: "RURAL" },
  { nombre: "San Lucas", tipo: "RURAL" },
  { nombre: "San Pedro de Vilcabamba", tipo: "RURAL" },
  { nombre: "Santiago", tipo: "RURAL" },
  { nombre: "Taquil", tipo: "RURAL" },
  { nombre: "Vilcabamba", tipo: "RURAL" },
  { nombre: "Yangana", tipo: "RURAL" },
];
