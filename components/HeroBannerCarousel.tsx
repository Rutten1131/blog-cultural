"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface BannerHeroItem {
  id: number;
  titulo: string;
  subtitulo?: string | null;
  link: string;
  botonTexto?: string;
  imagenDesktop: string;
  imagenMobile?: string | null;
}

interface Props {
  banners: BannerHeroItem[];
  intervalMs?: number;
}

export function HeroBannerCarousel({ banners, intervalMs = 6000 }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = banners.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Autoplay con temporizador, se pausa con hover o touch
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide, total, isPaused, intervalMs]);

  // Touch handlers para swipe en móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Umbral de 50px para deslizar
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }

    setTouchStart(null);
    setIsPaused(false);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-black select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Banners destacados"
    >
      {/* Contenedor de slides con proporciones responsivas */}
      {/* En móvil: 100% fullscreen (100dvh / 100vh), en desktop: altura panorámica estilo Hyundai (480px a 560px) */}
      <div className="relative w-full h-[100dvh] sm:h-[480px] md:h-[520px] lg:h-[560px]">
        {banners.map((banner, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={banner.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
            >
              {/* Imagen con <picture> para responder a Desktop / Mobile como en Hyundai */}
              <picture className="w-full h-full block">
                {banner.imagenMobile && (
                  <source
                    media="(max-width: 640px)"
                    srcSet={banner.imagenMobile}
                  />
                )}
                <img
                  src={banner.imagenDesktop}
                  alt={banner.titulo}
                  className="w-full h-full object-cover object-center"
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </picture>

              {/* Degradados cinemáticos overlays para garantizar contraste impecable */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 md:bg-gradient-to-r md:from-black/85 md:via-black/40 md:to-transparent" />

              {/* Capa de Contenido flotante (Overlay / card-img-overlay) */}
              <div className="absolute inset-0 z-20 flex flex-col justify-end md:justify-center p-6 pb-20 sm:pb-10 sm:p-10 md:p-14 lg:p-20 max-w-7xl mx-auto w-full">
                <div
                  className={`max-w-xl flex flex-col items-start gap-2.5 sm:gap-3.5 transition-all duration-700 delay-150 transform ${
                    isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                  }`}
                >
                  {/* Badge de Evento Destacado */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-coral)] animate-pulse" />
                    Destacado
                  </span>

                  {/* Título Principal */}
                  <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                    {banner.titulo}
                  </h2>

                  {/* Subtítulo o detalle */}
                  {banner.subtitulo && (
                    <p className="text-sm sm:text-base md:text-lg text-white/90 font-medium line-clamp-2 drop-shadow">
                      {banner.subtitulo}
                    </p>
                  )}

                  {/* Botón CTA: Siempre 'Ver el calendario' que abre el popup */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("abrir-calendario"));
                        }
                      }}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[var(--color-purple-1)] via-indigo-600 to-[var(--color-coral)] hover:opacity-95 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-[0_8px_25px_rgba(109,40,217,0.55)] border border-white/30 cursor-pointer"
                    >
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
                      <span>Ver el calendario</span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14" />
                        <path d="m13 5 7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Flechas de Navegación laterales estilo Hyundai (chevron limpio, altura completa/flotante con chevron elegante) ── */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Imagen anterior"
            className="carousel-control-prev absolute left-0 top-0 bottom-0 z-30 w-14 sm:w-20 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300 bg-gradient-to-r from-black/40 via-transparent to-transparent opacity-70 hover:opacity-100 group/arrow"
          >
            <span className="p-2 sm:p-3 rounded-md transition-transform duration-200 group-hover/arrow:-translate-x-1">
              <svg
                className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </span>
            <span className="sr-only">Imagen anterior</span>
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Imagen siguiente"
            className="carousel-control-next absolute right-0 top-0 bottom-0 z-30 w-14 sm:w-20 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300 bg-gradient-to-l from-black/40 via-transparent to-transparent opacity-70 hover:opacity-100 group/arrow"
          >
            <span className="p-2 sm:p-3 rounded-md transition-transform duration-200 group-hover/arrow:translate-x-1">
              <svg
                className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
            <span className="sr-only">Imagen siguiente</span>
          </button>
        </>
      )}

      {/* ── Indicadores tipo línea / barra (como carousel-indicators de Hyundai) ── */}
      {total > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {banners.map((_, i) => {
            const active = i === currentIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => goToSlide(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`transition-all duration-300 rounded-full h-1.5 sm:h-2 ${
                  active
                    ? "w-8 sm:w-10 bg-[var(--color-purple-1)] shadow-[0_0_8px_rgba(109,40,217,0.8)]"
                    : "w-2.5 sm:w-3 bg-white/40 hover:bg-white/80"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
