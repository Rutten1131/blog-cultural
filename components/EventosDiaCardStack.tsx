"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatFechaLojaCliente } from "@/lib/fechasCliente";
import { EventoCalendario } from "./CalendarioCulturalHome";

interface Props {
  eventos: EventoCalendario[];
  onVolverCalendario: () => void;
  diaTexto: string;
}

export function EventosDiaCardStack({ eventos, onVolverCalendario, diaTexto }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [animating, setAnimating] = useState<"next" | "prev" | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const total = eventos.length;

  // Reiniciar índice cuando cambia la lista de eventos del día
  useEffect(() => {
    setCurrentIndex(0);
    setDragX(0);
    setDragY(0);
    setAnimating(null);
  }, [eventos]);

  if (total === 0) return null;

  // Obtener los siguientes 4 eventos en orden cíclico a partir de currentIndex
  const shown = Array.from({ length: Math.min(4, total) }, (_, i) => {
    const idx = (currentIndex + i) % total;
    return eventos[idx];
  });

  const topEvent = shown[0];

  // ── Drag Start ──
  const onDragStart = (clientX: number, clientY: number) => {
    if (animating) return;
    startRef.current = { x: clientX, y: clientY };
    setDragging(true);
  };

  // ── Drag Move ──
  const onDragMove = (clientX: number, clientY: number) => {
    if (!startRef.current || !dragging || animating) return;
    setDragX(clientX - startRef.current.x);
    setDragY((clientY - startRef.current.y) * 0.2);
  };

  // ── Siguiente (Adelante) ──
  const goNext = () => {
    if (animating || total <= 1) return;
    setAnimating("next");
    setDragX(500);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
      setDragX(0);
      setDragY(0);
      setAnimating(null);
    }, 280);
  };

  // ── Anterior (Atrás) ──
  const goPrev = () => {
    if (animating || total <= 1) return;
    setAnimating("prev");
    setDragX(-500);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + total) % total);
      setDragX(0);
      setDragY(0);
      setAnimating(null);
    }, 280);
  };

  // ── Drag End ──
  const onDragEnd = () => {
    if (!dragging || animating) return;
    setDragging(false);
    const threshold = 70;
    if (dragX > threshold) {
      goNext();
    } else if (dragX < -threshold) {
      goPrev();
    } else {
      setDragX(0);
      setDragY(0);
    }
  };

  const rotation = dragX / 18;
  const swipeDirection = dragX > 60 ? "right" : dragX < -60 ? "left" : null;

  return (
    <div className="flex flex-col items-center gap-5 pt-2 pb-6">
      {/* Barra superior con fecha y botón grande para volver al calendario */}
      <div className="w-full flex items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 block">
            Actividades del día
          </span>
          <h3 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
            {diaTexto}
          </h3>
        </div>

        <button
          type="button"
          onClick={onVolverCalendario}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 shadow-sm hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-95 cursor-pointer"
        >
          <span>← Volver al calendario</span>
        </button>
      </div>

      {total === 0 ? null : (
        <>
          {/* ── STACK DE CARTAS ── */}
          <div className="relative w-full max-w-[360px] sm:max-w-[400px] mx-auto h-[440px] sm:h-[460px]">
            {/* Cartas del fondo */}
            {shown.slice(1).reverse().map((ev, revIdx) => {
              const idx = shown.length - 1 - revIdx;
              const scale = 1 - idx * 0.04;
              const translateY = idx * 14;
              const opacity = 1 - idx * 0.16;

              return (
                <div
                  key={ev.id}
                  className="absolute inset-0 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
                  style={{
                    transform: `scale(${scale}) translateY(${translateY}px)`,
                    transformOrigin: "bottom center",
                    opacity,
                    zIndex: shown.length - idx,
                    transition: "transform 0.3s ease, opacity 0.3s ease",
                    pointerEvents: "none",
                  }}
                >
                  <div className="relative h-56 sm:h-60 w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950">
                    {ev.imagenUrl && (
                      <Image
                        src={ev.imagenUrl}
                        alt={ev.nombre}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                    <div className="flex h-full w-full items-center justify-center text-5xl opacity-20">
                      🎭
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-display text-base font-black uppercase leading-tight tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {ev.nombre}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* ── CARTA TOP DRAGGABLE ── */}
            {topEvent && (
              <div
                ref={cardRef}
                className="absolute inset-0 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl cursor-grab active:cursor-grabbing"
                style={{
                  transform: animating === "next"
                    ? "translateX(600px) rotate(25deg)"
                    : animating === "prev"
                    ? "translateX(-600px) rotate(-25deg)"
                    : `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`,
                  transition: animating || !dragging ? "transform 0.28s cubic-bezier(.25,.46,.45,.94)" : "none",
                  zIndex: shown.length + 1,
                  willChange: "transform",
                  userSelect: "none",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onDragStart(e.clientX, e.clientY);
                }}
                onMouseMove={(e) => onDragMove(e.clientX, e.clientY)}
                onMouseUp={onDragEnd}
                onMouseLeave={onDragEnd}
                onTouchStart={(e) => onDragStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => onDragMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={onDragEnd}
              >
                {/* Indicadores visuales swipe */}
                {swipeDirection === "right" && (
                  <div className="absolute inset-0 z-20 flex items-start justify-start p-5 pointer-events-none">
                    <span className="rounded-xl border-4 border-purple-400 text-purple-600 text-xl font-black uppercase px-4 py-1 rotate-[-12deg] bg-white/90 backdrop-blur-sm shadow-lg">
                      Siguiente →
                    </span>
                  </div>
                )}
                {swipeDirection === "left" && (
                  <div className="absolute inset-0 z-20 flex items-start justify-end p-5 pointer-events-none">
                    <span className="rounded-xl border-4 border-zinc-400 text-zinc-600 text-xl font-black uppercase px-4 py-1 rotate-[12deg] bg-white/90 backdrop-blur-sm shadow-lg">
                      ← Anterior
                    </span>
                  </div>
                )}

                {/* Imagen del evento */}
                <div className="relative h-56 sm:h-60 w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 overflow-hidden pointer-events-none">
                  {topEvent.imagenUrl ? (
                    <Image
                      src={topEvent.imagenUrl}
                      alt={topEvent.nombre}
                      fill
                      className="object-cover"
                      unoptimized
                      priority
                    />
                  ) : null}
                  <div className="flex h-full w-full items-center justify-center text-6xl opacity-30">
                    🎭
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Badge fecha */}
                  <div className="absolute bottom-3 left-3 rounded-xl bg-black/75 backdrop-blur-sm px-3 py-1.5 text-white text-xs font-bold pointer-events-none">
                    📅 {formatFechaLojaCliente(topEvent.fecha, "corto")}
                  </div>

                  {/* Badge categoría */}
                  {topEvent.categoria && (
                    <div className="absolute top-3 right-3 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-zinc-900 pointer-events-none shadow-sm">
                      {topEvent.categoria.nombre}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 pointer-events-none">
                  <h3 className="font-display text-lg sm:text-xl font-black uppercase leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 line-clamp-2">
                    {topEvent.nombre}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="truncate">{topEvent.lugar}</span>
                  </p>
                </div>

                {/* Botón Ver Evento */}
                <div className="px-4 pb-4">
                  <Link
                    href={`/eventos/${topEvent.slug}`}
                    className="block w-full rounded-xl bg-purple-600 py-2.5 text-center text-xs sm:text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 active:scale-[0.98]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver evento →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── BOTONES DE ACCIÓN (Si hay más de 1 evento) ── */}
          {eventos.length > 1 && (
            <div className="flex items-center gap-5 -mt-2 z-10">
              {/* Botón Anterior */}
              <button
                onClick={goPrev}
                aria-label="Evento anterior"
                title="Anterior"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-md transition-all hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 hover:scale-110 active:scale-95 cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-700/50">
                {currentIndex + 1} / {total}
              </span>

              {/* Botón Siguiente */}
              <button
                onClick={goNext}
                aria-label="Siguiente evento"
                title="Siguiente"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-md transition-all hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 hover:scale-110 active:scale-95 cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}

          {eventos.length > 1 && (
            <p className="text-center text-[11px] text-zinc-400 -mt-1">
              Deslizá la carta o usá las flechas para explorar
            </p>
          )}

          {/* Botón grande para volver al calendario */}
          <div className="w-full pt-3">
            <button
              type="button"
              onClick={onVolverCalendario}
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-3 text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Volver a la vista mensual del calendario</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
