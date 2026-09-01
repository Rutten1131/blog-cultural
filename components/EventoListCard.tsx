"use client";

import Link from "next/link";
import Image from "next/image";
import { formatFechaLojaCliente } from "@/lib/fechasCliente";

interface EventoCardProps {
  id: number;
  nombre: string;
  slug: string;
  fecha: Date | string;
  lugar: string;
  descripcion: string;
  imagenUrl: string | null;
  categoria: { nombre: string; slug: string } | null;
  zona: { nombre: string } | null;
}

/** Formatea fecha en zona Loja (corto: "vie, 14 ago") */
function formatFecha(fecha: Date | string) {
  return formatFechaLojaCliente(fecha, "corto");
}

/** Colores por categoría */
const CAT_COLORS: Record<string, string> = {
  "arte-y-exposiciones": "bg-violet-100 text-violet-700 border-violet-200",
  teatro:               "bg-pink-100 text-pink-700 border-pink-200",
  musica:               "bg-blue-100 text-blue-700 border-blue-200",
  ferias:               "bg-amber-100 text-amber-700 border-amber-200",
  "artes-vivas":        "bg-emerald-100 text-emerald-700 border-emerald-200",
};

/** Badge de categoría */
export function CategoriaBadge({ categoria }: { categoria: { nombre: string; slug: string } | null }) {
  if (!categoria) return null;
  const color = CAT_COLORS[categoria.slug] ?? "bg-purple-100 text-purple-700 border-purple-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${color}`}>
      {categoria.nombre}
    </span>
  );
}

/** ── EventoCardFeatured — card grande para la sección hero y destacados ── */
export function EventoCardFeatured({ evento }: { evento: EventoCardProps }) {
  const fecha = formatFecha(evento.fecha);
  const descripcionCorta = evento.descripcion.length > 140
    ? `${evento.descripcion.slice(0, 137)}...`
    : evento.descripcion;

  return (
    <Link
      href={`/eventos/${evento.slug}`}
      className="card-surface sheen-hover group relative flex flex-col overflow-hidden rounded-2xl"
    >
      {/* Imagen */}
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-zinc-950">
        {evento.imagenUrl ? (
          <Image
            src={evento.imagenUrl}
            alt={evento.nombre}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            unoptimized
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-5xl opacity-30">🎭</span>
        </div>
        {/* Gradient overlay bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* Fecha flotante */}
        <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          📅 {fecha}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex flex-col gap-2.5 p-5">
        <div className="flex flex-wrap gap-1.5">
          <CategoriaBadge categoria={evento.categoria} />
          {evento.zona && (
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted)]">
              📍 {evento.zona.nombre}
            </span>
          )}
        </div>

        <h3 className="font-display text-xl font-black uppercase leading-tight tracking-tight text-[var(--color-dark)] transition-colors group-hover:text-[var(--color-purple-1)]">
          {evento.nombre}
        </h3>

        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          {descripcionCorta}
        </p>

        {/* CTA */}
        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-purple-2)] transition-all duration-200 group-hover:gap-3">
          Ver evento
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
          </svg>
        </span>
      </div>
    </Link>
  );
}

/** ── EventoCardHorizontal — card compacta horizontal para listas de sección ── */
export function EventoCardHorizontal({ evento }: { evento: EventoCardProps }) {
  const fecha = formatFecha(evento.fecha);

  return (
    <Link
      href={`/eventos/${evento.slug}`}
      className="card-surface group flex items-start gap-4 overflow-hidden rounded-xl p-3 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-purple-900 via-indigo-900 to-zinc-950">
        {evento.imagenUrl ? (
          <Image
            src={evento.imagenUrl}
            alt={evento.nombre}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            unoptimized
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <div className="flex h-full w-full items-center justify-center text-xl opacity-30">
          🎭
        </div>
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h4 className="font-display text-base font-black uppercase leading-tight tracking-tight text-[var(--color-dark)] transition-colors group-hover:text-[var(--color-purple-1)] truncate">
          {evento.nombre}
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
          <span>📅 {fecha}</span>
          {evento.zona && <span>📍 {evento.zona.nombre}</span>}
        </div>
        {evento.categoria && (
          <CategoriaBadge categoria={evento.categoria} />
        )}
      </div>

      {/* Arrow */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-1 shrink-0 text-[var(--color-border)] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-purple-2)]"
        aria-hidden="true"
      >
        <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
      </svg>
    </Link>
  );
}

/** ── EventoListCard — card original mejorada ── */
export function EventoListCard({ evento }: { evento: EventoCardProps }) {
  return <EventoCardFeatured evento={evento} />;
}

/** ── EstadoVacioEvento ── */
export function EstadoVacioEvento({ mensaje }: { mensaje: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white/60">
      <div className="mb-4 text-5xl opacity-30">📭</div>
      <p className="text-base font-semibold text-[var(--color-muted)]">{mensaje}</p>
    </div>
  );
}
