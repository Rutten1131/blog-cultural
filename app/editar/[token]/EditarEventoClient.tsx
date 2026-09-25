"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface EventoData {
  id: number;
  nombre: string;
  slug: string;
  fecha: string;
  fechaFin: string | null;
  lugar: string;
  descripcion: string;
  imagenUrl: string | null;
  expiresAt: string | null;
}

export default function EditarEventoClient({
  token,
  evento,
}: {
  token: string;
  evento: EventoData;
}) {
  const [nombre, setNombre] = useState(evento.nombre);
  // Formatear fecha para datetime-local (YYYY-MM-DDTHH:mm)
  const formatInputDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      // ajuste local a zona horaria del input
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  const [fecha, setFecha] = useState(formatInputDate(evento.fecha));
  const [lugar, setLugar] = useState(evento.lugar);
  const [descripcion, setDescripcion] = useState(evento.descripcion || "");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      const res = await fetch(`/api/eventos/editar-token/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          fecha: new Date(fecha).toISOString(),
          lugar,
          descripcion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar el evento");
      }

      setMensaje({
        tipo: "exito",
        texto: "¡Evento actualizado exitosamente! Los cambios ya están en vivo.",
      });
    } catch (err: any) {
      setMensaje({
        tipo: "error",
        texto: err.message || "Ocurrió un error al guardar los cambios",
      });
    } finally {
      setLoading(false);
    }
  };

  const fechaExpiracionStr = evento.expiresAt
    ? new Date(evento.expiresAt).toLocaleDateString("es-EC", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2">
            <span>Edición Rápida</span>
            <span>•</span>
            <span>Acceso Privado</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Modificar Datos del Evento
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Puedes ajustar el título, fecha, lugar o descripción sin necesidad de iniciar sesión.
          </p>
          {fechaExpiracionStr && (
            <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
              <span>⏳</span>
              <span>
                Este enlace es temporal y expirará automáticamente el <strong>{fechaExpiracionStr}</strong>.
              </span>
            </p>
          )}
        </div>

        {/* Notificaciones */}
        {mensaje && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm flex items-start justify-between gap-3 ${
              mensaje.tipo === "exito"
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-red-950/60 border border-red-800 text-red-300"
            }`}
          >
            <div>
              <p className="font-semibold">{mensaje.tipo === "exito" ? "¡Listo!" : "Error"}</p>
              <p className="mt-0.5">{mensaje.texto}</p>
            </div>
            {mensaje.tipo === "exito" && (
              <Link
                href={`/eventos/${evento.slug}`}
                target="_blank"
                className="text-xs font-semibold underline hover:text-white shrink-0 self-center"
              >
                Ver en la web ↗
              </Link>
            )}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          {evento.imagenUrl && (
            <div className="flex items-center gap-4 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                <Image
                  src={evento.imagenUrl}
                  alt={evento.nombre}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="overflow-hidden text-xs">
                <p className="font-medium text-neutral-300">Portada actual del afiche</p>
                <p className="text-neutral-500 truncate mt-0.5">{evento.imagenUrl}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Título del evento *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition text-sm"
              placeholder="Ej: Festival Gastronómico Transfronterizo"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Fecha y hora de inicio *
              </label>
              <input
                type="datetime-local"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Lugar o Recinto *
              </label>
              <input
                type="text"
                required
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition text-sm"
                placeholder="Ej: Plaza San Sebastián"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Descripción completa
            </label>
            <textarea
              rows={6}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition text-sm leading-relaxed"
              placeholder="Escribe o amplía los detalles del evento..."
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-4 border-t border-neutral-800/80">
            <Link
              href={`/eventos/${evento.slug}`}
              target="_blank"
              className="text-xs text-neutral-400 hover:text-white transition"
            >
              Ver página pública ↗
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
