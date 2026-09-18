"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

/** CategoryTicker — barra marquee horizontal animada con las categorías */
const TICKER_KEYS = [
  "ticker.arte",
  "ticker.teatro",
  "ticker.musica",
  "ticker.ferias",
  "ticker.artes_vivas",
  "ticker.danza",
  "ticker.cine",
  "ticker.literatura",
  "ticker.patrimonio",
  "ticker.talleres",
] as const;

export function CategoryTicker() {
  const { t } = useLanguage();
  const tickerItems = TICKER_KEYS.map((k) => t(k));
  // Duplicamos para el loop infinito continuo
  const items = [...tickerItems, ...tickerItems];

  return (
    <div
      className="relative overflow-hidden bg-[var(--color-dark)] py-3.5"
      aria-label="Categorías culturales"
    >
      {/* Fades laterales */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--color-dark)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--color-dark)] to-transparent" />

      <div className="ticker-track">
        {items.map((item, i) => (
          <span
            key={i}
            className="mx-6 inline-flex shrink-0 items-center gap-3 text-sm font-bold uppercase tracking-widest text-white/80"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: i % 3 === 0
                  ? "var(--color-purple-3)"
                  : i % 3 === 1
                  ? "var(--color-coral)"
                  : "var(--color-blue)",
              }}
              aria-hidden="true"
            />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
