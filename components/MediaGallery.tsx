"use client";

import { useState } from "react";
import Image from "next/image";
import { parseVideoUrl } from "@/lib/mediaUtils";

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

  // Agregar video enlazado si existe
  if (videoUrl && typeof videoUrl === "string" && videoUrl.trim().length > 0) {
    items.push({ type: "video", url: videoUrl.trim() });
  }

  const [activeIndex, setActiveIndex] = useState(0);

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
        className={`relative w-full bg-zinc-950 rounded-3xl overflow-hidden shadow-md flex items-center justify-center transition-all ${
          isVerticalVideo
            ? "h-[500px] sm:h-[580px] max-w-sm mx-auto"
            : "h-80 sm:h-[450px]"
        }`}
      >
        {currentItem.type === "image" ? (
          <Image
            src={currentItem.url}
            alt={`${nombre} - ${safeIndex + 1}`}
            fill
            className="object-contain"
            priority
            unoptimized
          />
        ) : videoInfo ? (
          <iframe
            src={videoInfo.embedUrl}
            title={`Video de ${nombre}`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
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
              onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-110"
            >
              ❮
            </button>
            <button
              onClick={() => setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-110"
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
                onClick={() => setActiveIndex(idx)}
                className={`relative h-20 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  safeIndex === idx
                    ? "border-purple-600 ring-2 ring-purple-400/50 scale-105"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {isVideo ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 text-white p-1 text-center">
                    <span className="text-xl">▶️</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 truncate w-full">
                      Video
                    </span>
                  </div>
                ) : (
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
    </div>
  );
}
