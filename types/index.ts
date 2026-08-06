/**
 * Tipos centrales del proyecto Agenda Cultural Loja.
 *
 * Modelo de datos basado en CONTEXTO-TECNICO.md.
 * Sin autenticación ni BD todavía — solo definiciones TS.
 */

/* ─── Categorías (catálogo cerrado) ──────────────────────── */

export type CategoriaSlug =
  | "arte-y-exposiciones"
  | "teatro"
  | "musica"
  | "ferias"
  | "artes-vivas";

export interface Categoria {
  slug: CategoriaSlug;
  nombre: string;
}

export const CATEGORIAS: Categoria[] = [
  { slug: "arte-y-exposiciones", nombre: "Arte y exposiciones" },
  { slug: "teatro", nombre: "Teatro" },
  { slug: "musica", nombre: "Música" },
  { slug: "ferias", nombre: "Ferias" },
  { slug: "artes-vivas", nombre: "Artes Vivas" },
];

/* ─── Estado de publicación ──────────────────────────────── */

export type EstadoEvento = "pendiente" | "aprobado";

/* ─── Evento ─────────────────────────────────────────────── */

export interface Evento {
  id: string;
  nombre: string;
  slug: string;
  fecha: string; // ISO 8601
  lugar: string;
  zona: string; // parroquia — catálogo cerrado (por definir)
  categoria: CategoriaSlug;
  descripcion: string;
  imagen?: string; // URL de la imagen
  estado: EstadoEvento;
  nombreGestor: string; // texto libre, sin cuenta de usuario
  creadoEn: string; // ISO 8601
}
