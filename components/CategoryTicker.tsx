/** CategoryTicker — barra marquee horizontal animada con las categorías */
const TICKER_ITEMS = [
  "Arte y Exposiciones",
  "Teatro",
  "Música",
  "Ferias y Festivales",
  "Artes Vivas",
  "Danza",
  "Cine",
  "Literatura",
  "Patrimonio",
  "Talleres Culturales",
];

export function CategoryTicker() {
  // Duplicamos para el loop infinito continuo
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

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
