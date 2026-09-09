"use client";

import { useState } from "react";
import Link from "next/link";
import { editarEvento, eliminarEvento } from "@/lib/actions/moderacionEvento";

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
  slug: string;
  nombre: string;
  fecha: Date;
  fechaFin?: Date | null;
  lugar: string;
  descripcion: string;
  nombreGestor: string;
  institucionRelacionada?: string | null;
  imagenUrl: string | null;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  categoriaId: number | null;
  zonaId: number | null;
  createdAt: Date;
}

const ESTADO_BADGE: Record<string, { label: string; cls: string; border: string }> = {
  APROBADO: {
    label: "Aprobado",
    cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  PENDIENTE: {
    label: "Pendiente",
    cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  RECHAZADO: {
    label: "Rechazado",
    cls: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    border: "border-rose-500/20",
  },
};

function toLocalDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EventoAdminRow({
  evento,
  categorias,
  zonas,
}: {
  evento: EventoItem;
  categorias: Categoria[];
  zonas: Zona[];
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewImg, setPreviewImg] = useState<string>(evento.imagenUrl || "");

  const badge = ESTADO_BADGE[evento.estado] ?? ESTADO_BADGE.PENDIENTE;

  async function handleEdit(formData: FormData) {
    setSaving(true);
    await editarEvento(formData);
    setSaving(false);
    setOpen(false);
  }

  async function handleDelete(formData: FormData) {
    setDeleting(true);
    await eliminarEvento(formData);
    setDeleting(false);
  }

  return (
    <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Fila compacta visual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-4 min-w-0">
          {/* Miniatura de imagen */}
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            {evento.imagenUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={evento.imagenUrl}
                alt={evento.nombre}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl text-zinc-400">
                🖼️
              </div>
            )}
          </div>

          {/* Datos principales */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate max-w-md">
                {evento.nombre}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badge.cls} ${badge.border}`}
              >
                {badge.label}
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>📍 {evento.lugar}</span>
              <span>👤 {evento.nombreGestor}</span>
              <span>
                📅{" "}
                {new Date(evento.fecha).toLocaleDateString("es-EC", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
              {evento.institucionRelacionada && (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  🏛️ {evento.institucionRelacionada}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {evento.slug && (
            <Link
              href={`/eventos/${evento.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all flex items-center gap-1.5 shadow-sm"
              title="Ver cómo se ve en la agenda pública"
            >
              <span>👁️ Ver</span>
            </Link>
          )}

          <button
            onClick={() => {
              setOpen(!open);
              setConfirmDelete(false);
            }}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              open
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
            }`}
          >
            <span>{open ? "✕ Cerrar" : "✏️ Editar"}</span>
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all flex items-center gap-1"
            >
              <span>🗑️ Eliminar</span>
            </button>
          ) : (
            <form action={handleDelete} className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl border border-rose-200 dark:border-rose-800">
              <input type="hidden" name="eventoId" value={evento.id} />
              <span className="text-xs text-rose-700 dark:text-rose-300 font-bold px-1">
                ¿Eliminar?
              </span>
              <button
                type="submit"
                disabled={deleting}
                className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {deleting ? "..." : "Sí"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                No
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Formulario de edición expandible con vista previa en vivo */}
      {open && (
        <form
          action={handleEdit}
          className="border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-5 sm:p-7 space-y-6 animate-fadeIn"
        >
          <input type="hidden" name="eventoId" value={evento.id} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda / Central: Campos */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
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

              {/* Organizador */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Institución / Entidad Responsable
                </label>
                <input
                  type="text"
                  name="institucionRelacionada"
                  defaultValue={evento.institucionRelacionada ?? ""}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Estado
                </label>
                <select
                  name="estado"
                  defaultValue={evento.estado}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="PENDIENTE">⏳ Pendiente</option>
                  <option value="APROBADO">✅ Aprobado (Publicado)</option>
                  <option value="RECHAZADO">❌ Rechazado</option>
                </select>
              </div>

              {/* Fecha inicio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Fecha inicio
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
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Fecha fin (opcional)
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
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Categoría
                </label>
                <select
                  name="categoriaId"
                  defaultValue={evento.categoriaId ? String(evento.categoriaId) : ""}
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
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Zona / Parroquia
                </label>
                <select
                  name="zonaId"
                  defaultValue={evento.zonaId ? String(evento.zonaId) : ""}
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

            {/* Columna Derecha: Vista previa de Imagen & URL */}
            <div className="flex flex-col gap-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Imagen del Evento
              </label>

              {/* Contenedor de visualización previa */}
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
                  <div className="text-center p-4">
                    <span className="text-3xl block mb-1">🖼️</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      Sin imagen asignada o enlace inválido
                    </span>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="url"
                  name="imagenUrl"
                  value={previewImg}
                  onChange={(e) => setPreviewImg(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Escribe o pega una URL para previsualizar al instante.
                </p>
              </div>
            </div>

            {/* Descripción a todo el ancho */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Descripción
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

          {/* Botones de acción formulario */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-md hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 transition-all flex items-center gap-2"
            >
              {saving ? "Guardando..." : "💾 Guardar Cambios"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
