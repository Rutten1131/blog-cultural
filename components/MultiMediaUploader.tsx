"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { parseVideoUrl } from "@/lib/mediaUtils";

interface MultiMediaUploaderProps {
  imagenes: string[];
  onImagenesChange: (urls: string[]) => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
}

export function MultiMediaUploader({
  imagenes,
  onImagenesChange,
  videoUrl,
  onVideoUrlChange,
}: MultiMediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          setError("Para videos, usá la sección de enlace (Facebook, Instagram, TikTok, YouTube). Solo se permite subir imágenes.");
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

  const parsedVideo = parseVideoUrl(videoUrl);

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
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow-md"
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

      {/* ── 2. ENLACE DE VIDEO (Sin subida directa para no saturar ancho de banda) ── */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <div>
            <label htmlFor="videoUrl" className="block text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Enlace de Video Promocional (Solo Link)
            </label>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Facebook, Instagram Reels, TikTok, YouTube o Vimeo.
            </p>
          </div>
        </div>

        <input
          id="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          placeholder="Ej: https://www.facebook.com/watch/?v=123... o https://tiktok.com/@user/video/..."
          className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />

        {videoUrl && (
          <div className="mt-2 text-xs">
            {parsedVideo ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ Video detectado ({parsedVideo.provider.toUpperCase()}) — Se mostrará incrustado en el evento
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                ⚠️ URL de video no reconocida. Se mostrará como botón de enlace directo al evento.
              </span>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
