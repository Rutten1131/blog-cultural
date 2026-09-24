import React from "react";
import Image from "next/image";

export interface SocioData {
  id: string;
  nombre: string;
  logo: string;
  descripcion: string;
  web?: string;
  ubicacion?: {
    direccion: string;
    maps?: string;
  };
  fechaIngreso?: string;
  destacado?: boolean;
}

interface SocioCardProps {
  socio: SocioData;
  categoriaLabel: string;
}

export function SocioCard({ socio, categoriaLabel }: SocioCardProps) {
  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-white/60 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/90">
      <div>
        {/* Cabecera: Logo + Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
            {socio.logo ? (
              <Image
                src={socio.logo}
                alt={`Logo ${socio.nombre}`}
                width={80}
                height={80}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              <span className="font-display text-xl font-black text-purple-600">
                {socio.nombre.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 shadow-sm dark:bg-amber-950/60 dark:text-amber-300">
            ⭐ SOCIO FUNDADOR
          </span>
        </div>

        {/* Info */}
        <div className="mt-4 space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white">
            {socio.nombre}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            {categoriaLabel} • Loja, Ecuador
          </p>
          <p className="pt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {socio.descripcion}
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        {socio.web && (
          <a
            href={socio.web}
            target="_blank"
            rel="noopener noreferrer"
            className="sheen-hover inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-purple-700"
          >
            <span>Ver sitio web</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}

        {socio.ubicacion?.maps && (
          <a
            href={socio.ubicacion.maps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm transition-all hover:border-purple-300 hover:text-purple-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <span>📍 Ubicación</span>
          </a>
        )}
      </div>
    </div>
  );
}
