"use client";

import { useActionState, useState, useEffect } from "react";
import { crearEvento, type CrearEventoState } from "@/lib/actions/crearEvento";
import { MultiMediaUploader } from "@/components/MultiMediaUploader";
import { PublicarPreviewCard } from "@/components/PublicarPreviewCard";

const initialState: CrearEventoState = { success: false };
const STORAGE_KEY = "agenda_cultural_publicar_draft_v1";

interface InstitucionOption {
  id: number;
  nombre: string;
}

export function PublicarForm({
  instituciones = [],
}: {
  instituciones?: InstitucionOption[];
}) {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(""); // datetime-local: "YYYY-MM-DDTHH:mm"
  const [fechaFin, setFechaFin] = useState(""); // datetime-local: "YYYY-MM-DDTHH:mm"
  const [lugar, setLugar] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [nombreGestor, setNombreGestor] = useState("");
  const [institucionRelacionada, setInstitucionRelacionada] = useState("");
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  const [state, formAction, isPending] = useActionState(
    crearEvento,
    initialState
  );

  // 1. Cargar borrador desde localStorage al montar el componente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nombre) setNombre(parsed.nombre);
        if (parsed.fecha) setFecha(parsed.fecha);
        if (parsed.fechaFin) setFechaFin(parsed.fechaFin);
        if (parsed.lugar) setLugar(parsed.lugar);
        if (parsed.descripcion) setDescripcion(parsed.descripcion);
        if (Array.isArray(parsed.imagenes)) setImagenes(parsed.imagenes);
        if (Array.isArray(parsed.videoUrls)) setVideoUrls(parsed.videoUrls);
        if (parsed.nombreGestor) setNombreGestor(parsed.nombreGestor);
        if (parsed.institucionRelacionada) setInstitucionRelacionada(parsed.institucionRelacionada);
      }
    } catch (err) {
      console.error("Error cargando borrador de localStorage:", err);
    } finally {
      setHasLoadedDraft(true);
    }
  }, []);

  // 2. Guardar automáticamente en localStorage cuando cualquier campo cambie
  useEffect(() => {
    if (!hasLoadedDraft) return;

    try {
      const dataToSave = {
        nombre,
        fecha,
        fechaFin,
        lugar,
        descripcion,
        imagenes,
        videoUrls,
        nombreGestor,
        institucionRelacionada,
      };

      // Si todos los campos están vacíos, no hace falta guardar
      const hasAnyContent =
        nombre || fecha || fechaFin || lugar || descripcion ||
        imagenes.length > 0 || videoUrls.length > 0 || nombreGestor || institucionRelacionada;

      if (hasAnyContent) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      }
    } catch (err) {
      console.error("Error guardando borrador en localStorage:", err);
    }
  }, [
    nombre,
    fecha,
    fechaFin,
    lugar,
    descripcion,
    imagenes,
    videoUrls,
    nombreGestor,
    institucionRelacionada,
    hasLoadedDraft,
  ]);

  // 3. Limpiar borrador al enviar con éxito
  useEffect(() => {
    if (state.success) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [state.success]);

  // Función para reiniciar/limpiar borrador manualmente si el usuario lo desea
  const handleLimpiarBorrador = () => {
    if (window.confirm("¿Seguro que deseas borrar el borrador y limpiar el formulario?")) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      setNombre("");
      setFecha("");
      setFechaFin("");
      setLugar("");
      setDescripcion("");
      setImagenes([]);
      setVideoUrls([]);
      setNombreGestor("");
      setInstitucionRelacionada("");
    }
  };

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
        {/* Barra de estado de borrador */}
        {hasLoadedDraft && (nombre || descripcion || imagenes.length > 0) && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-purple-50/80 border border-purple-200/80 px-3.5 py-2 text-xs text-purple-900 dark:bg-purple-950/30 dark:border-purple-900/50 dark:text-purple-200">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
              Borrador guardado automáticamente en tu navegador
            </span>
            <button
              type="button"
              onClick={handleLimpiarBorrador}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer shrink-0"
            >
              Limpiar borrador
            </button>
          </div>
        )}

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

        {/* Fechas de Inicio y Finalización */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Fecha y hora de Inicio */}
          <div>
            <label
              htmlFor="fecha"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Fecha y hora de inicio <span className="text-red-500">*</span>
            </label>
            <input
              id="fecha"
              name="fecha"
              type="datetime-local"
              required
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                if (fechaFin && e.target.value > fechaFin) {
                  setFechaFin("");
                }
              }}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Horario de Loja (UTC-5).
            </p>
          </div>

          {/* Fecha y hora de Finalización (Opcional) */}
          <div>
            <label
              htmlFor="fechaFin"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Fecha de finalización <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">(opcional)</span>
            </label>
            <input
              id="fechaFin"
              name="fechaFin"
              type="datetime-local"
              value={fechaFin}
              min={fecha || undefined}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Para festivales o eventos de varios días.
            </p>
          </div>
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

        {/* Multimedia del evento (Galería de imágenes + Enlaces de Video/Redes) */}
        <MultiMediaUploader
          imagenes={imagenes}
          onImagenesChange={setImagenes}
          videoUrls={videoUrls}
          onVideoUrlsChange={setVideoUrls}
        />
        <input type="hidden" name="multimedia" value={JSON.stringify(imagenes)} />
        <input type="hidden" name="videoUrl" value={JSON.stringify(videoUrls)} />
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
            <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            id="institucionRelacionada"
            name="institucionRelacionada"
            required
            value={institucionRelacionada}
            onChange={(e) => setInstitucionRelacionada(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          >
            <option value="" disabled>Selecciona una institución...</option>
            {instituciones.map((inst) => (
              <option key={inst.id} value={inst.nombre}>
                {inst.nombre}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Obligatorio. Notifica y asigna la revisión directamente a los encargados oficiales de la institución.
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
          fechaFin={fechaFin}
          lugar={lugar}
          descripcion={descripcion}
          imagenUrl={imagenes[0] || ""}
          nombreGestor={nombreGestor}
        />
      </div>
    </div>
  );
}