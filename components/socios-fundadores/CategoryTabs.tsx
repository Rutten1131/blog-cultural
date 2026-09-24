"use client";

import React, { useState, useEffect } from "react";
import { SocioCard, SocioData } from "./SocioCard";
import { VacanteCard } from "./VacanteCard";

export interface CategoriaConfig {
  id: string;
  label: string;
  emoji: string;
  descripcion: string;
  maxSocios: number;
  socios: SocioData[];
}

interface CategoryTabsProps {
  categorias: CategoriaConfig[];
  contacto: {
    whatsapp: string;
    email: string;
    mensaje_whatsapp_base?: string;
  };
  initialCategoriaId?: string;
}

export function CategoryTabs({
  categorias,
  contacto,
  initialCategoriaId,
}: CategoryTabsProps) {
  // Determinamos categoría por defecto:
  // 1. Si viene por prop/URL
  // 2. O la primera categoría con al menos un socio
  // 3. O la primera de la lista ("hoteles")
  const defaultId =
    initialCategoriaId && categorias.some((c) => c.id === initialCategoriaId)
      ? initialCategoriaId
      : categorias.find((c) => c.socios.length > 0)?.id || categorias[0]?.id || "hoteles";

  const [activeTab, setActiveTab] = useState<string>(defaultId);

  // Sincronizar URL query param sin recarga
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catQuery = params.get("categoria");
    if (catQuery && categorias.some((c) => c.id === catQuery)) {
      setActiveTab(catQuery);
    }
  }, [categorias]);

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("categoria", id);
    window.history.replaceState({}, "", url.toString());
  };

  const categoriaActiva =
    categorias.find((c) => c.id === activeTab) || categorias[0];

  // Ordenar socios según especificación:
  // 1. Destacados
  // 2. Fecha ingreso
  const sociosOrdenados = [...(categoriaActiva?.socios || [])].sort((a, b) => {
    if (a.destacado && !b.destacado) return -1;
    if (!a.destacado && b.destacado) return 1;
    if (a.fechaIngreso && b.fechaIngreso) {
      return new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime();
    }
    return 0;
  });

  const slotsVacantesCount = Math.max(
    0,
    (categoriaActiva?.maxSocios || 3) - sociosOrdenados.length
  );

  return (
    <div className="space-y-8">
      {/* ── Barra horizontal de Tabs scrollable ── */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:flex-wrap">
          {categorias.map((cat) => {
            const isActive = cat.id === activeTab;
            const vacantes = Math.max(0, cat.maxSocios - cat.socios.length);
            const isFull = vacantes === 0;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectTab(cat.id)}
                className={`group inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[var(--color-purple-1)] text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-600/30"
                    : "border border-zinc-200/80 bg-white/80 text-zinc-700 hover:border-purple-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>

                {/* Badge de disponibilidad */}
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isFull
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300"
                  }`}
                >
                  {isFull ? "LLENO" : `${vacantes} ${vacantes === 1 ? "cupo" : "cupos"}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Descripción de la categoría activa ── */}
      <div className="rounded-2xl border border-purple-200/60 bg-purple-50/40 p-4 sm:p-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 dark:border-purple-900/40 dark:bg-purple-950/20">
        <div>
          <h2 className="font-display text-lg font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white">
            {categoriaActiva.emoji} Categoría: {categoriaActiva.label}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
            {categoriaActiva.descripcion}
          </p>
        </div>
        <div className="shrink-0 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-white/80 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-sm">
          {slotsVacantesCount > 0
            ? `Quedan ${slotsVacantesCount} de ${categoriaActiva.maxSocios} cupos exclusivos`
            : "Categoría completa (3 de 3 socios)"}
        </div>
      </div>

      {/* ── Grid de Cards (Socios reales + Vacantes) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Socios confirmados */}
        {sociosOrdenados.map((socio) => (
          <SocioCard
            key={socio.id}
            socio={socio}
            categoriaLabel={categoriaActiva.label}
          />
        ))}

        {/* Slots Vacantes */}
        {Array.from({ length: slotsVacantesCount }).map((_, index) => {
          const numeroSlot = sociosOrdenados.length + index + 1;
          return (
            <VacanteCard
              key={`vacante-${categoriaActiva.id}-${index}`}
              numeroSlot={numeroSlot}
              categoriaLabel={categoriaActiva.label}
              whatsappNumber={contacto.whatsapp}
            />
          );
        })}
      </div>
    </div>
  );
}
