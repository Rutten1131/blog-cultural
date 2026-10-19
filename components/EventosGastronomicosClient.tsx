"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatFechaLojaCliente, formatRangoFechasLojaCliente } from "@/lib/fechasCliente";

export type ChipFiltro = "todos" | "ferias" | "festivales" | "rutas";

interface EventoGastronomico {
  id: number;
  nombre: string;
  slug: string;
  fecha: string | Date;
  fechaFin: string | Date | null;
  lugar: string;
  descripcion: string;
  imagenUrl: string | null;
  nombreGestor: string;
  zona: { nombre: string } | null;
}

interface Props {
  eventos: EventoGastronomico[];
}

export function EventosGastronomicosClient({ eventos }: Props) {
  const [filtroActivo, setFiltroActivo] = useState<ChipFiltro>("todos");

  // Clasificar eventos por palabras clave en los 4 chips acordados (evita fragmentación Thin Content)
  const eventosFiltrados = useMemo(() => {
    if (filtroActivo === "todos") return eventos;

    return eventos.filter((ev) => {
      const texto = `${ev.nombre} ${ev.descripcion} ${ev.lugar}`.toLowerCase();
      if (filtroActivo === "ferias") {
        return texto.includes("feria") || texto.includes("mercado") || texto.includes("expo");
      }
      if (filtroActivo === "festivales") {
        return texto.includes("festival") || texto.includes("concurso") || texto.includes("degustacion") || texto.includes("degustación") || texto.includes("cata");
      }
      if (filtroActivo === "rutas") {
        return texto.includes("ruta") || texto.includes("cafe") || texto.includes("café") || texto.includes("cacao") || texto.includes("origen");
      }
      return true;
    });
  }, [eventos, filtroActivo]);

  return (
    <div>
      {/* ── Chips de Filtro Interactivos (4 Chips certificados de intención) ── */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        {[
          { id: "todos", label: "Todos los eventos", emoji: "🍽️" },
          { id: "ferias", label: "Ferias", emoji: "🎪" },
          { id: "festivales", label: "Festivales", emoji: "✨" },
          { id: "rutas", label: "Rutas del Café", emoji: "☕" },
        ].map((chip) => {
          const isActive = filtroActivo === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFiltroActivo(chip.id as ChipFiltro)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
                isActive
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/30 scale-105"
                  : "bg-white text-zinc-700 hover:bg-orange-50 hover:text-orange-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
              {chip.id === "todos" && (
                <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                  {eventos.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Grid de Eventos ── */}
      {eventosFiltrados.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-12 text-center">
          <span className="text-4xl">🍲</span>
          <h3 className="mt-3 font-display text-lg font-bold text-zinc-900 dark:text-white">
            Próximamente más eventos en esta categoría
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Estamos verificando convocatorias y ferias gastronómicas en Loja y la provincia. ¿Organizas una feria o festival?
          </p>
          <div className="mt-6">
            <Link
              href="/publicar"
              className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-105"
            >
              + Publicar evento gastronómico
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {eventosFiltrados.map((evento) => {
            const fechaStr = evento.fechaFin
              ? formatRangoFechasLojaCliente(evento.fecha, evento.fechaFin)
              : formatFechaLojaCliente(evento.fecha, "largo");

            return (
              <article
                key={evento.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-300 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* Imagen */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {evento.imagenUrl ? (
                    <Image
                      src={evento.imagenUrl}
                      alt={evento.nombre}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400/20 to-amber-500/20 text-4xl">
                      🍲
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      {evento.zona?.nombre ?? "Loja"}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                    {fechaStr}
                  </p>
                  <h2 className="mt-1.5 font-display text-lg font-black leading-tight text-zinc-900 group-hover:text-orange-600 transition-colors dark:text-white">
                    <Link href={`/eventos/${evento.slug}`} className="focus:outline-none">
                      {evento.nombre}
                    </Link>
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {evento.descripcion}
                  </p>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span>📍</span> {evento.lugar}
                    </span>
                    <Link
                      href={`/eventos/${evento.slug}`}
                      className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      Ver detalle →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
