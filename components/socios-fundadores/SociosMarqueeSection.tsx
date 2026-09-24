"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CategoriaConfig } from "@/components/socios-fundadores/CategoryTabs";

interface SociosMarqueeSectionProps {
  categorias: CategoriaConfig[];
}

export function SociosMarqueeSection({ categorias }: SociosMarqueeSectionProps) {
  // Extraemos todos los socios que tengan nombre o logo
  const todosLosSocios = categorias.flatMap((cat) =>
    cat.socios.map((s) => ({
      ...s,
      categoriaLabel: cat.label,
      emoji: cat.emoji,
    }))
  );

  // Conteo de cupos disponibles por categoría para el resumen
  const cuposInfo = categorias.map((cat) => ({
    label: cat.label,
    emoji: cat.emoji,
    disponibles: Math.max(0, cat.maxSocios - cat.socios.length),
  }));

  const haySocios = todosLosSocios.length > 0;

  // Si hay socios, generamos la lista repetida para efecto infinito fluido
  const marqueeItems = haySocios
    ? [...todosLosSocios, ...todosLosSocios, ...todosLosSocios, ...todosLosSocios]
    : [];

  return (
    <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/60 p-6 sm:p-10 shadow-sm backdrop-blur-md dark:border-purple-900/40 dark:from-purple-950/20 dark:via-zinc-900 dark:to-zinc-900 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-950/60 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
            <span>🏛️ GuIAloja — Infraestructura Turística</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white">
            Empresas que forman parte de GuIAloja
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
            Hoteles, restaurantes y marcas pioneras integradas a la inteligencia turística de Loja como Socios Fundadores.
          </p>
        </div>

        <Link
          href="/socios-fundadores"
          className="sheen-hover shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-purple-1)] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[var(--color-purple-2)] hover:shadow-lg transition-all active:scale-95"
        >
          <span>Ver Socios Fundadores →</span>
        </Link>
      </div>

      {/* Marquee Slider Infinito si hay socios confirmados */}
      {haySocios ? (
        <div className="relative w-full overflow-hidden rounded-2xl py-3 border border-purple-100 dark:border-purple-900/40 bg-white/60 dark:bg-zinc-950/40">
          {/* Difuminados en los bordes para transición infinita suave */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-12 sm:w-20 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-12 sm:w-20 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent" />

          <div className="animate-patrocinadores-marquee flex items-center gap-4 hover:[animation-play-state:paused]">
            {marqueeItems.map((socio, idx) => (
              <div
                key={`${socio.id}-${idx}`}
                className="group shrink-0 flex items-center gap-3.5 w-64 sm:w-72 h-24 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all duration-300"
              >
                <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-1 flex items-center justify-center">
                  {socio.logo ? (
                    <Image
                      src={socio.logo}
                      alt={socio.nombre}
                      width={56}
                      height={56}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <span className="font-display text-lg font-black text-purple-600">
                      {socio.nombre.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      ⭐ Socio Fundador
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {socio.nombre}
                  </h4>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium truncate">
                    {socio.emoji} {socio.categoriaLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Grid de disponibilidad de cupos por categoría */}
      <div className="pt-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          Disponibilidad de cupos exclusivos (máximo 3 por sector):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {cuposInfo.map((c, i) => (
            <Link
              key={i}
              href={`/socios-fundadores?categoria=${categorias[i]?.id}`}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-800/80 hover:border-purple-400 hover:bg-white transition-all text-center group"
            >
              <span className="text-xl mb-1 group-hover:scale-110 transition-transform">
                {c.emoji}
              </span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                {c.label}
              </span>
              <span
                className={`mt-1.5 inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  c.disponibles === 0
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                }`}
              >
                {c.disponibles === 0
                  ? "LLENO"
                  : `${c.disponibles} ${c.disponibles === 1 ? "cupo" : "cupos"}`}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
