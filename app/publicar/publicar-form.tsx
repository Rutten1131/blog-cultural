"use client";

import { useActionState, useState } from "react";
import { crearEvento, type CrearEventoState } from "@/lib/actions/crearEvento";
import { MultiMediaUploader } from "@/components/MultiMediaUploader";
import { PublicarPreviewCard } from "@/components/PublicarPreviewCard";

const initialState: CrearEventoState = { success: false };

export function PublicarForm() {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(""); // datetime-local: "YYYY-MM-DDTHH:mm"
  const [lugar, setLugar] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [nombreGestor, setNombreGestor] = useState("");

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
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
      {/* Formulario */}
      <form action={formAction} className="space-y-6 lg:col-span-7">
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
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Noche de Jazz en el Parque Central"
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          />
        </div>

        {/* Fecha y hora — REGLA TZ: datetime-local interpreta como hora de Loja */}
        <div>
          <label
            htmlFor="fecha"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Fecha y hora del evento <span className="text-red-500">*</span>
          </label>
          <input
            id="fecha"
            name="fecha"
            type="datetime-local"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Horario de Loja (UTC-5). Si no indicás hora, se interpreta como 12:00 del día seleccionado.
          </p>
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
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
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
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describí tu evento: qué es, quién participa, a quién está dirigido..."
            className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          />
        </div>

        {/* Multimedia del evento (Galería de imágenes + Enlace de Video) */}
        <MultiMediaUploader
          imagenes={imagenes}
          onImagenesChange={setImagenes}
          videoUrl={videoUrl}
          onVideoUrlChange={setVideoUrl}
        />
        <input type="hidden" name="multimedia" value={JSON.stringify(imagenes)} />
        <input type="hidden" name="videoUrl" value={videoUrl} />
        <input type="hidden" name="imagenUrl" value={imagenes[0] || ""} />

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
            value={nombreGestor}
            onChange={(e) => setNombreGestor(e.target.value)}
            placeholder="Ej: Fundación Cultural Loja"
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          />
        </div>

        {/* ¿Con qué institución o sector está relacionado? */}
        <div>
          <label
            htmlFor="institucionRelacionada"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            ¿Con qué institución o sector está relacionado tu evento?{" "}
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">(Opcional)</span>
          </label>
          <select
            id="institucionRelacionada"
            name="institucionRelacionada"
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          >
            <option value="">Seleccionar sector o institución...</option>
            <option value="Municipio de Loja">Municipio de Loja</option>
            <option value="Casa de la Cultura">Casa de la Cultura</option>
            <option value="Turismo">Turismo</option>
            <option value="Cultura y Patrimonio">Cultura y Patrimonio</option>
            <option value="Teatro / Artes Escénicas">Teatro / Artes Escénicas</option>
            <option value="Música / Orquesta">Música / Orquesta</option>
            <option value="Artes Plásticas / Visuales">Artes Plásticas / Visuales</option>
            <option value="Organización Independiente">Organización Independiente</option>
            <option value="Academia / Universidad">Academia / Universidad</option>
            <option value="Otro">Otro</option>
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Nos ayuda a clasificar y enrutar tu evento en la red cultural de la ciudad.
          </p>
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

      {/* Vista previa dinaminaria */}
      <div className="lg:col-span-5 lg:sticky lg:top-24">
        <PublicarPreviewCard
          nombre={nombre}
          fecha={fecha}
          lugar={lugar}
          descripcion={descripcion}
          imagenUrl={imagenes[0] || ""}
          nombreGestor={nombreGestor}
        />
      </div>
    </div>
  );
}