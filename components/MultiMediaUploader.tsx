"use client";

import { useState, useRef } from "react";
import { parseVideoUrl, VideoEmbedInfo } from "@/lib/mediaUtils";

interface MultiMediaUploaderProps {
  imagenes: string[];
  onImagenesChange: (urls: string[]) => void;
  videoUrls: string[];
  onVideoUrlsChange: (urls: string[]) => void;
}

export function MultiMediaUploader({
  imagenes,
  onImagenesChange,
  videoUrls,
  onVideoUrlsChange,
}: MultiMediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isResolvingVideo, setIsResolvingVideo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nuevoVideoInput, setNuevoVideoInput] = useState("");
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subir archivos de imágenes a Bunny CDN
  const handleUploadFiles = async (files: FileList | File[]) => {
    setError(null);
    setIsUploading(true);

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          setError("Para videos o redes sociales, usá la sección de enlaces (Facebook, Instagram, TikTok, YouTube). Solo se permite subir imágenes.");
          continue;
        }

        if (file.size > 20 * 1024 * 1024) {
          setError(`El archivo ${file.name} supera los 20MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        onImagenesChange([...imagenes, ...uploadedUrls]);
      }
    } catch (err: unknown) {
      console.error(err);
      setError("No se pudieron subir algunas imágenes.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImagen = (index: number) => {
    const next = [...imagenes];
    next.splice(index, 1);
    onImagenesChange(next);
  };

  // Manejador para agregar nuevo enlace de video/red social con botón "+" y resolución automática
  const handleAddVideo = async () => {
    const trimmed = nuevoVideoInput.trim();
    if (!trimmed) return;

    setError(null);
    setIsResolvingVideo(true);

    let finalUrlToAdd = trimmed;
    let detectedThumbnail: string | null = null;

    try {
      // Llamar al endpoint resolver para convertir enlaces /share/r/ a /reel/ y obtener og:image
      const res = await fetch("/api/media/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.canonicalUrl) {
          finalUrlToAdd = data.canonicalUrl;
        }
        if (data.thumbnailUrl) {
          detectedThumbnail = data.thumbnailUrl;
        }
      }
    } catch {
      // Si falla la llamada de resolución, usar la URL original como respaldo
      finalUrlToAdd = trimmed;
    } finally {
      setIsResolvingVideo(false);
    }

    // Evitar duplicados
    if (videoUrls.includes(finalUrlToAdd)) {
      setError("Este enlace ya ha sido agregado.");
      return;
    }

    if (detectedThumbnail) {
      setVideoThumbnails((prev) => ({
        ...prev,
        [finalUrlToAdd]: detectedThumbnail!,
      }));
    }

    onVideoUrlsChange([...videoUrls, finalUrlToAdd]);
    setNuevoVideoInput("");
  };

  const removeVideo = (index: number) => {
    const next = [...videoUrls];
    const removedUrl = next[index];
    next.splice(index, 1);
    onVideoUrlsChange(next);

    if (removedUrl && videoThumbnails[removedUrl]) {
      const nextThumbs = { ...videoThumbnails };
      delete nextThumbs[removedUrl];
      setVideoThumbnails(nextThumbs);
    }
  };

  // Ayudante visual para cada plataforma
  const renderPlatformBadge = (info: VideoEmbedInfo | null) => {
    if (!info) {
      return (
        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Enlace Web
        </span>
      );
    }

    switch (info.provider) {
      case "facebook":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <span>📘</span> Facebook {info.format === "vertical" ? "Reel" : "Video"}
          </span>
        );
      case "instagram":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-0.5 text-[10px] font-bold text-pink-700 dark:bg-pink-950 dark:text-pink-300">
            <span>📸</span> Instagram Reel
          </span>
        );
      case "tiktok":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2.5 py-0.5 text-[10px] font-bold dark:bg-zinc-800">
            <span>🎵</span> TikTok
          </span>
        );
      case "youtube":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
            <span>▶️</span> {info.title || "YouTube"}
          </span>
        );
      case "vimeo":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
            <span>📹</span> Vimeo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <span>🌐</span> {info.title || "Página Web"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. CARRUSEL DE IMÁGENES (Subir múltiples) ── */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Galería de Afiches e Imágenes del Evento{" "}
          <span className="text-xs font-normal text-zinc-400">(Podés seleccionar varias)</span>
        </label>

        {/* Galería de vistas previas subidas */}
        {imagenes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {imagenes.map((url, idx) => (
              <div
                key={idx}
                className="relative group h-28 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Afiche ${idx + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImagen(idx)}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow-md cursor-pointer"
                  title="Eliminar imagen"
                >
                  ✕
                </button>
                <span className="absolute bottom-1 left-1.5 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Zona Drop / Selector */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) handleUploadFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
              : "border-zinc-300 bg-white hover:border-purple-400 dark:border-zinc-700 dark:bg-zinc-900"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files?.length && handleUploadFiles(e.target.files)}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center py-2">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-purple-600 border-t-transparent mb-2" />
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                Subiendo u optimizando a CDN WebP...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-3xl">🖼️</span>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Hacé clic o arrastrá para agregar imágenes/afiches
              </p>
              <span className="rounded-full bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                Formatos JPG, PNG, WebP (máx. 20MB cada una)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. ENLACES DE VIDEO Y REDES SOCIALES (MÚLTIPLES CON BOTÓN "+") ── */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <div>
              <label htmlFor="videoInput" className="block text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Enlaces de Video / Redes Sociales (Facebook, Instagram, TikTok, YouTube)
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Pega el link (Reel, Share link o video) y presiona <strong>+</strong> para agregarlo.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            {videoUrls.length} {videoUrls.length === 1 ? "video" : "videos"}
          </span>
        </div>

        {/* Input con botón "+" */}
        <div className="flex items-center gap-2">
          <input
            id="videoInput"
            type="url"
            value={nuevoVideoInput}
            onChange={(e) => setNuevoVideoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddVideo();
              }
            }}
            placeholder="Ej: https://www.facebook.com/share/r/... o https://facebook.com/reel/... o https://tiktok.com/@..."
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={handleAddVideo}
            disabled={isResolvingVideo || !nuevoVideoInput.trim()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            title="Agregar enlace de video"
          >
            {isResolvingVideo ? (
              <span className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Adaptando...</span>
              </span>
            ) : (
              <>
                <span className="text-base leading-none font-black">+</span>
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>

        {/* Previsualización en vivo del enlace que se está tipeando */}
        {nuevoVideoInput.trim() && (() => {
          const parsed = parseVideoUrl(nuevoVideoInput);
          return (
            <div className="rounded-xl border border-purple-200/80 bg-purple-50/50 p-2.5 dark:border-purple-900/50 dark:bg-purple-950/20 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {renderPlatformBadge(parsed)}
                <span className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate">
                  {nuevoVideoInput}
                </span>
              </div>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold shrink-0">
                Presiona + para resolver y confirmar
              </span>
            </div>
          );
        })()}

        {/* Lista de videos agregados con su miniatura/reproductor embebido */}
        {videoUrls.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Videos y Redes Agregadas (Vista Previa):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videoUrls.map((url, idx) => {
                const info = parseVideoUrl(url);
                const customThumb = videoThumbnails[url] || info?.thumbnailUrl;

                return (
                  <div
                    key={idx}
                    className="relative flex flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden"
                  >
                    {/* Encabezado de la tarjeta con badge y botón de eliminar */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-400">#{idx + 1}</span>
                        {renderPlatformBadge(info)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(idx)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 hover:bg-red-600 text-red-600 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                        title="Quitar este video"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Miniatura / Contenedor visual */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-950 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                      {customThumb ? (
                        <div className="relative h-full w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={customThumb}
                            alt="Miniatura de video"
                            className="h-full w-full object-cover"
                          />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/35 hover:bg-black/20 flex items-center justify-center transition-colors group"
                            title="Ver en la plataforma"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                              ▶
                            </span>
                          </a>
                        </div>
                      ) : info?.provider === "facebook" ? (
                        <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 to-zinc-900 text-white p-4 text-center">
                          <span className="text-3xl mb-1">📘</span>
                          <p className="text-xs font-bold">Facebook Reel / Video</p>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold hover:bg-blue-700 transition-colors"
                          >
                            Abrir en Facebook ↗
                          </a>
                        </div>
                      ) : info ? (
                        <iframe
                          src={info.embedUrl}
                          title={`Previsualización ${idx + 1}`}
                          className="h-full w-full border-0 pointer-events-none scale-95"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-white/70 p-2 text-center">
                          <span className="text-2xl">🌐</span>
                          <span className="text-[11px]">Enlace externo</span>
                        </div>
                      )}
                      <div className="absolute bottom-1.5 right-1.5 rounded-full bg-black/75 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                        {info?.format === "vertical" ? "9:16 Reel" : "Video"}
                      </div>
                    </div>

                    {/* URL canonicalizada */}
                    <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono" title={url}>
                      {url}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
