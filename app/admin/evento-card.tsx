"use client";

import { useState } from "react";
import { aprobarEvento, rechazarEvento } from "@/lib/actions/moderacionEvento";
import { formatFechaLojaCliente } from "@/lib/fechasCliente";

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
  lugar: string;
  descripcion: string;
  nombreGestor: string;
  imagenUrl: string | null;
  confianzaClasificacion: number | null;
  categoriaId: number | null;
  zonaId: number | null;
  createdAt: Date;
}

export function EventoCard({
  evento,
  categorias,
  zonas,
}: {
  evento: EventoItem;
  categorias: Categoria[];
  zonas: Zona[];
}) {
  const [selectedCategoria, setSelectedCategoria] = useState<string>(
    evento.categoriaId ? String(evento.categoriaId) : ""
  );
  const [selectedZona, setSelectedZona] = useState<string>(
    evento.zonaId ? String(evento.zonaId) : ""
  );

  const requiereRevision =
    evento.confianzaClasificacion === null ||
    evento.confianzaClasificacion < 0.6;

  return (
    <div
      className={`rounded-2xl border p-6 transition-all bg-white dark:bg-zinc-900 ${
        requiereRevision
          ? "border-amber-400 dark:border-amber-600 bg-amber-50/20 dark:bg-amber-950/20"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {evento.nombre}
            </h2>
            {requiereRevision && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                ⚠️ Revisar sugerencia
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Organiza: <span className="font-medium">{evento.nombreGestor}</span>
          </p>
        </div>

        {evento.confianzaClasificacion !== null && (
          <div className="text-right text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
            Confianza IA:{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {(evento.confianzaClasificacion * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4 whitespace-pre-line">
        {evento.descripcion}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-600 dark:text-zinc-400 mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <div>
          📍 <span className="font-medium text-zinc-900 dark:text-zinc-100">Lugar:</span> {evento.lugar}
        </div>
        <div>
          📅 <span className="font-medium text-zinc-900 dark:text-zinc-100">Fecha:</span>{" "}
          {formatFechaLojaCliente(evento.fecha, "largo")}
        </div>
      </div>

      {/* Selects de Categoría y Zona */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Categoría sugerida / asignada:
          </label>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Zona sugerida / asignada:
          </label>
          <select
            value={selectedZona}
            onChange={(e) => setSelectedZona(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <form action={rechazarEvento}>
          <input type="hidden" name="eventoId" value={evento.id} />
          <button
            type="submit"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
          >
            Rechazar
          </button>
        </form>

        <form action={aprobarEvento}>
          <input type="hidden" name="eventoId" value={evento.id} />
          <input type="hidden" name="categoriaId" value={selectedCategoria} />
          <input type="hidden" name="zonaId" value={selectedZona} />
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Aprobar y Publicar
          </button>
        </form>
      </div>
    </div>
  );
}
