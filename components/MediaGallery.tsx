"use client";

import { useState } from "react";
import Image from "next/image";
import { parseVideoUrl } from "@/lib/mediaUtils";

interface MediaGalleryProps {
  multimedia?: string[]; // URLs de imágenes o videos
  imagenUrl?: string | null;
  videoUrl?: string | null;
  nombre: string;
}

export function MediaGallery({ multimedia = [], imagenUrl, videoUrl, nombre }: MediaGalleryProps) {
  // Construir lista combinada limpia
  const items: { type: "image" | "video"; url: string }[] = [];

  // Agregar imágenes
  if (multimedia.length > 0) {
    multimedia.forEach((url) => {
      if (url) items.push({ type: "image", url });
    });
  } else if (imagenUrl) {
    items.push({ type: "image", url: imagenUrl });
  }

  // Agregar video enlazado si existe
  if (videoUrl) {
    items.push({ type: "video", url: videoUrl });
  }

  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  const currentItem = items[activeIndex];
  const videoInfo = currentItem.type === "video" ? parseVideoUrl(currentItem.url) : null;

  const isVerticalVideo = videoInfo?.format === "vertical";

  return (
    <div className="space-y-4">
      {/* Visualizador Principal */}
      <div
        className={`relative w-full bg-black rounded-3xl overflow-hidden shadow-md flex items-center justify-center transition-all ${
          isVerticalVideo
            ? "h-[500px] sm:h-[580px] max-w-sm mx-auto"
            : "h-80 sm:h-[450px]"
        }`}
      >
        {currentItem.type === "image" ? (
          <Image
            src={currentItem.url}
            alt={`${nombre} - ${activeIndex + 1}`}
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
                  activeIndex === idx
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
