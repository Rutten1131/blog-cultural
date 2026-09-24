"use client";

import { useRef, useState } from "react";
import { guardarAliado, toggleAliadoActivo, eliminarAliado } from "@/lib/actions/aliados";
import { parseImagenesHabitacion } from "@/lib/habitaciones";
import { uploadDirectToBunny } from "@/lib/uploadDirect";

/** Categoría / tipo de habitación tal como se edita en el formulario */
export interface HabitacionDraft {
  nombre: string;
  precio: string;
  caracteristicas: string;
  imagenes: string[];
}

/** Categoría tal como llega desde la base de datos (imagenes = string JSON) */
export interface HabitacionRow {
  id: number;
  nombre: string;
  precio: string | null;
  caracteristicas: string | null;
  imagenes: string | null;
  orden: number;
}

export interface AliadoItem {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  ubicacion: string;
  ubicacionLat?: number | null;
  ubicacionLng?: number | null;
  mapaUrl?: string | null;
  rangoPrecio?: string | null;
  servicios?: string | null;
  cuartos?: string | null;
  numeroCuartos?: number | null;
  estrellas?: number | null;
  telefono?: string | null;
  websiteUrl?: string | null;
  redesUrl?: string | null;
  imagenUrl?: string | null;
  destacado: boolean;
  activo: boolean;
  createdAt: Date;
  habitaciones?: HabitacionRow[];
}

/** Editor de galería de imágenes (carrusel) para una categoría de habitación */
function ImagenesHabitacionEditor({
  imagenes,
  onChange,
}: {
  imagenes: string[];
  onChange: (urls: string[]) => void;
}) {
  const [nuevaUrl, setNuevaUrl] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subirArchivos = async (files: FileList) => {
    setError(null);
    setSubiendo(true);
    const subidas: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("Solo se permiten imágenes.");
        continue;
      }
      try {
        subidas.push(await uploadDirectToBunny(file));
      } catch {
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (res.ok && data.url) subidas.push(data.url);
          else setError(`No se pudo subir ${file.name}`);
        } catch {
          setError(`No se pudo subir ${file.name}`);
        }
      }
    }

    if (subidas.length > 0) onChange([...imagenes, ...subidas]);
    setSubiendo(false);
  };

  const agregarUrl = () => {
    const url = nuevaUrl.trim();
    if (!url) return;
    if (imagenes.includes(url)) {
      setError("Esa imagen ya está en la galería.");
      return;
    }
    onChange([...imagenes, url]);
    setNuevaUrl("");
    setError(null);
  };

  const quitar = (idx: number) => onChange(imagenes.filter((_, i) => i !== idx));

  const mover = (idx: number, delta: number) => {
    const destino = idx + delta;
    if (destino < 0 || destino >= imagenes.length) return;
    const copia = [...imagenes];
    [copia[idx], copia[destino]] = [copia[destino], copia[idx]];
    onChange(copia);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
          🖼️ Imágenes del tipo de habitación{" "}
          <span className="text-neutral-500 font-normal normal-case">
            (se muestran en carrusel · {imagenes.length})
          </span>
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={subiendo}
          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/30 disabled:opacity-50 cursor-pointer"
        >
          {subiendo ? "Subiendo..." : "📤 Subir imágenes"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files?.length && subirArchivos(e.target.files)}
        />
      </div>

      {imagenes.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {imagenes.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative group h-20 rounded-lg overflow-hidden border border-white/10 bg-neutral-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
              <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => quitar(idx)}
                title="Eliminar imagen"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center opacity-90 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
              <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => mover(idx, -1)}
                  title="Mover antes"
                  className="w-5 h-5 rounded bg-black/70 text-white text-[10px] font-bold cursor-pointer"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => mover(idx, 1)}
                  title="Mover después"
                  className="w-5 h-5 rounded bg-black/70 text-white text-[10px] font-bold cursor-pointer"
                >
                  ›
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={nuevaUrl}
          onChange={(e) => setNuevaUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarUrl();
            }
          }}
          placeholder="Pegar URL de imagen y presionar +"
          className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
        />
        <button
          type="button"
          onClick={agregarUrl}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg cursor-pointer"
        >
          +
        </button>
      </div>

      {error && <p className="text-[11px] text-red-300">{error}</p>}
    </div>
  );
}

export function AdminAliados({ initialAliados }: { initialAliados: AliadoItem[] }) {
  const [aliados, setAliados] = useState<AliadoItem[]>(initialAliados);
  const [editingAliado, setEditingAliado] = useState<Partial<AliadoItem> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | "HOSPEDAJE" | "GASTRONOMIA" | "CAFETERIA" | "OTROS">("TODOS");
  // Tipo seleccionado en el formulario (para adaptar las etiquetas de categorías)
  const [tipoForm, setTipoForm] = useState<string>("HOSPEDAJE");
  const [habitaciones, setHabitaciones] = useState<HabitacionDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /** Convierte las filas de la BD al formato del editor (parseando el JSON de imágenes) */
  const cargarHabitacionesEditor = (aliado: Partial<AliadoItem>): HabitacionDraft[] =>
    (aliado.habitaciones || []).map((h) => ({
      nombre: h.nombre,
      precio: h.precio || "",
      caracteristicas: h.caracteristicas || "",
      imagenes: parseImagenesHabitacion(h.imagenes),
    }));

  const agregarHabitacion = () =>
    setHabitaciones((prev) => [
      ...prev,
      { nombre: "", precio: "", caracteristicas: "", imagenes: [] },
    ]);

  const actualizarHabitacion = (idx: number, campos: Partial<HabitacionDraft>) =>
    setHabitaciones((prev) => prev.map((h, i) => (i === idx ? { ...h, ...campos } : h)));

  const quitarHabitacion = (idx: number) =>
    setHabitaciones((prev) => prev.filter((_, i) => i !== idx));

  // ─── Separación por categoría ───
  const conteo = {
    TODOS: aliados.length,
    HOSPEDAJE: aliados.filter((a) => a.tipo === "HOSPEDAJE").length,
    GASTRONOMIA: aliados.filter((a) => a.tipo === "GASTRONOMIA").length,
    CAFETERIA: aliados.filter((a) => a.tipo === "CAFETERIA").length,
    OTROS: aliados.filter(
      (a) => !["HOSPEDAJE", "GASTRONOMIA", "CAFETERIA"].includes(a.tipo)
    ).length,
  };

  const aliadosFiltrados =
    filtroTipo === "TODOS"
      ? aliados
      : filtroTipo === "OTROS"
      ? aliados.filter((a) => !["HOSPEDAJE", "GASTRONOMIA", "CAFETERIA"].includes(a.tipo))
      : aliados.filter((a) => a.tipo === filtroTipo);

  const TABS: { id: typeof filtroTipo; etiqueta: string; activo: string }[] = [
    { id: "TODOS", etiqueta: "🗂️ Todos", activo: "bg-amber-500 text-black border-amber-500" },
    { id: "HOSPEDAJE", etiqueta: "🏨 Hospedaje / Hoteles", activo: "bg-purple-500 text-white border-purple-500" },
    { id: "GASTRONOMIA", etiqueta: "🍽️ Gastronomía / Restaurantes", activo: "bg-orange-500 text-white border-orange-500" },
    { id: "CAFETERIA", etiqueta: "☕ Cafeterías", activo: "bg-amber-700 text-white border-amber-700" },
    { id: "OTROS", etiqueta: "✨ Otros", activo: "bg-neutral-600 text-white border-neutral-600" },
  ];

  // Etiquetas de las categorías según el tipo elegido en el formulario
  const esGastronomico = tipoForm === "GASTRONOMIA" || tipoForm === "CAFETERIA";
  const tituloCategorias =
    tipoForm === "HOSPEDAJE"
      ? "🏨 Tipos de Habitaciones / Categorías"
      : tipoForm === "CAFETERIA"
      ? "☕ Especialidades de la Casa / Categorías"
      : "🍽️ Opciones del Menú / Categorías";
  const ayudaCategorias =
    tipoForm === "HOSPEDAJE"
      ? "Agregá cada categoría (Ej: Matrimonial, Suite, Familiar) con su precio, qué incluye y sus fotos."
      : "Agregá cada opción del menú (Ej: Almuerzo del día, Especialidades) con su precio, qué incluye y sus fotos.";
  const placeholderCategoria = esGastronomico
    ? "Ej: Almuerzo del día · Especialidad de la casa"
    : "Ej: Suite Ejecutiva con balcón colonial";

  const handleToggleActivo = async (id: number, current: boolean) => {
    try {
      await toggleAliadoActivo(id, !current);
      setAliados((prev) =>
        prev.map((a) => (a.id === id ? { ...a, activo: !current } : a))
      );
    } catch {
      alert("Error al cambiar estado");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este aliado comercial?")) return;
    try {
      await eliminarAliado(id);
      setAliados((prev) => prev.filter((a) => a.id !== id));
      setMsg({ type: "success", text: "Aliado eliminado correctamente" });
    } catch {
      alert("Error al eliminar aliado");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const form = new FormData(e.currentTarget);
    const latVal = form.get("ubicacionLat") as string;
    const lngVal = form.get("ubicacionLng") as string;
    const estrellasVal = form.get("estrellas") as string;
    const numCuartosVal = form.get("numeroCuartos") as string;

    const data = {
      id: editingAliado?.id,
      nombre: form.get("nombre") as string,
      tipo: form.get("tipo") as any,
      descripcion: form.get("descripcion") as string,
      ubicacion: form.get("ubicacion") as string,
      ubicacionLat: latVal ? parseFloat(latVal) : null,
      ubicacionLng: lngVal ? parseFloat(lngVal) : null,
      mapaUrl: form.get("mapaUrl") as string,
      rangoPrecio: form.get("rangoPrecio") as string,
      servicios: form.get("servicios") as string,
      cuartos: form.get("cuartos") as string,
      numeroCuartos: numCuartosVal ? parseInt(numCuartosVal, 10) : null,
      estrellas: estrellasVal ? parseInt(estrellasVal, 10) : null,
      telefono: form.get("telefono") as string,
      websiteUrl: form.get("websiteUrl") as string,
      redesUrl: form.get("redesUrl") as string,
      imagenUrl: form.get("imagenUrl") as string,
      destacado: form.get("destacado") === "on",
      activo: form.get("activo") === "on",
      habitaciones: habitaciones.map((h) => ({
        nombre: h.nombre,
        precio: h.precio,
        caracteristicas: h.caracteristicas,
        imagenes: h.imagenes,
      })),
    };

    try {
      await guardarAliado(data);
      setMsg({
        type: "success",
        text: editingAliado?.id ? "Aliado actualizado con éxito" : "Aliado registrado con éxito",
      });
      setIsCreating(false);
      setEditingAliado(null);
      // Actualizar vista localmente
      window.location.reload();
    } catch {
      setMsg({ type: "error", text: "Hubo un error al guardar los datos" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con Botón Crear */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🤝</span> Aliados Comerciales y Patrocinadores
          </h2>
          <p className="text-sm text-neutral-400">
            Gestiona hoteles, hostales, gastronomía y servicios. El Asistente IA recomendará estos aliados con tarjetas interactivas e-commerce cuando los visitantes pregunten dónde hospedarse o comer.
          </p>
        </div>
        {!isCreating && !editingAliado && (
          <button
            onClick={() => {
              setIsCreating(true);
              setTipoForm("HOSPEDAJE");
              setHabitaciones([]);
              setEditingAliado({
                nombre: "",
                tipo: "HOSPEDAJE",
                descripcion: "",
                ubicacion: "",
                rangoPrecio: "$30 - $50 / noche",
                servicios: "Wifi, Desayuno incluido, Parqueadero",
                cuartos: "Matrimonial, Doble, Suite",
                numeroCuartos: 10,
                estrellas: 3,
                telefono: "5939",
                websiteUrl: "",
                redesUrl: "",
                imagenUrl: "",
                destacado: true,
                activo: true,
              });
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>➕</span> Nuevo Aliado
          </button>
        )}
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            msg.type === "success"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Modal / Formulario Crear o Editar */}
      {(isCreating || editingAliado) && (
        <div className="bg-neutral-900 border border-amber-500/30 p-6 rounded-2xl shadow-2xl relative">
          <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-amber-400">
              {editingAliado?.id ? "✏️ Editar Aliado Comercial" : "✨ Registrar Nuevo Aliado Comercial"}
            </h3>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingAliado(null);
              }}
              className="text-neutral-400 hover:text-white text-sm px-3 py-1 bg-white/5 rounded-lg"
            >
              ✕ Cancelar
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Nombre del Aliado / Hotel / Negocio *
                </label>
                <input
                  name="nombre"
                  required
                  defaultValue={editingAliado?.nombre || ""}
                  placeholder="Ej: Hotel Gran Victoria"
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Categoría / Tipo
                </label>
                <select
                  name="tipo"
                  defaultValue={editingAliado?.tipo || "HOSPEDAJE"}
                  onChange={(e) => setTipoForm(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="HOSPEDAJE">🏨 Hospedaje / Hotel / Hostal</option>
                  <option value="GASTRONOMIA">🍽️ Gastronomía / Restaurante</option>
                  <option value="CAFETERIA">☕ Cafetería / Café de especialidad</option>
                  <option value="EXPERIENCIA">🎒 Experiencia Turística / Tour</option>
                  <option value="TRANSPORTE">🚐 Transporte / Taxi</option>
                  <option value="COMERCIO">🛍️ Comercio / Tienda</option>
                  <option value="OTRO">✨ Otro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Descripción Corta & Atractiva *
                </label>
                <textarea
                  name="descripcion"
                  required
                  rows={2}
                  defaultValue={editingAliado?.descripcion || ""}
                  placeholder="Ej: Acogedor hotel boutique en el centro de Loja con habitaciones de lujo y desayuno de cortesía..."
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Ubicación física / Dirección *
                </label>
                <input
                  name="ubicacion"
                  required
                  defaultValue={editingAliado?.ubicacion || ""}
                  placeholder="Ej: Bernardo Valdivieso y Rocafuerte, Loja"
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Link de Google Maps
                </label>
                <input
                  name="mapaUrl"
                  defaultValue={editingAliado?.mapaUrl || ""}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Coordenadas GPS para Recomendación por Proximidad en Chatbot */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1 flex items-center justify-between">
                    <span>📍 Latitud (GPS)</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Ej: -3.9931</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="ubicacionLat"
                    defaultValue={editingAliado?.ubicacionLat ?? ""}
                    placeholder="-3.99313"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1 flex items-center justify-between">
                    <span>📍 Longitud (GPS)</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Ej: -79.2042</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="ubicacionLng"
                    defaultValue={editingAliado?.ubicacionLng ?? ""}
                    placeholder="-79.20422"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="sm:col-span-2 text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <span className="text-amber-400">💡</span>
                  <span>
                    El <strong>Chatbot IA</strong> usará estas coordenadas para recomendar este aliado comercial a los visitantes que se encuentren cerca de él en tiempo real.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Rango de Precios
                </label>
                <input
                  name="rangoPrecio"
                  defaultValue={editingAliado?.rangoPrecio || ""}
                  placeholder="Ej: $35 - $60 / noche"
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Servicios y Comodidades
                </label>
                <input
                  name="servicios"
                  defaultValue={editingAliado?.servicios || ""}
                  placeholder="Ej: Wifi fibra óptica, Desayuno buffet, Parqueadero privado"
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* ─── CATEGORÍAS / TIPOS DE HABITACIÓN (precio, qué tiene e imágenes en carrusel) ─── */}
              <input type="hidden" name="cuartos" defaultValue={editingAliado?.cuartos || ""} />
              <div className="md:col-span-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300">
                      {tituloCategorias}
                    </label>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {ayudaCategorias} El Chatbot las muestra en carrusel dentro de la ficha del aliado.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={agregarHabitacion}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shrink-0 cursor-pointer"
                  >
                    ➕ Agregar categoría
                  </button>
                </div>

                {habitaciones.length === 0 && (
                  <p className="text-[11px] text-neutral-400 bg-neutral-950/60 border border-dashed border-white/10 rounded-xl p-3 text-center">
                    Aún no hay categorías. Presioná <strong className="text-amber-300">“Agregar categoría”</strong> para
                    cargar los tipos de habitación con su precio y fotos.
                  </p>
                )}

                {habitaciones.map((hab, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-950/70 border border-white/10 rounded-xl p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        Categoría #{idx + 1}
                        {hab.nombre.trim() && (
                          <span className="text-neutral-400 font-normal normal-case"> · {hab.nombre}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => quitarHabitacion(idx)}
                        title="Eliminar esta categoría"
                        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[11px] font-bold rounded-lg border border-red-500/20 cursor-pointer"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                          Nombre del tipo *
                        </label>
                        <input
                          value={hab.nombre}
                          onChange={(e) => actualizarHabitacion(idx, { nombre: e.target.value })}
                          placeholder={placeholderCategoria}
                          className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                          Precio de esta categoría
                        </label>
                        <input
                          value={hab.precio}
                          onChange={(e) => actualizarHabitacion(idx, { precio: e.target.value })}
                          placeholder="Ej: $65 / noche · $45 por persona"
                          className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                          ¿Qué tiene? (comodidades de esta categoría)
                        </label>
                        <textarea
                          rows={2}
                          value={hab.caracteristicas}
                          onChange={(e) => actualizarHabitacion(idx, { caracteristicas: e.target.value })}
                          placeholder="Ej: Cama King, jacuzzi, balcón con vista al cerro, desayuno incluido, aire acondicionado"
                          className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <ImagenesHabitacionEditor
                      imagenes={hab.imagenes}
                      onChange={(urls) => actualizarHabitacion(idx, { imagenes: urls })}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1 flex items-center justify-between">
                    <span>🔢 Cantidad de Habitaciones</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Número entero</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="numeroCuartos"
                    defaultValue={editingAliado?.numeroCuartos ?? ""}
                    placeholder="Ej: 24"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1 flex items-center justify-between">
                    <span>⭐ Estrellas / Categoría</span>
                    <span className="text-[10px] text-neutral-400 font-normal">1 a 5</span>
                  </label>
                  <select
                    name="estrellas"
                    defaultValue={editingAliado?.estrellas ?? 3}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="1">★ 1 estrella</option>
                    <option value="2">★★ 2 estrellas</option>
                    <option value="3">★★★ 3 estrellas</option>
                    <option value="4">★★★★ 4 estrellas</option>
                    <option value="5">★★★★★ 5 estrellas (Lujo)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <span className="text-amber-400">💡</span>
                  <span>
                    Las <strong className="text-amber-300">estrellas</strong>, la <strong className="text-amber-300">cantidad de habitaciones</strong>, precios, servicios y tipos de cuarto se muestran cuando el visitante pulsa <strong className="text-amber-300">&quot;Háblame de este hotel&quot;</strong> en el Chatbot.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  WhatsApp / Teléfono (Sin + ni espacios)
                </label>
                <input
                  name="telefono"
                  defaultValue={editingAliado?.telefono || ""}
                  placeholder="Ej: 593991234567"
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Sitio Web o Enlace de Reserva
                </label>
                <input
                  name="websiteUrl"
                  defaultValue={editingAliado?.websiteUrl || ""}
                  placeholder="https://..."
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Red Social (Instagram / Facebook / TikTok)
                </label>
                <input
                  name="redesUrl"
                  defaultValue={editingAliado?.redesUrl || ""}
                  placeholder="https://instagram.com/..."
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  URL de Imagen / Foto Representativa
                </label>
                <input
                  name="imagenUrl"
                  defaultValue={editingAliado?.imagenUrl || ""}
                  placeholder="https://..."
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-200">
                  <input
                    type="checkbox"
                    name="destacado"
                    defaultChecked={editingAliado?.destacado ?? true}
                    className="rounded accent-amber-500"
                  />
                  ⭐ Destacado (prioridad alta en el Chatbot)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-200">
                  <input
                    type="checkbox"
                    name="activo"
                    defaultChecked={editingAliado?.activo ?? true}
                    className="rounded accent-emerald-500"
                  />
                  🟢 Activo (disponible para el público)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingAliado(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl shadow-lg transition-all"
              >
                {loading ? "Guardando..." : "Guardar Aliado"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Separación por categoría: hospedaje / restaurantes / cafeterías */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFiltroTipo(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              filtroTipo === tab.id
                ? tab.activo
                : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10"
            }`}
          >
            {tab.etiqueta}
            <span className="ml-1.5 opacity-70">({conteo[tab.id]})</span>
          </button>
        ))}
      </div>

      {/* Lista de Aliados Registrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {aliadosFiltrados.map((aliado) => (
          <div
            key={aliado.id}
            className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
              aliado.activo
                ? "bg-neutral-900/80 border-white/10 hover:border-amber-500/40"
                : "bg-neutral-950/60 border-red-500/20 opacity-60"
            }`}
          >
            {/* Foto de portada */}
            <div className="relative h-44 w-full bg-neutral-800 overflow-hidden">
              {aliado.imagenUrl ? (
                <img
                  src={aliado.imagenUrl}
                  alt={aliado.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-3xl text-neutral-600">
                  🏨
                </div>
              )}
              <div className="absolute top-2 left-2 flex gap-1.5">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-black/70 backdrop-blur-md text-amber-400 border border-amber-500/30">
                  {aliado.tipo}
                </span>
                {aliado.destacado && (
                  <span className="px-2 py-1 text-xs font-bold rounded-lg bg-amber-500 text-black">
                    ⭐ TOP
                  </span>
                )}
              </div>
              <button
                onClick={() => handleToggleActivo(aliado.id, aliado.activo)}
                className={`absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ${
                  aliado.activo
                    ? "bg-emerald-500/90 text-white"
                    : "bg-neutral-700/90 text-neutral-300"
                }`}
              >
                {aliado.activo ? "Activo" : "Pausado"}
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-white text-base leading-snug">{aliado.nombre}</h4>
                {(aliado.estrellas != null || aliado.numeroCuartos != null) && (
                  <div className="flex items-center gap-2 mt-1">
                    {aliado.estrellas != null && (
                      <span
                        className="text-amber-400 text-xs tracking-tight"
                        title={`${aliado.estrellas} estrellas`}
                      >
                        {"★".repeat(Math.min(5, Math.max(1, aliado.estrellas)))}
                        <span className="text-neutral-600">
                          {"★".repeat(5 - Math.min(5, Math.max(1, aliado.estrellas)))}
                        </span>
                      </span>
                    )}
                    {aliado.numeroCuartos != null && aliado.tipo === "HOSPEDAJE" && (
                      <span className="text-[11px] text-neutral-400 font-medium">
                        🛏️ {aliado.numeroCuartos} habitaciones
                      </span>
                    )}
                    {aliado.habitaciones && aliado.habitaciones.length > 0 && (
                      <span className="text-[11px] text-amber-300 font-medium">
                        🏨 {aliado.habitaciones.length} categorías
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{aliado.descripcion}</p>
                <div className="mt-2.5 space-y-1 text-xs text-neutral-300">
                  <p className="flex items-center gap-1.5 text-neutral-300">
                    <span>📍</span> {aliado.ubicacion}
                  </p>
                  {aliado.rangoPrecio && (
                    <p className="flex items-center gap-1.5 text-amber-300 font-medium">
                      <span>🏷️</span> {aliado.rangoPrecio}
                    </p>
                  )}
                  {aliado.servicios && (
                    <p className="flex items-center gap-1.5 text-neutral-400 truncate">
                      <span>✨</span> {aliado.servicios}
                    </p>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  {aliado.telefono && (
                    <a
                      href={`https://wa.me/${aliado.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs rounded-lg flex items-center gap-1"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {aliado.mapaUrl && (
                    <a
                      href={aliado.mapaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs rounded-lg flex items-center gap-1"
                    >
                      🗺️ Mapa
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingAliado(aliado);
                      setTipoForm(aliado.tipo);
                      setHabitaciones(cargarHabitacionesEditor(aliado));
                      setIsCreating(false);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg text-sm"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(aliado.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
