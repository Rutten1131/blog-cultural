"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CategoriaBadge } from "./EventoListCard";

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
  return new Date(fecha).toLocaleDateString("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function UltimosEventosSection({ eventos }: { eventos: Evento[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);

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

  // Mostramos 10 por defecto, o todos si hace click en "Ver más" (o si está buscando)
  const limite = busqueda.trim() || mostrarTodos ? eventosFiltrados.length : 10;
  const eventosVisibles = eventosFiltrados.slice(0, limite);
  const hayMas = eventosFiltrados.length > 10 && !mostrarTodos && !busqueda.trim();

  return (
    <section className="w-full py-12 bg-white/50 backdrop-blur-sm border-y border-[var(--color-border)]" aria-label="Últimos eventos publicados">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Encabezado + Buscador */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--color-dark)] sm:text-4xl">
              Últimos Eventos Publicados
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

        {/* Lista/Grid de Eventos */}
        {eventosVisibles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {eventosVisibles.map((ev) => (
              <Link
                key={ev.id}
                href={`/eventos/${ev.slug}`}
                className="card-surface group flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-white transition-all hover:-translate-y-1 hover:shadow-md"
              >
                {/* Imagen mini */}
                <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-purple-100 to-violet-200">
                  {ev.imagenUrl ? (
                    <Image
                      src={ev.imagenUrl}
                      alt={ev.nombre}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl opacity-20">
                      🎭
                    </div>
                  )}
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
                    <h3 className="font-display text-sm font-bold uppercase leading-snug text-[var(--color-dark)] line-clamp-2 group-hover:text-[var(--color-purple-1)]">
                      {ev.nombre}
                    </h3>
                  </div>

                  {ev.zona && (
                    <span className="mt-2 text-[11px] font-medium text-[var(--color-muted)] truncate">
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

        {/* Botón Ver Más */}
        {hayMas && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setMostrarTodos(true)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-purple-1)] bg-white px-6 py-2.5 text-sm font-bold text-[var(--color-purple-1)] shadow-sm transition-all hover:bg-[var(--color-purple-1)] hover:text-white"
            >
              Ver más eventos ({eventosFiltrados.length - 10} más)
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
