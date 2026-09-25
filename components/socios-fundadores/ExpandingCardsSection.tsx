"use client";

import React, { useState } from "react";
import { CategoriaConfig } from "@/components/socios-fundadores/CategoryTabs";

interface ExpandingCardsSectionProps {
  categorias: CategoriaConfig[];
  contacto: {
    whatsapp: string;
    email: string;
    mensaje_whatsapp_base?: string;
  };
}

interface SectorCardData {
  id: string;
  titulo: string;
  subtitulo: string;
  emoji: string;
  descripcion: string;
  imagen: string;
  categoriaId: string;
  socios: Array<{
    id: string;
    nombre: string;
    logo?: string;
    descripcion?: string;
    web?: string;
    ubicacion?: {
      direccion?: string;
      maps?: string;
    };
  }>;
  cuposDisponibles: number;
}

export function ExpandingCardsSection({
  categorias,
  contacto,
}: ExpandingCardsSectionProps) {
  // Mapa de metadata visual por categoría (imágenes Unsplash + subtítulo)
  const sectorMeta: Record<string, { titulo: string; subtitulo: string; imagen: string }> = {
    hoteles: {
      titulo: "Hotelería & Estadía",
      subtitulo: "Alojamientos Exclusivos",
      imagen: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    },
    restaurantes: {
      titulo: "Gastronomía Lojana",
      subtitulo: "Sabores & Cafeterías",
      imagen: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    },
    operadores: {
      titulo: "Tours & Rutas",
      subtitulo: "Operadores Turísticos",
      imagen: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
    },
    financiero: {
      titulo: "Sector Financiero",
      subtitulo: "Banca & Cooperativas",
      imagen: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&w=1200&q=80",
    },
    "centros-comerciales": {
      titulo: "Comercio & Retail",
      subtitulo: "Centros Comerciales",
      imagen: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=1200&q=80",
    },
    "sitios-turisticos": {
      titulo: "Destinos & Cultura",
      subtitulo: "Patrimonio & Naturaleza",
      imagen: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    },
  };

  // Generación dinámica de sectores desde el JSON (incluye todos los que existan)
  const sectors: SectorCardData[] = categorias.map((cat) => {
    const meta = sectorMeta[cat.id] ?? {
      titulo: cat.label,
      subtitulo: cat.label,
      imagen: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    };
    return {
      id: cat.id,
      titulo: meta.titulo,
      subtitulo: meta.subtitulo,
      emoji: cat.emoji,
      descripcion: cat.descripcion,
      imagen: meta.imagen,
      categoriaId: cat.id,
      socios: cat.socios || [],
      cuposDisponibles: Math.max(0, (cat.maxSocios ?? 3) - (cat.socios?.length ?? 0)),
    };
  });

  const [activeCardId, setActiveCardId] = useState<string>(sectors[0].id);
  // Modal para ver miembros del sector
  const [modalSector, setModalSector] = useState<SectorCardData | null>(null);

  const cleanPhone = contacto.whatsapp.replace(/[^0-9]/g, "");

  return (
    <section className="w-full space-y-4">
      {/* ── Encabezado Compacto ── */}
      <div className="rounded-2xl border border-purple-200/70 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/60 px-4 py-3 sm:px-6 sm:py-4 shadow-sm backdrop-blur-md dark:border-purple-900/40 dark:from-purple-950/20 dark:via-zinc-900 dark:to-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-950/70 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
            <span>🏛️ GuIAloja — Infraestructura Turística</span>
          </div>
          <h2 className="font-display text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white leading-tight">
            Empresas que forman parte de GuIAloja
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Red de recomendación inteligente de Loja. Haz clic en cada sector para explorar.
          </p>
        </div>
        {/* Indicador animado inline */}
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/95 px-3 py-1 text-[10px] font-bold text-zinc-700 shadow-md backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-800/95 dark:text-zinc-200 animate-bounce self-start sm:self-center whitespace-nowrap">
          <span>Haz clic en una tarjeta</span>
          <span>👆</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MÓVIL: Grid 2 columnas (oculto en sm+)
          ══════════════════════════════════════════════ */}
      <div className="sm:hidden grid grid-cols-2 gap-3 w-full">
        {sectors.map((sector) => (
          <div
            key={`mob-${sector.id}`}
            onClick={() => {
              setActiveCardId(sector.id);
              setModalSector(sector);
            }}
            className="relative cursor-pointer overflow-hidden rounded-2xl aspect-[3/4] shadow-lg active:scale-95 transition-transform"
          >
            {/* Imagen de fondo */}
            <img
              src={sector.imagen}
              alt={sector.titulo}
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
            />
            {/* Gradiente oscuro */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 text-white z-10">
              {/* Badge superior */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold text-white">
                  ⭐ Socio Fundador
                </span>
                <span className="text-base filter drop-shadow-md">{sector.emoji}</span>
              </div>

              {/* Info inferior */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  {sector.subtitulo}
                </p>
                <h3 className="font-display text-sm font-black uppercase tracking-tight text-white leading-tight">
                  {sector.titulo}
                </h3>

                {/* Cupos / Socios */}
                {sector.socios.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sector.socios.slice(0, 2).map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-zinc-900"
                      >
                        {s.logo && (
                          <img src={s.logo} alt={s.nombre} className="h-3 w-3 object-contain" />
                        )}
                        {s.nombre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/25 border border-amber-300/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                    </span>
                    {sector.cuposDisponibles} cupos libres
                  </span>
                )}

                {/* Ver sector CTA */}
                <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-purple-300">
                  <span>Ver sector</span>
                  <span>›</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP: Expanding Cards horizontal (oculto en móvil)
          ══════════════════════════════════════════════ */}
      <div className="hidden sm:block relative w-full overflow-hidden rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 bg-zinc-900/5 dark:bg-zinc-950/40 border border-purple-100/80 dark:border-zinc-800">
        <div className="flex flex-row gap-2 sm:gap-3 h-[520px] lg:h-[600px] xl:h-[650px] w-full transition-all duration-500 ease-in-out">
          {sectors.map((sector) => {
            const isExpanded = activeCardId === sector.id;

            return (
              <div
                key={sector.id}
                onClick={() => setActiveCardId(sector.id)}
                className={`relative cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-500 ease-out select-none group shadow-md hover:shadow-2xl ${
                  isExpanded
                    ? "flex-[6] sm:flex-[5] lg:flex-[6]"
                    : "flex-[1.2] sm:flex-[1] hover:flex-[1.4]"
                }`}
                style={{
                  minWidth: isExpanded ? "190px" : "48px",
                }}
              >
                {/* Imagen de fondo */}
                <img
                  src={sector.imagen}
                  alt={sector.titulo}
                  className={`absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ${
                    isExpanded
                      ? "scale-100 filter brightness-95"
                      : "scale-115 filter brightness-75 contrast-105 group-hover:scale-105"
                  }`}
                  loading="lazy"
                />

                {/* Capa de contraste / gradiente oscuro */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    isExpanded
                      ? "bg-gradient-to-t from-black/95 via-black/55 to-black/25"
                      : "bg-gradient-to-t from-black/85 via-black/45 to-black/20 group-hover:from-black/75"
                  }`}
                />

                {/* ── Estado Contraído (Vertical) ── */}
                {!isExpanded && (
                  <div className="absolute inset-0 flex flex-col justify-between items-center py-5 sm:py-7 px-1 text-white z-10 pointer-events-none">
                    <span className="text-xl sm:text-2xl filter drop-shadow-md">
                      {sector.emoji}
                    </span>
                    <span
                      className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-100 filter drop-shadow-md [writing-mode:vertical-rl] rotate-180 whitespace-nowrap line-clamp-1"
                      style={{ textOrientation: "mixed" }}
                    >
                      {sector.titulo}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm border border-white/20 whitespace-nowrap">
                      {sector.socios.length > 0 ? `${sector.socios.length}` : `${sector.cuposDisponibles}c`}
                    </span>
                  </div>
                )}

                {/* ── Estado Expandido ── */}
                {isExpanded && (
                  <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-7 text-white z-10 animate-fadeIn">
                    <div className="space-y-2.5 sm:space-y-3.5 max-w-xl">
                      {/* Badges superiores */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-purple-600/90 backdrop-blur-md px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-white shadow-sm">
                          <span>{sector.emoji}</span>
                          <span>{sector.subtitulo}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-extrabold text-amber-300">
                          ⭐ Socio Fundador
                        </span>
                      </div>

                      {/* Título Principal */}
                      <h3 className="font-display text-xl sm:text-3xl font-black uppercase tracking-tight text-white filter drop-shadow">
                        {sector.titulo}
                      </h3>

                      {/* Descripción */}
                      <p className="text-[11px] sm:text-sm text-zinc-200/95 leading-relaxed font-normal line-clamp-3 sm:line-clamp-none">
                        {sector.descripcion}
                      </p>

                      {/* Empresas asociadas o vacantes */}
                      <div className="pt-1 sm:pt-2">
                        {sector.socios.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-200">
                              Empresas y Marcas Aliadas:
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {sector.socios.map((s) => (
                                <a
                                  key={s.id}
                                  href={s.web || `/socios-fundadores?categoria=${sector.categoriaId}`}
                                  target={s.web ? "_blank" : "_self"}
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="group/socio inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md text-zinc-900 hover:bg-white hover:scale-105 transition-all"
                                  title={`Ver sitio oficial de ${s.nombre}`}
                                >
                                  {s.logo ? (
                                    <img
                                      src={s.logo}
                                      alt={s.nombre}
                                      className="h-5 w-5 object-contain"
                                    />
                                  ) : (
                                    <span className="h-5 w-5 rounded-md bg-purple-600 text-[10px] font-black text-white flex items-center justify-center">
                                      {s.nombre.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                  <span className="text-xs font-bold group-hover/socio:text-purple-600 transition-colors">
                                    {s.nombre} ↗
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-300/40 px-3 py-1.5 backdrop-blur-md text-amber-200 text-[11px] sm:text-xs font-semibold">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                            </span>
                            <span>
                              {sector.cuposDisponibles} cupos exclusivos disponibles en esta categoría
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción directos */}
                      <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalSector(sector);
                          }}
                          className="sheen-hover inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition-all active:scale-95 text-center cursor-pointer"
                        >
                          <span>Ver miembros de este sector</span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>

                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Hola César, deseo postular a mi empresa como Socio Fundador en el sector de ${sector.titulo}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>💬 Postular mi empresa</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal Flotante: Miembros del sector ── */}
      {modalSector && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setModalSector(null)}
        >
          <div
            className="relative w-full max-w-xl rounded-3xl border border-white/40 bg-white p-6 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-950/60 px-3 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
                  <span>{modalSector.emoji} Sector Fundador</span>
                </div>
                <h3 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white">
                  Miembros: {modalSector.titulo}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Empresas integradas como Socios Fundadores a la infraestructura GuIAloja.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalSector(null)}
                className="rounded-full h-8 w-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300 font-bold"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* Contenido: Listado de miembros */}
            <div className="py-6 space-y-4">
              {modalSector.socios.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {modalSector.socios.map((socio) => (
                    <div
                      key={socio.id}
                      className="flex flex-col justify-between p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 hover:border-purple-300 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1 flex items-center justify-center shrink-0 shadow-sm">
                          {socio.logo ? (
                            <img
                              src={socio.logo}
                              alt={socio.nombre}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="font-display font-black text-purple-600 text-sm">
                              {socio.nombre.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold truncate group-hover:text-purple-600 transition-colors">
                            {socio.nombre}
                          </h4>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            ⭐ Socio Fundador
                          </span>
                        </div>
                      </div>

                      {socio.descripcion && (
                        <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {socio.descripcion}
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-between">
                        {socio.web ? (
                          <a
                            href={socio.web}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            <span>Visitar página web</span>
                            <span>↗</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-500">Página oficial en GuIAloja</span>
                        )}

                        {socio.ubicacion?.maps && (
                          <a
                            href={socio.ubicacion.maps}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            title="Ver en Google Maps"
                          >
                            📍
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <span className="text-3xl">✨</span>
                  <h4 className="font-display text-lg font-black uppercase text-zinc-800 dark:text-zinc-200 mt-2">
                    Cupos exclusivos disponibles ({modalSector.cuposDisponibles} vacantes)
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                    Aún no se ha completado el cupo en el sector de {modalSector.titulo}. Las empresas que ingresen obtendrán el reconocimiento perpetuo de Socio Fundador.
                  </p>
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hola César, deseo postular a mi empresa como Socio Fundador en el sector de ${modalSector.titulo}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition-all"
                  >
                    <span>💬 Postular como primer miembro fundador</span>
                  </a>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setModalSector(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
