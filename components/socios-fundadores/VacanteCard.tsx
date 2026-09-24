import React from "react";

interface VacanteCardProps {
  numeroSlot: number;
  categoriaLabel: string;
  whatsappNumber: string;
}

export function VacanteCard({
  numeroSlot,
  categoriaLabel,
  whatsappNumber,
}: VacanteCardProps) {
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");
  const mensaje = encodeURIComponent(
    `Hola César, me interesa el cupo de Socio Fundador en la categoría de ${categoriaLabel}.`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${mensaje}`;

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border-2 border-dashed border-purple-300/80 bg-gradient-to-b from-purple-50/50 to-white/70 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-purple-500 hover:bg-purple-50/70 hover:shadow-lg dark:border-purple-900/60 dark:from-purple-950/20 dark:to-zinc-900/80">
      <div>
        {/* Cabecera del Slot */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-2 border-dashed border-purple-300 bg-white/90 text-2xl font-black text-purple-400 shadow-inner dark:border-purple-800 dark:bg-zinc-800/90 dark:text-purple-300">
            ?
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            Cupo disponible #{numeroSlot}
          </span>
        </div>

        {/* Info */}
        <div className="mt-5 space-y-2">
          <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white">
            Slot disponible
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Esta posición aún no tiene dueño en <strong className="text-purple-700 dark:text-purple-400">{categoriaLabel}</strong>. El primer establecimiento que se integre quedará registrado como Socio Fundador de GuIAloja para siempre.
          </p>
        </div>
      </div>

      {/* CTA WhatsApp */}
      <div className="mt-6 pt-4 border-t border-purple-200/50 dark:border-purple-900/40">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sheen-hover flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-purple-1)] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[var(--color-purple-2)] hover:shadow-lg active:scale-[0.98]"
        >
          <span>💬 Quiero ser Socio Fundador</span>
        </a>
      </div>
    </div>
  );
}
