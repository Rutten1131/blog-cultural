"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadDirectToBunny } from "@/lib/uploadDirect";

export interface PatrocinadorItem {
  nombre: string;
  logoUrl: string;
}

interface PatrocinadoresUploaderProps {
  patrocinadores: PatrocinadorItem[];
  onChange: (items: PatrocinadorItem[]) => void;
}

export function PatrocinadoresUploader({
  patrocinadores,
  onChange,
}: PatrocinadoresUploaderProps) {
  const [nombreInput, setNombreInput] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subir logo directo a Bunny.net (con fallback a /api/upload)
  const handleUploadLogoFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      setErrorMsg("El archivo debe ser una imagen (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("El logo no debe superar los 20MB.");
      return;
    }

    setErrorMsg(null);
    setIsUploadingLogo(true);
    setUploadProgress(0);

    try {
      let url: string | null = null;
      try {
        url = await uploadDirectToBunny(file, (percent) => {
          setUploadProgress(percent);
        });
      } catch (directErr) {
        console.warn("Subida directa falló, intentando /api/upload:", directErr);
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          url = data.url;
        }
      }

      if (url) {
        setLogoPreview(url);
      } else {
        setErrorMsg("No se pudo procesar la subida del logo.");
      }
    } catch (err) {
      console.error("Error subiendo logo:", err);
      setErrorMsg("Error al subir el logo. Inténtalo nuevamente.");
    } finally {
      setIsUploadingLogo(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAgregarPatrocinador = () => {
    const trimmedNombre = nombreInput.trim();
    if (!trimmedNombre && !logoPreview) {
      setErrorMsg("Por favor ingresa el nombre del patrocinador o sube su logo.");
      return;
    }

    const nuevo: PatrocinadorItem = {
      nombre: trimmedNombre || "Patrocinador",
      logoUrl: logoPreview || "",
    };

    onChange([...patrocinadores, nuevo]);
    setNombreInput("");
    setLogoPreview("");
    setErrorMsg(null);
  };

  const handleEliminar = (index: number) => {
    const copia = [...patrocinadores];
    copia.splice(index, 1);
    onChange(copia);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-6 shadow-sm">
      {/* Encabezado con badge opcional */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-base text-amber-600 dark:text-amber-400">
            🤝
          </span>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Auspiciantes y Patrocinadores
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Opcional
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              ¿Tu evento es posible gracias a marcas o auspiciantes? Agrégalos aquí con su nombre y logo.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Formulario para ingresar nuevo patrocinador */}
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-950/40 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Nombre del patrocinador */}
          <div className="sm:col-span-7">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nombre del patrocinador
            </label>
            <input
              type="text"
              value={nombreInput}
              onChange={(e) => setNombreInput(e.target.value)}
              placeholder="Ej: Banco de Loja, Cooperativa Padre Julián, etc."
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:ring-purple-900"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAgregarPatrocinador();
                }
              }}
            />
          </div>

          {/* Subir Logo */}
          <div className="sm:col-span-5 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUploadLogoFile(e.target.files)}
            />

            {/* Thumbnail preview si ya se subió logo */}
            {logoPreview ? (
              <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setLogoPreview("")}
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] text-white hover:bg-rose-700"
                  title="Quitar logo"
                >
                  ✕
                </button>
              </div>
            ) : null}

            <button
              type="button"
              disabled={isUploadingLogo}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <span>{isUploadingLogo ? "⏳" : "🖼️"}</span>
              <span>
                {isUploadingLogo
                  ? `Subiendo ${uploadProgress !== null ? `${uploadProgress}%` : "..."}`
                  : logoPreview
                  ? "Cambiar Logo"
                  : "Subir Logo"}
              </span>
            </button>

            <button
              type="button"
              disabled={isUploadingLogo || (!nombreInput.trim() && !logoPreview)}
              onClick={handleAgregarPatrocinador}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <span>+</span>
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de patrocinadores ya agregados */}
      {patrocinadores.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Patrocinadores Agregados ({patrocinadores.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {patrocinadores.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 sm:px-3 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-1 flex items-center justify-center">
                    {item.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.logoUrl}
                        alt={item.nombre}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400 font-bold">🏢</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.nombre}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {item.logoUrl ? "Logo cargado" : "Sin logo gráfico"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleEliminar(idx)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                  title="Eliminar patrocinador"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
