"use client";

export function BotonVerCalendarioHero({ className = "" }: { className?: string }) {
  const abrirCalendario = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("abrir-calendario"));
    }
  };

  return (
    <button
      type="button"
      onClick={abrirCalendario}
      className={`btn-calendar-vibrant group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[var(--color-purple-1)] via-indigo-600 to-[var(--color-coral)] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-[0_8px_25px_rgba(109,40,217,0.4)] transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer ${className}`}
      aria-label="Ver el Calendario de eventos de Loja"
    >
      {/* Icono de calendario con sutil rotación */}
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-white transition-transform group-hover:rotate-12">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2.4"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </span>

      <span className="font-display tracking-wider text-[13px] sm:text-sm">
        Ver el Calendario
      </span>

      {/* Flechita con desplazamiento suave */}
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold transition-transform group-hover:translate-x-1">
        →
      </span>

      {/* Punto con animación de ping en la esquina */}
      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-coral)] opacity-80" />
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[var(--color-coral)] border-2 border-white shadow-sm" />
      </span>
    </button>
  );
}
