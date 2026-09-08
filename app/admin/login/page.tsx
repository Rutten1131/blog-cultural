"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/lib/actions/authAdmin";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState
  );

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner">
            🏛️
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Panel de Moderación
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Agenda Cultural de Loja · Red Interinstitucional
          </p>
        </div>

        {state.error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-purple-500 dark:focus:ring-purple-900"
            />
            <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
              Ingresa tu clave de acceso institucional o de administración general.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            {isPending ? "Verificando acceso..." : "Ingresar al Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
