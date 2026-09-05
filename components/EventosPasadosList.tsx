"use client";

import { useState } from "react";
import { EventoListCard } from "./EventoListCard";

interface Evento {
  id: number;
  nombre: string;
  slug: string;
  fecha: Date | string;
  fechaFin?: Date | string | null;
  lugar: string;
  descripcion: string;
  imagenUrl: string | null;
  categoria: { nombre: string; slug: string } | null;
  zona: { nombre: string } | null;
}

interface EventosPasadosListProps {
  eventos: Evento[];
  titulo: string;
  subtitulo?: string;
  initialCount?: number;
  step?: number;
}

export function EventosPasadosList({
  eventos,
  titulo,
  subtitulo,
  initialCount = 6,
  step = 6,
}: EventosPasadosListProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [busqueda, setBusqueda] = useState("");

  if (!eventos || eventos.length === 0) return null;

  // Filtrado rápido opcional por búsqueda dentro de los eventos anteriores
  const eventosFiltrados = eventos.filter((ev) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      ev.nombre.toLowerCase().includes(q) ||
      ev.lugar.toLowerCase().includes(q) ||
      ev.descripcion.toLowerCase().includes(q) ||
      (ev.zona && ev.zona.nombre.toLowerCase().includes(q))
    );
  });

  const visibles = eventosFiltrados.slice(0, visibleCount);
  const hayMas = visibleCount < eventosFiltrados.length;
  const restantes = eventosFiltrados.length - visibleCount;

  return (
    <section className="pt-10 border-t border-[var(--color-border)]">
      {/* Encabezado + Filtro de búsqueda */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Archivo Cultural
            </span>
            <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
              {eventos.length} archivo{eventos.length !== 1 ? "s" : ""}
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--color-dark)]">
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1">
              {subtitulo}
            </p>
          )}
        </div>

        {/* Buscador ligero para eventos pasados */}
        {eventos.length > 5 && (
          <div className="relative w-full sm:w-64 shrink-0">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setVisibleCount(initialCount); // reset al filtrar
              }}
              placeholder="Buscar en el archivo..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-white/80 px-3 py-1.5 pl-8 text-xs shadow-sm transition-all focus:border-[var(--color-purple-1)] focus:outline-none focus:ring-2 focus:ring-[var(--color-purple-1)]/20"
            />
            <svg
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setVisibleCount(initialCount);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-dark)]"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid de eventos pasados con visualización limitada */}
      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center text-xs text-[var(--color-muted)]">
          No se encontraron eventos anteriores con ese término.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90 hover:opacity-100 transition-opacity">
          {visibles.map((evento) => (
            <EventoListCard key={evento.id} evento={evento} />
          ))}
        </div>
      )}

      {/* Botón Ver Más / Mostrar Menos */}
      {eventosFiltrados.length > initialCount && (
        <div className="mt-8 flex items-center justify-center gap-3">
          {hayMas ? (
            <button
              onClick={() => setVisibleCount((prev) => prev + step)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white dark:bg-zinc-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-dark)] shadow-sm hover:border-[var(--color-purple-1)] hover:text-[var(--color-purple-1)] hover:shadow-md transition-all active:scale-95"
            >
              <span>Ver más ({restantes > step ? `+${step}` : `+${restantes}`})</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setVisibleCount(initialCount)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/60 dark:bg-zinc-900/60 px-5 py-2 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-dark)] transition-all"
            >
              <span>Mostrar menos ↑</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
