"use client";

import { useActionState, useState } from "react";
import { crearRecomendacion, type CrearRecomendacionState } from "@/lib/actions/crearRecomendacion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const initialState: CrearRecomendacionState = { success: false };

export function BuzonRecomendaciones() {
  const { t } = useLanguage();
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
            <span>{t("buzon.badge")}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("buzon.titulo")}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {t("buzon.desc")}
          </p>
        </div>

        <div>
          {!abierto && !state.success && (
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 whitespace-nowrap"
            >
              {t("buzon.btn_abrir")}
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
              {t("buzon.label_mensaje")}
            </label>
            <textarea
              id="mensaje"
              name="mensaje"
              rows={3}
              required
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder={t("buzon.placeholder_mensaje")}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label htmlFor="contacto" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("buzon.label_contacto")} <span className="text-zinc-400 font-normal">{t("buzon.opcional")}</span>
              </label>
              <input
                id="contacto"
                name="contacto"
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder={t("buzon.placeholder_contacto")}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? t("buzon.enviando") : t("buzon.btn_enviar")}
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              >
                {t("buzon.cancelar")}
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
            {t("buzon.gracias")}
          </p>
        </div>
      )}
    </section>
  );
}
