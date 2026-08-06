"use client";

import { useActionState, useState } from "react";
import { crearEvento, type CrearEventoState } from "@/lib/actions/crearEvento";
import { ImageUploader } from "@/components/ImageUploader";

const initialState: CrearEventoState = { success: false };

export function PublicarForm() {
  const [imagenUrl, setImagenUrl] = useState("");
  const [state, formAction, isPending] = useActionState(
    crearEvento,
    initialState
  );

  // Pantalla de confirmación
  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-900">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
          ¡Evento recibido!
        </h2>
        <p className="mt-2 text-emerald-700 dark:text-emerald-300">
          Tu evento fue recibido y será revisado antes de publicarse en la
          agenda.
        </p>
        <a
          href="/publicar"
          className="mt-6 inline-block rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Publicar otro evento
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Error global */}
      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      {/* Nombre del evento */}
      <div>
        <label
          htmlFor="nombre"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nombre del evento <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          placeholder="Ej: Noche de Jazz en el Parque Central"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
        />
      </div>

      {/* Fecha */}
      <div>
        <label
          htmlFor="fecha"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Fecha <span className="text-red-500">*</span>
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          required
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
        />
      </div>

      {/* Lugar */}
      <div>
        <label
          htmlFor="lugar"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Lugar <span className="text-red-500">*</span>
        </label>
        <input
          id="lugar"
          name="lugar"
          type="text"
          required
          placeholder="Ej: Teatro Bolívar, calle Bolívar y Sucre"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
        />
      </div>

      {/* Descripción */}
      <div>
        <label
          htmlFor="descripcion"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          rows={5}
          placeholder="Describí tu evento: qué es, quién participa, a quién está dirigido..."
          className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
        />
      </div>

      {/* Imagen / Video del evento */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Imagen o Afiche del evento{" "}
          <span className="font-normal text-zinc-400">(opcional)</span>
        </label>
        <ImageUploader value={imagenUrl} onChange={setImagenUrl} />
      </div>

      {/* Nombre del gestor */}
      <div>
        <label
          htmlFor="nombreGestor"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Tu nombre o el de tu organización{" "}
          <span className="text-red-500">*</span>
        </label>
        <input
          id="nombreGestor"
          name="nombreGestor"
          type="text"
          required
          placeholder="Ej: Fundación Cultural Loja"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPending ? "Enviando..." : "Enviar evento para revisión"}
      </button>

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
        Tu evento será revisado por nuestro equipo antes de publicarse.
      </p>
    </form>
  );
}
