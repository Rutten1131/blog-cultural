"use client";

import { useState } from "react";
import Image from "next/image";
import { aprobarEvento, rechazarEvento, editarEvento } from "@/lib/actions/moderacionEvento";
import { formatFechaLojaCliente } from "@/lib/fechasCliente";
import { parseVideoUrl, extractVideoUrls } from "@/lib/mediaUtils";

interface Categoria {
  id: number;
  nombre: string;
  slug: string;
}

interface Zona {
  id: number;
  nombre: string;
  tipo: string;
}

interface EventoItem {
  id: number;
  nombre: string;
  fecha: Date;
  fechaFin?: Date | null;
  lugar: string;
  descripcion: string;
  nombreGestor: string;
  institucionRelacionada?: string | null;
  imagenUrl: string | null;
  multimedia?: any;
  videoUrl?: string | null;
  confianzaClasificacion: number | null;
  categoriaId: number | null;
  zonaId: number | null;
  createdAt: Date;
}

function toLocalDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EventoCard({
  evento,
  categorias,
  zonas,
  isOpen = false,
  onToggle,
}: {
  evento: EventoItem;
  categorias: Categoria[];
  zonas: Zona[];
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isExpanded = onToggle ? isOpen : internalOpen;
  const toggle = onToggle ? onToggle : () => setInternalOpen(!internalOpen);

  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [previewImg, setPreviewImg] = useState<string>(evento.imagenUrl || "");

  const [selectedCategoria, setSelectedCategoria] = useState<string>(
    evento.categoriaId ? String(evento.categoriaId) : ""
  );
  const [selectedZona, setSelectedZona] = useState<string>(
    evento.zonaId ? String(evento.zonaId) : ""
  );

  const requiereRevision =
    evento.confianzaClasificacion === null ||
    evento.confianzaClasificacion < 0.6;

  // Extraer lista de imágenes de multimedia
  let imagenes: string[] = [];
  if (Array.isArray(evento.multimedia)) {
    imagenes = evento.multimedia;
  } else if (typeof evento.multimedia === "string") {
    try {
      const p = JSON.parse(evento.multimedia);
      if (Array.isArray(p)) imagenes = p;
    } catch {
      if (evento.multimedia.startsWith("http")) imagenes = [evento.multimedia];
    }
  }
  if (evento.imagenUrl && !imagenes.includes(evento.imagenUrl)) {
    imagenes.unshift(evento.imagenUrl);
  }

  // Extraer lista de videos/redes sociales/enlaces web
  const videos = extractVideoUrls(evento.videoUrl);

  return (
    <div
      className={`rounded-2xl border transition-all bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md ${
        requiereRevision
          ? "border-amber-300 dark:border-amber-700/60"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {/* ── CABECERA COMPACTA DE ACORDEÓN (Siempre visible y cliqueable) ── */}
      <button
        type="button"
        onClick={toggle}
        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Miniatura representativa */}
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
            {imagenes[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagenes[0]}
                alt={evento.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl">🎭</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {evento.nombre}
              </h2>
              {requiereRevision && (
                <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                  ⚠️ Revisar sugerencia
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>👤 {evento.nombreGestor}</span>
              {evento.institucionRelacionada && (
                <span className="font-semibold text-purple-700 dark:text-purple-300">
                  🏛️ {evento.institucionRelacionada}
                </span>
              )}
              <span>📍 {evento.lugar}</span>
              <span>📅 {formatFechaLojaCliente(evento.fecha, "corto")}</span>
            </div>
          </div>
        </div>

        {/* Indicador y botón para expandir/plegar */}
        <div className="flex items-center gap-3 shrink-0">
          {evento.confianzaClasificacion !== null && (
            <span className="hidden sm:inline-block text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg">
              IA {(evento.confianzaClasificacion * 100).toFixed(0)}%
            </span>
          )}
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-bold transition-transform duration-200 ${
              isExpanded ? "rotate-180 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" : ""
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {/* ── CUERPO EXPANDIBLE (ACORDEÓN) ── */}
      {isExpanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-5 sm:p-7 space-y-6 bg-zinc-50/50 dark:bg-zinc-950/30 animate-fadeIn">
          {/* Descripción completa */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Descripción del Evento
            </label>
            <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 break-words [overflow-wrap:anywhere]">
              {evento.descripcion}
            </p>
          </div>

          {/* ── Galería de Imágenes y Afiches adjuntos ── */}
          {imagenes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                📸 Afiches e Imágenes Adjuntas ({imagenes.length})
              </p>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {imagenes.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 shadow-sm"
                    title="Clic para ver en tamaño completo"
                  >
                    <Image
                      src={img}
                      alt={`Afiche ${idx + 1}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      #{idx + 1}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Videos y Enlaces — SOLO MINIATURA con icono de plataforma ── */}
          {videos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                🔗 Multimedia Adjunta ({videos.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {videos.map((vUrl, idx) => {
                  const vInfo = parseVideoUrl(vUrl);
                  const isWebLink = vInfo?.provider === "web";

                  // Determinar icono y color de fondo según plataforma
                  const icon = !vInfo ? "🔗" : ({
                    facebook: "📘", instagram: "📸", tiktok: "🎵",
                    youtube: "▶️", vimeo: "📹", web: "🌐",
                  }[vInfo.provider] || "🔗");

                  const iconBg = !vInfo ? "bg-zinc-700/80" : ({
                    facebook: "bg-blue-600/90",
                    instagram: "bg-gradient-to-tr from-purple-600 to-pink-500",
                    tiktok: "bg-zinc-900/90",
                    youtube: "bg-red-600/90",
                    vimeo: "bg-cyan-600/90",
                    web: "bg-purple-600/80",
                  }[vInfo.provider] || "bg-zinc-700/80");

                  const fallbackGradient = !vInfo ? "from-zinc-800 to-zinc-950" : ({
                    facebook: "from-blue-900 to-blue-950",
                    instagram: "from-purple-900 via-pink-900 to-orange-900",
                    tiktok: "from-zinc-900 to-zinc-950",
                    youtube: "from-red-950 to-zinc-950",
                    vimeo: "from-cyan-900 to-zinc-950",
                    web: "from-purple-950 to-zinc-950",
                  }[vInfo.provider] || "from-zinc-800 to-zinc-950");

                  return (
                    <a
                      key={idx}
                      href={vUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow block"
                      title={isWebLink ? "Visitar enlace" : "Ver en la plataforma"}
                    >
                      <div className={`relative aspect-[4/3] w-full flex items-center justify-center ${
                        vInfo?.thumbnailUrl ? "" : `bg-gradient-to-br ${fallbackGradient}`
                      }`}>
                        {vInfo?.thumbnailUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={vInfo.thumbnailUrl}
                              alt={vInfo?.title || "Miniatura"}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 text-white/80 p-3">
                            <span className="text-3xl">{icon}</span>
                            {isWebLink && (
                              <span className="text-[10px] font-medium text-white/60 truncate max-w-full px-2">
                                {vInfo?.title || "Página Web"}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Botón play central (solo para videos) */}
                        {!isWebLink && (
                          <span className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-lg group-hover:scale-110 transition-transform text-sm">
                              ▶
                            </span>
                          </span>
                        )}

                        {/* Hover para web links */}
                        {isWebLink && (
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 pointer-events-none">
                            <span className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-zinc-900 shadow-lg">
                              🌐 Visitar ↗
                            </span>
                          </span>
                        )}

                        {/* Icono de plataforma (esquina superior izquierda) */}
                        <span className={`absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full ${iconBg} text-white text-xs shadow-md backdrop-blur-sm`}>
                          {icon}
                        </span>

                        {/* Badge de formato (solo si es video) */}
                        {!isWebLink && vInfo && (
                          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm">
                            {vInfo.format === "vertical" ? "Reel" : "Video"}
                          </span>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulario de Edición Completa para Administradores */}
          {isEditing ? (
            <form
              action={async (formData) => {
                setSavingEdit(true);
                await editarEvento(formData);
                setSavingEdit(false);
                setIsEditing(false);
              }}
              className="rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 p-5 sm:p-6 space-y-6"
            >
              <input type="hidden" name="eventoId" value={evento.id} />
              <input type="hidden" name="estado" value="PENDIENTE" />

              <div className="flex items-center justify-between pb-3 border-b border-purple-200/60 dark:border-purple-800/40">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✏️</span>
                  <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200 uppercase tracking-wider">
                    Editar Datos del Evento Pendiente
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg px-3 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                >
                  ✕ Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campos principales */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                      Nombre del evento
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      defaultValue={evento.nombre}
                      required
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Lugar */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                      Lugar
                    </label>
                    <input
                      type="text"
                      name="lugar"
                      defaultValue={evento.lugar}
                      required
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Gestor / Organizador */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                      Organizador / Gestor
                    </label>
                    <input
                      type="text"
                      name="nombreGestor"
                      defaultValue={evento.nombreGestor}
                      required
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Institución */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                      Institución / Entidad Relacionada
                    </label>
                    <input
                      type="text"
                      name="institucionRelacionada"
                      defaultValue={evento.institucionRelacionada ?? ""}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Fecha inicio */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      name="fecha"
                      defaultValue={toLocalDateInput(evento.fecha)}
                      required
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Fecha fin */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                      Fecha Fin (opcional)
                    </label>
                    <input
                      type="date"
                      name="fechaFin"
                      defaultValue={toLocalDateInput(evento.fechaFin)}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                      Categoría
                    </label>
                    <select
                      name="categoriaId"
                      value={selectedCategoria}
                      onChange={(e) => setSelectedCategoria(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Sin categoría --</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Zona */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                      Zona / Parroquia
                    </label>
                    <select
                      name="zonaId"
                      value={selectedZona}
                      onChange={(e) => setSelectedZona(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Sin zona --</option>
                      {zonas.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre} ({z.tipo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Columna derecha: Imagen */}
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                    Imagen Principal
                  </label>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center">
                    {previewImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImg}
                        alt="Previsualización"
                        className="h-full w-full object-cover"
                        onError={() => setPreviewImg("")}
                      />
                    ) : (
                      <div className="text-center p-4 text-zinc-400">
                        <span className="text-2xl block mb-1">🖼️</span>
                        <span className="text-xs">Sin imagen o enlace roto</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="url"
                    name="imagenUrl"
                    value={previewImg}
                    onChange={(e) => setPreviewImg(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Puedes pegar un enlace directo a la imagen afiche.
                  </p>
                </div>

                {/* Descripción a ancho completo */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                    Descripción Completa
                  </label>
                  <textarea
                    name="descripcion"
                    defaultValue={evento.descripcion}
                    required
                    rows={4}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                  />
                </div>
              </div>

              {/* Botones de guardar edición */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-200/60 dark:border-purple-800/40">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-sm font-bold text-white shadow transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {savingEdit ? "Guardando..." : "💾 Guardar Cambios"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Datos de Lugar y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  📍 <span className="font-semibold text-zinc-900 dark:text-zinc-100">Lugar:</span> {evento.lugar}
                </div>
                <div>
                  📅 <span className="font-semibold text-zinc-900 dark:text-zinc-100">Fecha:</span>{" "}
                  {formatFechaLojaCliente(evento.fecha, "largo")}
                  {evento.fechaFin && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      🏁 Hasta: {formatFechaLojaCliente(evento.fechaFin, "largo")}
                    </div>
                  )}
                </div>
              </div>

              {/* Selects de Categoría y Zona */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Categoría asignada:
                  </label>
                  <select
                    value={selectedCategoria}
                    onChange={(e) => setSelectedCategoria(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Sin categoría --</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Zona asignada:
                  </label>
                  <select
                    value={selectedZona}
                    onChange={(e) => setSelectedZona(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Sin zona --</option>
                    {zonas.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nombre} ({z.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones de acción (Editar, Rechazar, Aprobar) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/60 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>✏️</span>
                  <span>Editar Evento</span>
                </button>

                <div className="flex items-center gap-3">
                  <form action={rechazarEvento}>
                    <input type="hidden" name="eventoId" value={evento.id} />
                    <button
                      type="submit"
                      className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900 cursor-pointer transition-all active:scale-95"
                    >
                      ✕ Rechazar Evento
                    </button>
                  </form>

                  <form action={aprobarEvento}>
                    <input type="hidden" name="eventoId" value={evento.id} />
                    <input type="hidden" name="categoriaId" value={selectedCategoria} />
                    <input type="hidden" name="zonaId" value={selectedZona} />
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <span>✓</span>
                      <span>Aprobar y Publicar</span>
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
