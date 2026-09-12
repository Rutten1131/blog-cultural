"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import {
  crearBannerHero,
  actualizarBannerHero,
  toggleBannerActivo,
  eliminarBannerHero,
} from "@/lib/actions/bannersAdmin";

export interface BannerHeroAdminItem {
  id: number;
  titulo: string;
  subtitulo: string | null;
  link: string;
  botonTexto: string;
  imagenDesktop: string;
  imagenMobile: string | null;
  orden: number;
  activo: boolean;
  createdAt: Date;
}

interface Props {
  banners: BannerHeroAdminItem[];
}

export function AdminBanners({ banners }: Props) {
  const [editingBanner, setEditingBanner] = useState<BannerHeroAdminItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgDesktop, setImgDesktop] = useState("");
  const [imgMobile, setImgMobile] = useState("");

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setImgDesktop("");
    setImgMobile("");
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (banner: BannerHeroAdminItem) => {
    setEditingBanner(banner);
    setImgDesktop(banner.imagenDesktop || "");
    setImgMobile(banner.imagenMobile || "");
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    let res;
    if (editingBanner) {
      res = await actualizarBannerHero(editingBanner.id, formData);
    } else {
      res = await crearBannerHero(formData);
    }

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      setEditingBanner(null);
    }
  };

  const handleToggle = async (id: number, activo: boolean) => {
    await toggleBannerActivo(id, activo);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este banner permanentemente?")) {
      await eliminarBannerHero(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <span>🖼️</span> Banners del Hero Principal
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Administra los banners panorámicos con efecto fade y llamadas a la acción que aparecen en la cabecera de la página principal.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo Banner
        </button>
      </div>

      {/* Grid de Banners Actuales */}
      {banners.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-2xl text-purple-600">
            🖼️
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No hay banners configurados</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-5">
            Actualmente la portada mostrará automáticamente los últimos eventos aprobados con imagen hasta que agregues tus banners personalizados.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-colors"
          >
            Crear mi primer banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`group flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm ${
                banner.activo
                  ? "border-zinc-200 dark:border-zinc-800"
                  : "border-zinc-200/60 dark:border-zinc-800/60 opacity-60"
              }`}
            >
              {/* Preview de imagen con overlay */}
              <div className="relative aspect-[16/7] w-full overflow-hidden bg-zinc-950">
                <img
                  src={banner.imagenDesktop}
                  alt={banner.titulo}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Badges superiores */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-black/60 backdrop-blur-md text-white border border-white/20">
                    Orden: #{banner.orden}
                  </span>
                  {banner.imagenMobile && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/80 text-white backdrop-blur-md">
                      📱 Móvil listo
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleToggle(banner.id, banner.activo)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                      banner.activo
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-zinc-600 hover:bg-zinc-500 text-white"
                    }`}
                  >
                    {banner.activo ? "● Activo" : "○ Pausado"}
                  </button>
                </div>

                {/* Título y botón dentro de la imagen preview */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="font-bold text-white text-base sm:text-lg line-clamp-1 drop-shadow">
                    {banner.titulo}
                  </h4>
                  {banner.subtitulo && (
                    <p className="text-xs text-white/80 line-clamp-1 drop-shadow">
                      {banner.subtitulo}
                    </p>
                  )}
                </div>
              </div>

              {/* Pie de datos y acciones */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-1 rounded-full">
                    📅 Acción: Ver el calendario (Popup)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="p-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                    title="Editar banner"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors"
                    title="Eliminar banner"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-1">
              {editingBanner ? "Editar Banner Hero" : "Nuevo Banner Hero"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              Configura el título y las imágenes (ordenador y móvil). El botón abrirá automáticamente el calendario cultural.
            </p>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Valores predeterminados ocultos para link y botonTexto */}
              <input type="hidden" name="link" value="/eventos" />
              <input type="hidden" name="botonTexto" value="Ver el calendario" />

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Título del Banner *
                </label>
                <input
                  type="text"
                  name="titulo"
                  required
                  defaultValue={editingBanner?.titulo ?? ""}
                  placeholder="Ej: Festival Internacional de Artes Vivas 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Subtítulo / Fechas / Lugar (Opcional)
                </label>
                <input
                  type="text"
                  name="subtitulo"
                  defaultValue={editingBanner?.subtitulo ?? ""}
                  placeholder="Ej: Del 15 al 25 de Noviembre • En todos los teatros de Loja"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Imagen Desktop (Ordenador) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  🖥️ Imagen Hero para Ordenador (Desktop - Panorámica recomendada 1920x600) *
                </label>
                <input type="hidden" name="imagenDesktop" value={imgDesktop} required />
                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50 dark:bg-zinc-800/50">
                  <ImageUploader value={imgDesktop} onChange={setImgDesktop} />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Se mostrará en pantallas medianas y grandes (computadoras, portátiles).
                </p>
              </div>

              {/* Imagen Mobile (Celular) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  📱 Imagen Hero para Celular (Móvil - Vertical / Pantalla completa)
                </label>
                <input type="hidden" name="imagenMobile" value={imgMobile} />
                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50 dark:bg-zinc-800/50">
                  <ImageUploader value={imgMobile} onChange={setImgMobile} />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Recomendada para teléfonos móviles. Si no se sube, se adaptará la versión de escritorio.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Orden de aparición
                  </label>
                  <input
                    type="number"
                    name="orden"
                    min="0"
                    defaultValue={editingBanner?.orden ?? 0}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    value="true"
                    defaultChecked={editingBanner ? editingBanner.activo : true}
                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="activo" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                    Publicar banner activo
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-purple-500/20"
                >
                  {loading ? "Guardando..." : editingBanner ? "Actualizar Banner" : "Crear Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
