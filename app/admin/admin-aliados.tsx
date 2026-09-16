"use client";

import { useState } from "react";
import { guardarAliado, toggleAliadoActivo, eliminarAliado } from "@/lib/actions/aliados";

export interface AliadoItem {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  ubicacion: string;
  mapaUrl?: string | null;
  rangoPrecio?: string | null;
  servicios?: string | null;
  cuartos?: string | null;
  telefono?: string | null;
  websiteUrl?: string | null;
  redesUrl?: string | null;
  imagenUrl?: string | null;
  destacado: boolean;
  activo: boolean;
  createdAt: Date;
}

export function AdminAliados({ initialAliados }: { initialAliados: AliadoItem[] }) {
  const [aliados, setAliados] = useState<AliadoItem[]>(initialAliados);
  const [editingAliado, setEditingAliado] = useState<Partial<AliadoItem> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    const data = {
      id: editingAliado?.id,
      nombre: form.get("nombre") as string,
      tipo: form.get("tipo") as any,
      descripcion: form.get("descripcion") as string,
      ubicacion: form.get("ubicacion") as string,
      mapaUrl: form.get("mapaUrl") as string,
      rangoPrecio: form.get("rangoPrecio") as string,
      servicios: form.get("servicios") as string,
      cuartos: form.get("cuartos") as string,
      telefono: form.get("telefono") as string,
      websiteUrl: form.get("websiteUrl") as string,
      redesUrl: form.get("redesUrl") as string,
      imagenUrl: form.get("imagenUrl") as string,
      destacado: form.get("destacado") === "on",
      activo: form.get("activo") === "on",
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
              setEditingAliado({
                nombre: "",
                tipo: "HOSPEDAJE",
                descripcion: "",
                ubicacion: "",
                rangoPrecio: "$30 - $50 / noche",
                servicios: "Wifi, Desayuno incluido, Parqueadero",
                cuartos: "Matrimonial, Doble, Suite",
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
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="HOSPEDAJE">🏨 Hospedaje / Hotel / Hostal</option>
                  <option value="GASTRONOMIA">🍽️ Gastronomía / Restaurante</option>
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
                  Ubicación física *
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Tipos de Habitaciones / Opciones
                </label>
                <input
                  name="cuartos"
                  defaultValue={editingAliado?.cuartos || ""}
                  placeholder="Ej: Matrimoniales, Suites con balcón, Familiares"
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
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

      {/* Lista de Aliados Registrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {aliados.map((aliado) => (
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
