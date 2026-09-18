"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface PatrocinadorData {
  nombre: string;
  logoUrl?: string;
}

interface EventPatrocinadoresSectionProps {
  patrocinadores: any;
}

export function EventPatrocinadoresSection({ patrocinadores }: EventPatrocinadoresSectionProps) {
  const { t } = useLanguage();

  if (!patrocinadores) return null;

  let items: PatrocinadorData[] = [];
  if (Array.isArray(patrocinadores)) {
    items = patrocinadores;
  } else if (typeof patrocinadores === "string") {
    try {
      const parsed = JSON.parse(patrocinadores);
      if (Array.isArray(parsed)) items = parsed;
    } catch {
      items = [];
    }
  }

  // Filtrar items que tengan al menos nombre o logo
  const validItems = items.filter(
    (item) => item && (item.nombre?.trim() || item.logoUrl?.trim())
  );

  if (validItems.length === 0) return null;

  const count = validItems.length;

  // Si son 3 o más (o queremos efecto infinito fluido), duplicamos para el loop infinito
  // Si son 1 o 2, los mostramos centrados y estéticos sin forzar movimiento innecesario,
  // pero con el mismo diseño premium.
  const isMarquee = count >= 3;

  // Duplicar para el scroll infinito si hay 3 o más
  const displayItems = isMarquee
    ? [...validItems, ...validItems, ...validItems, ...validItems]
    : validItems;

  return (
    <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      {/* Título renovado solicitado por el usuario */}
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-xl">🤝</span>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {t("evento.patrocinadores", "Este evento ha sido posible gracias a:")}
        </h2>
      </div>

      {isMarquee ? (
        /* Slider infinito continuo para 3 o más marcas */
        <div className="relative w-full overflow-hidden rounded-2xl py-2">
          {/* Difuminados sutiles en los bordes para sensación infinita cinematográfica */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-12 sm:w-20 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-12 sm:w-20 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent" />

          <div className="animate-patrocinadores-marquee flex items-center gap-4 hover:[animation-play-state:paused]">
            {displayItems.map((p, idx) => (
              <div
                key={idx}
                className="group shrink-0 flex flex-col items-center justify-center w-40 sm:w-48 h-28 sm:h-32 p-3.5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-900 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all duration-300 text-center"
              >
                {p.logoUrl ? (
                  <div className="relative h-14 sm:h-16 w-full flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.logoUrl}
                      alt={p.nombre || "Logo patrocinador"}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-lg">
                    🏢
                  </div>
                )}
                {p.nombre && (
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-1 leading-tight mt-1.5 transition-colors">
                    {p.nombre}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Adaptación elegante para 1 o 2 marcas (centradas, limpias y proporcionadas) */
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {validItems.map((p, idx) => (
            <div
              key={idx}
              className="group flex flex-col items-center justify-center w-44 sm:w-52 h-28 sm:h-32 p-4 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-900 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all duration-300 text-center"
            >
              {p.logoUrl ? (
                <div className="relative h-14 sm:h-16 w-full flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logoUrl}
                    alt={p.nombre || "Logo patrocinador"}
                    className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-lg">
                  🏢
                </div>
              )}
              {p.nombre && (
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-1 leading-tight mt-1.5 transition-colors">
                  {p.nombre}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

