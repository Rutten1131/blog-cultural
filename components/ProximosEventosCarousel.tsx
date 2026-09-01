"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatFechaLojaCliente } from "@/lib/fechasCliente";

interface Evento {
  id: number;
  slug: string;
  nombre: string;
  fecha: Date | string;
  lugar: string;
  imagenUrl: string | null;
  categoria: { nombre: string; slug: string } | null;
  zona: { nombre: string } | null;
}

function formatFechaCorta(fecha: Date | string) {
  return formatFechaLojaCliente(fecha, "corto");
}

interface Props {
  eventos: Evento[];
}

export function ProximosEventosCarousel({ eventos }: Props) {
  const [stack, setStack] = useState(eventos);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [gone, setGone] = useState(false); // animación de salida
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const topEvent = stack[0];
  const shown = stack.slice(0, 4); // máximo 4 visibles en el stack

  // ── Iniciar drag ──
  const onDragStart = (clientX: number, clientY: number) => {
    startRef.current = { x: clientX, y: clientY };
    setDragging(true);
    setGone(false);
  };

  // ── Mover ──
  const onDragMove = (clientX: number, clientY: number) => {
    if (!startRef.current || !dragging) return;
    setDragX(clientX - startRef.current.x);
    setDragY((clientY - startRef.current.y) * 0.2);
  };

  // ── Función de salida fluida ──
  const dismissCard = (direction: "left" | "right") => {
    if (gone) return;
    setGone(true);
    setDragX(direction === "right" ? 500 : -500);
    setTimeout(() => {
      setStack((prev) => prev.slice(1));
      setDragX(0);
      setDragY(0);
      setGone(false);
    }, 280);
  };

  // ── Soltar ──
  const onDragEnd = () => {
    if (!dragging) return;
    setDragging(false);
    const threshold = 80;
    if (dragX > threshold) {
      dismissCard("right");
    } else if (dragX < -threshold) {
      dismissCard("left");
    } else {
      // Volver al centro con muelle suave
      setDragX(0);
      setDragY(0);
    }
  };

  // ── Mouse events ──
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart(e.clientX, e.clientY);
  };
  const onMouseMove = (e: React.MouseEvent) => onDragMove(e.clientX, e.clientY);
  const onMouseUp = () => onDragEnd();

  // ── Touch events ──
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    onDragStart(t.clientX, t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
  };
  const onTouchEnd = () => onDragEnd();

  // ── Reset (volver a ver todos) ──
  const reset = () => {
    setStack(eventos);
    setDragX(0);
    setDragY(0);
    setGone(false);
  };

  if (stack.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-[var(--color-muted)] text-sm font-semibold">¡Viste todos los eventos! 🎉</p>
        <button
          onClick={reset}
          className="rounded-full border-2 border-[var(--color-purple-1)] px-6 py-2 text-sm font-bold text-[var(--color-purple-1)] hover:bg-[var(--color-purple-1)] hover:text-white transition-all"
        >
          Ver de nuevo
        </button>
      </div>
    );
  }

  // Rotación según arrastre
  const rotation = dragX / 18;
  const swipeDirection = dragX > 60 ? "right" : dragX < -60 ? "left" : null;

  return (
    <div className="relative flex flex-col items-center gap-8">
      {/* ── Stack de cartas ── */}
      <div
        className="relative w-full max-w-sm mx-auto mt-6"
        style={{ height: 420 }}
      >
        {/* Cartas del fondo (de atrás hacia adelante) */}
        {shown.slice(1).reverse().map((ev, revIdx) => {
          const idx = shown.length - 1 - revIdx; // posición real en stack (1, 2, 3...)
          const scale = 1 - idx * 0.04;
          const translateY = idx * 16; // sobresale ligeramente por abajo
          const opacity = 1 - idx * 0.15;
          return (
            <div
              key={ev.id}
              className="absolute inset-0 rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: "bottom center",
                opacity,
                zIndex: shown.length - idx,
                transition: "transform 0.3s ease, opacity 0.3s ease",
                pointerEvents: "none",
              }}
            >
              <div className="relative h-52 w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950">
                {ev.imagenUrl && (
                  <Image
                    src={ev.imagenUrl}
                    alt={ev.nombre}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div className="flex h-full w-full items-center justify-center text-5xl opacity-20">🎭</div>
              </div>
              <div className="p-4">
                <p className="font-display text-base font-black uppercase leading-tight tracking-tight text-[var(--color-dark)] line-clamp-2">
                  {ev.nombre}
                </p>
              </div>
            </div>
          );
        })}

        {/* ── Carta TOP (draggable) ── */}
        {topEvent && (
          <div
            ref={cardRef}
            className="absolute inset-0 rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl cursor-grab active:cursor-grabbing"
            style={{
              transform: gone
                ? `translateX(${dragX > 0 ? 600 : -600}px) rotate(${dragX > 0 ? 30 : -30}deg)`
                : `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`,
              transition: gone || !dragging ? "transform 0.3s cubic-bezier(.25,.46,.45,.94)" : "none",
              zIndex: shown.length + 1,
              willChange: "transform",
              userSelect: "none",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Indicador de dirección */}
            {swipeDirection === "right" && (
              <div className="absolute inset-0 z-20 flex items-start justify-start p-5 pointer-events-none">
                <span className="rounded-xl border-4 border-emerald-400 text-emerald-500 text-xl font-black uppercase px-4 py-1 rotate-[-12deg] bg-white/80 backdrop-blur-sm shadow-lg">
                  ✓ Ver
                </span>
              </div>
            )}
            {swipeDirection === "left" && (
              <div className="absolute inset-0 z-20 flex items-start justify-end p-5 pointer-events-none">
                <span className="rounded-xl border-4 border-rose-400 text-rose-500 text-xl font-black uppercase px-4 py-1 rotate-[12deg] bg-white/80 backdrop-blur-sm shadow-lg">
                  Omitir
                </span>
              </div>
            )}

            {/* Imagen */}
            <div className="relative h-52 w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 overflow-hidden pointer-events-none">
              {topEvent.imagenUrl ? (
                <Image
                  src={topEvent.imagenUrl}
                  alt={topEvent.nombre}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                  onError={(e) => {
                    // Si la imagen falla en cliente, ocultar img para mostrar el gradiente de fondo
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              <div className="flex h-full w-full items-center justify-center text-6xl opacity-30">🎭</div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Fecha badge */}
              <div className="absolute bottom-3 left-3 rounded-xl bg-black/70 backdrop-blur-sm px-3 py-1.5 text-white text-xs font-bold pointer-events-none">
                📅 {formatFechaCorta(topEvent.fecha)}
              </div>
              {/* Categoría badge */}
              {topEvent.categoria && (
                <div className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-[var(--color-dark)] pointer-events-none">
                  {topEvent.categoria.nombre}
                </div>
              )}
            </div>

            {/* Texto */}
            <div className="p-5 pointer-events-none">
              <h3 className="font-display text-xl font-black uppercase leading-tight tracking-tight text-[var(--color-dark)] line-clamp-2">
                {topEvent.nombre}
              </h3>
              <p className="mt-2 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {topEvent.lugar}
              </p>
            </div>

            {/* Botón Ver evento (no arrastra) */}
            <div className="px-5 pb-5">
              <Link
                href={`/eventos/${topEvent.slug}`}
                className="block w-full rounded-xl bg-[var(--color-purple-1)] py-2.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                onClick={(e) => e.stopPropagation()}
              >
                Ver evento →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Botones de acción y contador ── */}
      <div className="flex items-center gap-6">
        {/* Omitir */}
        <button
          onClick={() => dismissCard("left")}
          aria-label="Omitir evento"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-rose-300 bg-white text-rose-400 shadow-md transition-all hover:bg-rose-50 hover:scale-110 hover:shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {/* Contador */}
        <span className="text-xs font-bold text-[var(--color-muted)]">
          {eventos.length - stack.length + 1}/{eventos.length}
        </span>

        {/* Ver evento (swipe derecha) */}
        <button
          onClick={() => dismissCard("right")}
          aria-label="Me interesa"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-300 bg-white text-emerald-500 shadow-md transition-all hover:bg-emerald-50 hover:scale-110 hover:shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5"/></svg>
        </button>
      </div>

      {/* ── Hint swipe (solo primera vez) ── */}
      <p className="text-center text-[11px] text-[var(--color-muted)]/60 -mt-4">
        Deslizá la carta o usá las flechas para explorar
      </p>
    </div>
  );
}
