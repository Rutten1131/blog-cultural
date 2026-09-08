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

  // Escuchar evento personalizado 'abrir-calendario'
  useEffect(() => {
    const handleAbrir = () => setAbierto(true);
    window.addEventListener("abrir-calendario", handleAbrir);
    return () => window.removeEventListener("abrir-calendario", handleAbrir);
  }, []);

  // Detectar cuándo mostrar el botón flotante lateral
  // Desktop: aparece cuando el calendario del hero sale de vista (IntersectionObserver)
  // Móvil: aparece al scrollear más de 350px (scroll position)
  const [mostrarFlotante, setMostrarFlotante] = useState(false);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 640;
    const heroCalendar = document.getElementById("hero-calendario-desktop");

    // Desktop: usar IntersectionObserver sobre el calendario del hero
    if (isDesktop && heroCalendar) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setMostrarFlotante(!entry.isIntersecting);
        },
        { threshold: 0 }
      );
      observer.observe(heroCalendar);
      return () => observer.disconnect();
    }

    // Móvil: fallback con scroll position
    const handleScroll = () => {
      setMostrarFlotante(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ── BOTÓN FLOTANTE ANCLADO A LA DERECHA (aparece al scrollear fuera del Hero, tanto en desktop como móvil) ── */}
      <div
        className={`fixed right-0 top-[35%] sm:top-1/2 -translate-y-1/2 z-40 flex items-center transition-all duration-300 ${
          mostrarFlotante
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="group relative flex items-center gap-2 bg-gradient-to-b from-[var(--color-purple-1)] via-indigo-600 to-[var(--color-coral)] text-white px-2.5 sm:px-3 py-3.5 sm:py-4 rounded-l-2xl shadow-[0_8px_25px_rgba(124,58,237,0.45)] hover:shadow-[0_12px_32px_rgba(236,72,153,0.6)] transition-all duration-300 hover:pr-4 border-y border-l border-white/30 active:scale-95 cursor-pointer"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          aria-label="Abrir calendario interactivo de eventos"
        >
          <span className="flex items-center gap-2 rotate-180">
            {/* Ícono de Calendario con rotación al hover */}
            <svg
              className="w-4 h-4 transition-transform group-hover:scale-125"
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

            {/* Texto vertical ampliado: Ver Calendario */}
            <span className="font-display font-black tracking-wider text-xs sm:text-[13px] uppercase">
              Ver Calendario
            </span>
          </span>

          {/* Indicador de pulso llamativo */}
          <span className="absolute -left-1.5 -top-1.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-coral)] opacity-85"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[var(--color-coral)] border border-white"></span>
          </span>
        </button>
      </div>

      {/* ── MODAL CENTRADO (en ordenador está centrado en pantalla, en móvil como drawer de pantalla completa) ── */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 sm:py-6">
          {/* Backdrop con clic para cerrar */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={() => setAbierto(false)}
            aria-hidden="true"
          />

          {/* Contenedor del Modal Centrado */}
          <aside
            className="relative w-full max-w-2xl bg-white h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden border border-stone-200 animate-fadeIn"
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
