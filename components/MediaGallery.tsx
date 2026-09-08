"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { parseVideoUrl, extractVideoUrls } from "@/lib/mediaUtils";

interface MediaGalleryProps {
  multimedia?: string[] | string | null | any;
  imagenUrl?: string | null;
  videoUrl?: string | null;
  nombre: string;
}

export function MediaGallery({ multimedia = [], imagenUrl, videoUrl, nombre }: MediaGalleryProps) {
  // Construir lista combinada limpia y tolerante a fallos
  const items: { type: "image" | "video"; url: string }[] = [];

  // 1. Extraer imágenes de multimedia (soporta Array o JSON string)
  let rawList: string[] = [];
  if (Array.isArray(multimedia)) {
    rawList = multimedia;
  } else if (typeof multimedia === "string") {
    const trimmed = multimedia.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else if (typeof parsed === "string") {
          rawList = [parsed];
        }
      } catch {
        if (trimmed.startsWith("http")) rawList = [trimmed];
      }
    } else if (trimmed.startsWith("http")) {
      rawList = [trimmed];
    }
  }

  // Filtrar y agregar imágenes válidas evitando duplicados
  const addedUrls = new Set<string>();
  rawList.forEach((url) => {
    if (url && typeof url === "string" && url.trim().length > 0 && !addedUrls.has(url.trim())) {
      items.push({ type: "image", url: url.trim() });
      addedUrls.add(url.trim());
    }
  });

  // Si imagenUrl no está en la lista, agregarla
  if (imagenUrl && typeof imagenUrl === "string" && imagenUrl.trim().length > 0 && !addedUrls.has(imagenUrl.trim())) {
    items.push({ type: "image", url: imagenUrl.trim() });
    addedUrls.add(imagenUrl.trim());
  }

  // Agregar videos enlazados (soporta string único, JSON array o múltiples URLs)
  const videoList = extractVideoUrls(videoUrl);
  videoList.forEach((vUrl) => {
    if (vUrl && !addedUrls.has(vUrl)) {
      items.push({ type: "video", url: vUrl });
      addedUrls.add(vUrl);
    }
  });

  const [activeIndex, setActiveIndex] = useState(0);

  // Estados para el Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const total = items.length;

  // Funciones de navegación
  const nextItem = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
    setZoomLevel(1);
  }, [total]);

  const prevItem = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
    setZoomLevel(1);
  }, [total]);

  const openLightbox = (idx?: number) => {
    if (typeof idx === "number") setActiveIndex(idx);
    setZoomLevel(1);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoomLevel(1);
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
  };

  // Atajos de teclado (Escape, Flechas) y bloqueo de scroll al abrir Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextItem();
      if (e.key === "ArrowLeft") prevItem();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleResetZoom();
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxOpen, nextItem, prevItem]);

  // Si no hay ninguna imagen ni video, mostrar banner de respaldo cultural estilizado
  if (items.length === 0) {
    return (
      <div className="relative w-full h-56 sm:h-72 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-zinc-950 flex flex-col items-center justify-center p-6 text-center text-white shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.25),transparent_50%)]" />
        <span className="text-5xl sm:text-6xl mb-3 drop-shadow-md animate-pulse">🎭</span>
        <p className="font-display font-black uppercase tracking-wider text-sm sm:text-base text-purple-200">
          Agenda Cultural Loja
        </p>
        <p className="text-xs text-zinc-400 mt-1 max-w-md">
          {nombre}
        </p>
      </div>
    );
  }

  const safeIndex = activeIndex >= items.length ? 0 : activeIndex;
  const currentItem = items[safeIndex];
  const videoInfo = currentItem.type === "video" ? parseVideoUrl(currentItem.url) : null;
  const isVerticalVideo = videoInfo?.format === "vertical";

  return (
    <div className="space-y-4">
      {/* Visualizador Principal */}
      <div
        className={`group relative w-full bg-zinc-950 rounded-3xl overflow-hidden shadow-md flex items-center justify-center transition-all ${
          isVerticalVideo
            ? "h-[500px] sm:h-[580px] max-w-sm mx-auto"
            : "h-80 sm:h-[450px]"
        }`}
      >
        {currentItem.type === "image" ? (
          <div
            onClick={() => openLightbox(safeIndex)}
            className="relative w-full h-full cursor-zoom-in flex items-center justify-center"
            title="Haz clic para ampliar en pantalla completa"
          >
            <Image
              src={currentItem.url}
              alt={`${nombre} - ${safeIndex + 1}`}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-[1.015]"
              priority
              unoptimized
            />
            {/* Badge de sugerencia para abrir */}
            <div className="absolute bottom-3 right-3 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold text-white opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 pointer-events-none shadow-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <span>Ver ampliado</span>
            </div>
          </div>
        ) : videoInfo ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <iframe
              src={videoInfo.embedUrl}
              title={`Video de ${nombre}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            {/* Botón flotante para abrir el video en Lightbox modal */}
            <button
              onClick={() => openLightbox(safeIndex)}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/75 hover:bg-purple-600 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              title="Expandir en pantalla completa"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <span>Maximizar</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/70 p-6 text-center">
            <span className="text-4xl">🎬</span>
            <p className="text-sm font-semibold">Video enlazado desde {currentItem.url}</p>
            <a
              href={currentItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition-colors"
            >
              Ver video en la plataforma original ↗
            </a>
          </div>
        )}

        {/* Flechas de navegación en el carrusel */}
        {items.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevItem();
              }}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-purple-600 hover:scale-110 active:scale-95 cursor-pointer"
            >
              ❮
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextItem();
              }}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-purple-600 hover:scale-110 active:scale-95 cursor-pointer"
            >
              ❯
            </button>
          </>
        )}
      </div>

      {/* Tiras de Miniaturas (Thumbnails) */}
      {items.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {items.map((item, idx) => {
            const isVideo = item.type === "video";
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveIndex(idx);
                  setZoomLevel(1);
                }}
                className={`relative h-20 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  safeIndex === idx
                    ? "border-purple-600 ring-2 ring-purple-400/50 scale-105"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {isVideo ? (() => {
                  const vInfo = parseVideoUrl(item.url);
                  return vInfo?.thumbnailUrl ? (
                    <div className="relative h-full w-full bg-zinc-950">
                      <Image
                        src={vInfo.thumbnailUrl}
                        alt={`Miniatura video ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-lg drop-shadow">▶️</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 text-white p-1 text-center">
                      <span className="text-xl">
                        {vInfo?.provider === "facebook"
                          ? "📘"
                          : vInfo?.provider === "instagram"
                          ? "📸"
                          : vInfo?.provider === "tiktok"
                          ? "🎵"
                          : "▶️"}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 truncate w-full">
                        {vInfo?.provider || "Video"}
                      </span>
                    </div>
                  );
                })() : (
                  <Image
                    src={item.url}
                    alt={`Miniatura ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── LIGHTBOX MODAL EN PANTALLA COMPLETA ── */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fadeIn select-none"
          onClick={closeLightbox}
        >
          {/* Barra superior de controles */}
          <div
            className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 z-20 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Título e indicador de número */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black tracking-wider text-purple-300">
                {safeIndex + 1} / {total}
              </span>
              <p className="text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-md text-zinc-300">
                {nombre}
              </p>
            </div>

            {/* Controles de Zoom y Cerrar */}
            <div className="flex items-center gap-2">
              {currentItem.type === "image" && (
                <div className="flex items-center bg-zinc-900/90 border border-white/10 rounded-full px-1.5 py-1 gap-1 shadow-md">
                  {/* Zoom Out */}
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    aria-label="Alejar"
                    title="Alejar zoom (-)"
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </button>

                  {/* Nivel de zoom / Reset */}
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Restablecer zoom (100%)"
                    className="px-2 text-xs font-mono font-bold text-purple-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>

                  {/* Zoom In */}
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3.5}
                    aria-label="Acercar"
                    title="Acercar zoom (+)"
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Botón Cerrar (X) */}
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Cerrar lightbox"
                title="Cerrar (Esc)"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-rose-600 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Área Central de Visualización (con Pan y Zoom) */}
          <div
            className="relative flex-1 w-full flex items-center justify-center overflow-auto p-2 sm:p-6"
            onClick={(e) => {
              // Si hace clic en el fondo oscuro, cerrar
              if (e.target === e.currentTarget) closeLightbox();
            }}
          >
            {currentItem.type === "image" ? (
              <div
                className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${zoomLevel})`,
                  cursor: zoomLevel > 1 ? "grab" : "zoom-in",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Clic en la imagen conmuta zoom 1x <-> 2x
                  setZoomLevel((prev) => (prev > 1 ? 1 : 2));
                }}
              >
                <img
                  src={currentItem.url}
                  alt={`${nombre} - ${safeIndex + 1}`}
                  className="max-h-[82vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl pointer-events-auto"
                />
              </div>
            ) : videoInfo ? (
              <div
                className={`relative w-full shadow-2xl rounded-2xl overflow-hidden ${
                  isVerticalVideo ? "max-w-md h-[80vh]" : "max-w-5xl h-[75vh]"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <iframe
                  src={videoInfo.embedUrl}
                  title={`Video de ${nombre}`}
                  className="w-full h-full border-0 rounded-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-3 text-white p-8 bg-zinc-900 rounded-2xl shadow-xl text-center max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-5xl">🎬</span>
                <p className="text-sm font-semibold">Video enlazado</p>
                <a
                  href={currentItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition-colors"
                >
                  Abrir video original ↗
                </a>
              </div>
            )}

            {/* Flechas de navegación en Lightbox */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevItem();
                  }}
                  aria-label="Anterior elemento"
                  title="Anterior (←)"
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/70 hover:bg-purple-600 text-white text-xl sm:text-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl border border-white/10"
                >
                  ❮
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextItem();
                  }}
                  aria-label="Siguiente elemento"
                  title="Siguiente (→)"
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/70 hover:bg-purple-600 text-white text-xl sm:text-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl border border-white/10"
                >
                  ❯
                </button>
              </>
            )}
          </div>

          {/* Barra inferior con ayuda / miniaturas en Lightbox */}
          <div
            className="w-full py-3 px-4 flex flex-col items-center gap-2 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tira inferior de miniaturas en el lightbox si hay varias */}
            {total > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 scrollbar-none">
                {items.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveIndex(idx);
                      setZoomLevel(1);
                    }}
                    className={`relative h-12 w-14 sm:h-14 sm:w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      safeIndex === idx
                        ? "border-purple-500 scale-105 shadow-lg ring-2 ring-purple-400/60"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {item.type === "video" ? (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs">
                        ▶️
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`Miniatura ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            <p className="text-[11px] text-zinc-400 font-medium">
              {currentItem.type === "image"
                ? "Toca la imagen o usa +/- para hacer zoom • Teclas de flechas para explorar • Esc para salir"
                : "Teclas de flechas para explorar • Esc para salir"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

