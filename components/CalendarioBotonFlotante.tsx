"use client";

import { useState, useEffect } from "react";
import { CalendarioCulturalHome, EventoCalendario } from "./CalendarioCulturalHome";

interface Props {
  eventos: EventoCalendario[];
}

export function CalendarioBotonFlotante({ eventos }: Props) {
  const [abierto, setAbierto] = useState(false);

  // Bloquear scroll de la página cuando el popup está abierto
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && abierto) {
        setAbierto(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [abierto]);

  return (
    <>
      {/* ── BOTÓN FLOTANTE ANCLADO A LA DERECHA ── */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="group relative flex items-center gap-1.5 bg-gradient-to-b from-[var(--color-purple-1)] to-[var(--color-purple-2)] text-white px-2 py-3 rounded-l-xl shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_10px_25px_rgba(124,58,237,0.5)] transition-all duration-300 hover:pr-3 border-y border-l border-white/25 active:scale-95 cursor-pointer"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          aria-label="Abrir calendario interactivo de eventos"
        >
          <span className="flex items-center gap-1.5 rotate-180">
            {/* Ícono de Calendario */}
            <svg
              className="w-3.5 h-3.5 transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>

            {/* Texto vertical */}
            <span className="font-display font-bold tracking-wider text-[11px] uppercase">
              Calendario
            </span>
          </span>

          {/* Indicador de pulso llamativo */}
          <span className="absolute -left-1 -top-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-coral)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-coral)]"></span>
          </span>
        </button>
      </div>

      {/* ── MODAL / DRAWER POPUP ── */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop con clic para cerrar */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={() => setAbierto(false)}
            aria-hidden="true"
          />

          {/* Contenedor del Drawer / Panel lateral */}
          <aside
            className="relative w-full max-w-2xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden border-l border-stone-200"
            role="dialog"
            aria-modal="true"
            aria-label="Calendario de Eventos"
          >
            {/* Header del Panel */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display font-black text-lg text-stone-900 leading-tight">
                    Calendario de Eventos
                  </h2>
                  <p className="text-xs text-stone-500 font-medium">
                    Toca un día para ver los eventos programados en Loja
                  </p>
                </div>
              </div>

              {/* Botón cerrar */}
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="w-9 h-9 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                aria-label="Cerrar calendario"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/40">
              <CalendarioCulturalHome eventos={eventos} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
