"use client";

import { useState } from "react";
import { formatFechaLojaCliente } from "@/lib/fechasCliente";

export interface PublicacionRedItem {
  id: number;
  eventoId: number;
  evento: {
    id: number;
    nombre: string;
    fecha: Date;
    lugar: string;
    imagenUrl: string | null;
  };
  plataformas: string;
  tipo: string;
  programadoAt: Date;
  publicadoAt: Date | null;
  estado: "PENDIENTE" | "PROGRAMADO" | "PUBLICADO" | "FALLIDO" | "CANCELADO";
  error: string | null;
  createdAt: Date;
}

export function AdminActividadBot({
  publicaciones = [],
}: {
  publicaciones: PublicacionRedItem[];
}) {
  const [filtroFecha, setFiltroFecha] = useState<"HOY" | "AYER" | "TODAS">("HOY");

  const ahora = new Date();
  const hoyStr = ahora.toISOString().split("T")[0];

  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().split("T")[0];

  const filtradas = publicaciones.filter((p) => {
    const fechaProg = p.programadoAt ? new Date(p.programadoAt).toISOString().split("T")[0] : null;
    const fechaCreacion = p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : null;

    if (filtroFecha === "HOY") {
      return fechaProg === hoyStr || fechaCreacion === hoyStr;
    }
    if (filtroFecha === "AYER") {
      return fechaProg === ayerStr || fechaCreacion === ayerStr;
    }
    return true;
  });

  const totalHoy = publicaciones.filter((p) => {
    const d = new Date(p.programadoAt).toISOString().split("T")[0];
    return d === hoyStr;
  }).length;

  const totalAyer = publicaciones.filter((p) => {
    const d = new Date(p.programadoAt).toISOString().split("T")[0];
    return d === ayerStr;
  }).length;

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PUBLICADO":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "PROGRAMADO":
        return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800";
      case "PENDIENTE":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      case "FALLIDO":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Métricas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
              Actividad del Bot en Redes Sociales
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Supervisión en vivo de publicaciones automáticas procesadas por Hermes y el Worker.
          </p>
        </div>

        {/* Contador de control */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800">
            <span>📅 Hoy:</span>
            <span className="text-sm font-black">{totalHoy}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
            <span>Ayer:</span>
            <span className="text-sm font-black">{totalAyer}</span>
          </div>
        </div>
      </div>

      {/* Selector de Fecha */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFiltroFecha("HOY")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filtroFecha === "HOY"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          ⚡ Actividad de Hoy ({totalHoy})
        </button>
        <button
          onClick={() => setFiltroFecha("AYER")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filtroFecha === "AYER"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          ⏮️ Actividad de Ayer ({totalAyer})
        </button>
        <button
          onClick={() => setFiltroFecha("TODAS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filtroFecha === "TODAS"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          📜 Todo el Historial ({publicaciones.length})
        </button>
      </div>

      {/* Lista de Publicaciones */}
      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white dark:bg-zinc-900/50 p-12 text-center dark:border-zinc-800">
          <span className="text-3xl">📭</span>
          <h3 className="mt-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Sin actividad registrada para este período
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            El bot programa eventos cuando detecta nuevos flyers o cuando llega el día del evento cultural.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtradas.map((pub) => (
            <div
              key={pub.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-800/60 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                {pub.evento.imagenUrl ? (
                  <img
                    src={pub.evento.imagenUrl}
                    alt={pub.evento.nombre}
                    className="w-12 h-12 rounded-lg object-cover border border-zinc-100 dark:border-zinc-800 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg flex-shrink-0">
                    🎭
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {pub.evento.nombre}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>📍 {pub.evento.lugar || "Loja"}</span>
                    <span>•</span>
                    <span>
                      🗓️ Fecha evento:{" "}
                      <strong className="text-zinc-700 dark:text-zinc-300">
                        {formatFechaLojaCliente(pub.evento.fecha)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      ⏰ Programado:{" "}
                      <strong className="text-purple-600 dark:text-purple-400">
                        {new Date(pub.programadoAt).toLocaleTimeString("es-EC", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges de Estado y Plataforma */}
              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {pub.plataformas}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getEstadoBadge(
                    pub.estado
                  )}`}
                >
                  {pub.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
