"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CategoriaBadge } from "./EventoListCard";
import { formatFechaLojaCliente } from "@/lib/fechasCliente";

interface Evento {
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

function formatFecha(fecha: Date | string) {
  return formatFechaLojaCliente(fecha, "corto");
}

export function UltimosEventosSection({ eventos }: { eventos: Evento[] }) {
  const [busqueda, setBusqueda] = useState("");

  // Filtrado dinámico por buscador (nombre, lugar, descripción, categoría, zona)
  const eventosFiltrados = eventos.filter((ev) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      ev.nombre.toLowerCase().includes(q) ||
      ev.lugar.toLowerCase().includes(q) ||
      ev.descripcion.toLowerCase().includes(q) ||
      (ev.categoria && ev.categoria.nombre.toLowerCase().includes(q)) ||
      (ev.zona && ev.zona.nombre.toLowerCase().includes(q))
    );
  });

  return (
    <section className="w-full py-12 bg-white/50 backdrop-blur-sm border-y border-[var(--color-border)]" aria-label="Últimos eventos publicados">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Encabezado + Buscador */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-purple-1)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-purple-1)]" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Recientemente agregados
              </span>
            </div>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--color-dark)] sm:text-3xl">
              Últimos Eventos Artísticos Publicados en Loja
            </h2>
          </div>

          {/* Buscador */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar evento, lugar o artista..."
              className="w-full rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 pl-10 text-sm shadow-sm transition-all focus:border-[var(--color-purple-1)] focus:outline-none focus:ring-2 focus:ring-[var(--color-purple-1)]/20"
            />
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-dark)]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Indicador de deslizar */}
        {eventosFiltrados.length > 0 && !busqueda.trim() && (
          <div className="mb-3 flex items-center gap-1.5 text-[var(--color-muted)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
            </svg>
            <span className="text-[11px] font-semibold">Desliza hacia la derecha para ver más</span>
          </div>
        )}

        {/* Slide Horizontal de Eventos */}
        {eventosFiltrados.length > 0 ? (
          <div
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {eventosFiltrados.map((ev) => (
              <Link
                key={ev.id}
                href={`/eventos/${ev.slug}`}
                className="card-surface group flex-none w-[200px] sm:w-[220px] flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-white transition-all hover:-translate-y-1 hover:shadow-md"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Imagen mini */}
                <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-zinc-950">
                  {ev.imagenUrl ? (
                    <Image
                      src={ev.imagenUrl}
                      alt={ev.nombre}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div className="flex h-full w-full items-center justify-center text-3xl opacity-30">
                    🎭
                  </div>
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    📅 {formatFecha(ev.fecha)}
                  </span>
                </div>

                {/* Info corta */}
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <div className="mb-1 flex flex-wrap gap-1">
                      <CategoriaBadge categoria={ev.categoria} />
                    </div>
                    <h3 className="font-display text-xs font-bold uppercase leading-snug text-[var(--color-dark)] line-clamp-2 group-hover:text-[var(--color-purple-1)]">
                      {ev.nombre}
                    </h3>
                  </div>

                  {ev.zona && (
                    <span className="mt-2 text-[10px] font-medium text-[var(--color-muted)] truncate">
                      📍 {ev.zona.nombre}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              No se encontraron eventos con &quot;{busqueda}&quot;
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
