"use client";

import { useActionState, useState } from "react";
import { agregarNumero, eliminarNumero, toggleNumero, type NumeroNotificacionState } from "@/lib/actions/gestionarNumeros";

interface Numero {
  id: number;
  nombre: string;
  numero: string;
  activo: boolean;
  createdAt: Date;
}

const initialState: NumeroNotificacionState = { success: false };

export function AdminNotificaciones({ numeros }: { numeros: Numero[] }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [state, formAction, isPending] = useActionState(agregarNumero, initialState);
  const [pendingId, setPendingId] = useState<number | null>(null);

  // Cerrar form al guardar correctamente
  if (state.success && mostrarForm) setMostrarForm(false);

  return (
    <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>📲</span> Notificaciones WhatsApp
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Números que recibirán una alerta cuando alguien publique un nuevo evento.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          {mostrarForm ? "✕ Cancelar" : "+ Agregar número"}
        </button>
      </div>

      {/* Formulario para agregar */}
      {mostrarForm && (
        <form
          action={async (fd) => {
            await formAction(fd);
          }}
          className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-5 space-y-4"
        >
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
            Nuevo número de notificación
          </p>

          {state.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nombre / Etiqueta
              </label>
              <input
                name="nombre"
                type="text"
                required
                placeholder="Ej: César Admin"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Número WhatsApp (con código de país)
              </label>
              <input
                name="numero"
                type="text"
                required
                placeholder="+5491127886554 o 593987654321"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Guardando..." : "Guardar número"}
          </button>
        </form>
      )}

      {/* Lista de números */}
      {numeros.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No hay números configurados todavía. Agrega el primero con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {numeros.map((n) => (
            <div
              key={n.id}
              className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-all ${
                n.activo
                  ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  : "border-zinc-200/50 bg-zinc-50/60 opacity-60 dark:border-zinc-800/50 dark:bg-zinc-900/40"
              }`}
            >
              {/* Info */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{n.activo ? "🟢" : "⭕"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {n.nombre}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    +{n.numero}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle activo/inactivo */}
                <button
                  type="button"
                  disabled={pendingId === n.id}
                  onClick={async () => {
                    setPendingId(n.id);
                    await toggleNumero(n.id, !n.activo);
                    setPendingId(null);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    n.activo
                      ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {pendingId === n.id ? "..." : n.activo ? "Pausar" : "Activar"}
                </button>

                {/* Eliminar */}
                <button
                  type="button"
                  disabled={pendingId === n.id}
                  onClick={async () => {
                    if (!confirm(`¿Eliminar el número de ${n.nombre}?`)) return;
                    setPendingId(n.id);
                    await eliminarNumero(n.id);
                    setPendingId(null);
                  }}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
        Solo recibirán notificaciones los números con estado <span className="font-medium text-emerald-600 dark:text-emerald-400">🟢 Activo</span>.
        Puedes ingresarlo con o sin signo <span className="font-mono">+</span> (Ej: <span className="font-mono">+5491127886554</span> o <span className="font-mono">593987654321</span>).
      </p>
    </section>
  );
}
