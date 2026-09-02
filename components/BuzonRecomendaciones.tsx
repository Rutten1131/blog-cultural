"use client";

import { useActionState, useState } from "react";
import { crearRecomendacion, type CrearRecomendacionState } from "@/lib/actions/crearRecomendacion";

const initialState: CrearRecomendacionState = { success: false };

export function BuzonRecomendaciones() {
  const [mensaje, setMensaje] = useState("");
  const [contacto, setContacto] = useState("");
  const [abierto, setAbierto] = useState(false);

  const [state, formAction, isPending] = useActionState(
    crearRecomendacion,
    initialState
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-purple-500/10 p-6 sm:p-8 dark:border-zinc-800/80 dark:from-amber-500/5 dark:via-zinc-900/60 dark:to-purple-900/10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 mb-3 border border-amber-300/40">
            <span>✨ Etapa de validación comunitaria</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            ¿Tienes una recomendación para mejorar la Agenda Cultural de Loja?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Estamos en etapa de validación. Tu aporte nos ayuda a construir una mejor plataforma para nuestra ciudad.
          </p>
        </div>

        <div>
          {!abierto && !state.success && (
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 whitespace-nowrap"
            >
              ✍️ Dejar una recomendación
            </button>
          )}
        </div>
      </div>

      {/* Formulario desplegable */}
      {abierto && !state.success && (
        <form action={formAction} className="mt-6 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-4 max-w-2xl">
          {state.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="mensaje" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              ¿Qué te gustaría ver, mejorar o añadir en la plataforma?
            </label>
            <textarea
              id="mensaje"
              name="mensaje"
              rows={3}
              required
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Ej: Me gustaría que avisen eventos en Malacatos, o que agreguen teatro infantil..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label htmlFor="contacto" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tu contacto o nombre <span className="text-zinc-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="contacto"
                name="contacto"
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Nombre, WhatsApp o email"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Enviando..." : "Enviar aporte"}
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Confirmación de recepción */}
      {state.success && (
        <div className="mt-6 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 font-bold">
            ✓
          </span>
          <p className="text-sm font-medium">
            ¡Muchas gracias por tu aporte! Tu recomendación fue registrada para el equipo.
          </p>
        </div>
      )}
    </section>
  );
}
