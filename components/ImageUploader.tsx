"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // Validar tipo de archivo
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Solo se permiten imágenes o videos.");
      return;
    }

    // Validar tamaño máximo (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError("El archivo supera el tamaño máximo permitido (20MB).");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Error al subir la imagen");
      }

      onChange(data.url);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo subir la imagen."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Campo hidden para que la URL se envíe en el formulario tradicional */}
      <input type="hidden" name="imagenUrl" value={value} />

      {/* Zona de Drop / Selección */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
            : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100 dark:border-t-transparent mb-2" />
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Optimizando a WebP y subiendo a CDN...
            </p>
          </div>
        ) : value ? (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Vista previa"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Archivo subido y optimizado en CDN
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-full px-4">
              {value}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 underline"
            >
              Quitar / Cambiar imagen
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-2xl">
              📁
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Arrastrá y soltá una imagen o video acá
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                o hacé clic para seleccionar desde tu dispositivo
              </p>
            </div>
            <span className="mt-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Optimización automática a WebP (máx. 20MB)
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
