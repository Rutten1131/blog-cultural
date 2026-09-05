"use client";

import { useState, useMemo } from "react";
import { EventoCard } from "./evento-card";
import { EventoAdminRow } from "./evento-admin-row";
import { AdminNotificaciones } from "./admin-notificaciones";
import { logoutAdmin } from "@/lib/actions/authAdmin";

interface Categoria {
  id: number;
  nombre: string;
  slug: string;
}

interface Zona {
  id: number;
  nombre: string;
  tipo: string;
}

interface EventoItem {
  id: number;
  nombre: string;
  fecha: Date;
  fechaFin?: Date | null;
  lugar: string;
  descripcion: string;
  nombreGestor: string;
  institucionRelacionada?: string | null;
  imagenUrl: string | null;
  confianzaClasificacion: number | null;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  categoriaId: number | null;
  zonaId: number | null;
  createdAt: Date;
  categoria?: { nombre: string } | null;
  zona?: { nombre: string } | null;
}

interface RecomendacionItem {
  id: number;
  mensaje: string;
  contacto: string | null;
  createdAt: Date;
}

interface NumeroNotificacionItem {
  id: number;
  nombre: string;
  numero: string;
  activo: boolean;
  createdAt: Date;
}

export function AdminDashboardClient({
  eventosPendientes,
  todosLosEventos,
  recomendaciones,
  numerosNotificacion,
  categorias,
  zonas,
}: {
  eventosPendientes: EventoItem[];
  todosLosEventos: EventoItem[];
  recomendaciones: RecomendacionItem[];
  numerosNotificacion: NumeroNotificacionItem[];
  categorias: Categoria[];
  zonas: Zona[];
}) {
  const [activeTab, setActiveTab] = useState<"pendientes" | "todos" | "buzon" | "notificaciones">("pendientes");

  // Filtros para la pestaña "Todos los Eventos"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterCategoria, setFilterCategoria] = useState<string>("TODOS");
  const [filterZona, setFilterZona] = useState<string>("TODOS");

  const eventosFiltrados = useMemo(() => {
    return todosLosEventos.filter((ev) => {
      // Búsqueda por texto (nombre, lugar, gestor, institución)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesQuery =
          ev.nombre.toLowerCase().includes(query) ||
          ev.lugar.toLowerCase().includes(query) ||
          ev.nombreGestor.toLowerCase().includes(query) ||
          (ev.institucionRelacionada && ev.institucionRelacionada.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // Filtro por Estado
      if (filterEstado !== "TODOS" && ev.estado !== filterEstado) {
        return false;
      }

      // Filtro por Categoría
      if (filterCategoria !== "TODOS" && String(ev.categoriaId) !== filterCategoria) {
        return false;
      }

      // Filtro por Zona
      if (filterZona !== "TODOS" && String(ev.zonaId) !== filterZona) {
        return false;
      }

      return true;
    });
  }, [todosLosEventos, searchTerm, filterEstado, filterCategoria, filterZona]);

  const totalAprobados = todosLosEventos.filter((e) => e.estado === "APROBADO").length;
  const totalRechazados = todosLosEventos.filter((e) => e.estado === "RECHAZADO").length;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {/* Header Superior Moderno */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md text-lg">
              🛡️
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Panel de Administración
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                Agenda Cultural Loja · Control y Moderación Total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="text-xs font-semibold text-zinc-600 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 transition-colors hidden sm:inline-block"
            >
              🌐 Ver sitio web
            </a>
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Navegación por Pestañas (Tabs) */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6">
        <div className="mx-auto max-w-6xl flex items-center gap-2 sm:gap-4 overflow-x-auto py-3 no-scrollbar">
          <button
            onClick={() => setActiveTab("pendientes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "pendientes"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>⏳ Moderar Pendientes</span>
            {eventosPendientes.length > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  activeTab === "pendientes"
                    ? "bg-white text-purple-700"
                    : "bg-amber-500 text-white"
                }`}
              >
                {eventosPendientes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("todos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "todos"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>🗂️ Todos los Eventos</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                activeTab === "todos"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {todosLosEventos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("buzon")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "buzon"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>📬 Buzón de Sugerencias</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                activeTab === "buzon"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {recomendaciones.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("notificaciones")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "notificaciones"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>📱 Alertas WhatsApp</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                activeTab === "notificaciones"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {numerosNotificacion.length}
            </span>
          </button>
        </div>
      </div>

      {/* Contenedor Principal de la Pestaña Activa */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ===================== TAB 1: PENDIENTES ===================== */}
        {activeTab === "pendientes" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  Eventos Pendientes de Aprobación
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Revisa los aportes enviados por la comunidad, ajusta su categoría/zona y publícalos o descártalos.
                </p>
              </div>
            </div>

            {eventosPendientes.length === 0 ? (
              <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  ¡Bandeja al día!
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  No hay publicaciones pendientes de revisión en este momento.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {eventosPendientes.map((evento) => (
                  <EventoCard
                    key={evento.id}
                    evento={evento}
                    categorias={categorias}
                    zonas={zonas}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: TODOS LOS EVENTOS ===================== */}
        {activeTab === "todos" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Gestor Completo de Eventos
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Busca, filtra, edita detalles o elimina cualquier evento registrado en la plataforma.
              </p>

              {/* Badges de conteo */}
              <div className="flex flex-wrap gap-2.5 mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  ✅ {totalAprobados} aprobados
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  ⏳ {eventosPendientes.length} pendientes
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                  ❌ {totalRechazados} rechazados
                </span>
              </div>
            </div>

            {/* Barra de Búsqueda y Filtros */}
            <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Buscador */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                    🔍 Buscar
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Título, lugar, organizador..."
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Filtro Estado */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                    Estado
                  </label>
                  <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="TODOS">Todos los estados</option>
                    <option value="APROBADO">Aprobados</option>
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="RECHAZADO">Rechazados</option>
                  </select>
                </div>

                {/* Filtro Categoría */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                    Categoría
                  </label>
                  <select
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="TODOS">Todas las categorías</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Zona */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                    Zona
                  </label>
                  <select
                    value={filterZona}
                    onChange={(e) => setFilterZona(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="TODOS">Todas las zonas</option>
                    {zonas.map((z) => (
                      <option key={z.id} value={String(z.id)}>
                        {z.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botón reset filtros si hay alguno aplicado */}
              {(searchTerm || filterEstado !== "TODOS" || filterCategoria !== "TODOS" || filterZona !== "TODOS") && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Mostrando <strong className="text-zinc-900 dark:text-zinc-100">{eventosFiltrados.length}</strong> de {todosLosEventos.length} eventos
                  </span>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterEstado("TODOS");
                      setFilterCategoria("TODOS");
                      setFilterZona("TODOS");
                    }}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-bold"
                  >
                    ✕ Limpiar filtros
                  </button>
                </div>
              )}
            </div>

            {/* Listado de eventos */}
            {eventosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  No se encontraron eventos con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventosFiltrados.map((evento) => (
                  <EventoAdminRow
                    key={evento.id}
                    evento={evento}
                    categorias={categorias}
                    zonas={zonas}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: BUZÓN ===================== */}
        {activeTab === "buzon" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>📬</span> Buzón Ciudadano — Sugerencias ({recomendaciones.length})
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Aportes, opiniones y recomendaciones enviadas libremente por la comunidad desde la web.
              </p>
            </div>

            {recomendaciones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Aún no se han recibido sugerencias desde el buzón de la web.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recomendaciones.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col justify-between"
                  >
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed mb-4">
                      &ldquo;{rec.mensaje}&rdquo;
                    </p>
                    <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <span>
                        {rec.contacto ? (
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                            👤 {rec.contacto}
                          </span>
                        ) : (
                          <span className="italic">Anónimo</span>
                        )}
                      </span>
                      <span>
                        {new Date(rec.createdAt).toLocaleDateString("es-EC", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: ALERTAS NOTIFICACIONES ===================== */}
        {activeTab === "notificaciones" && (
          <div className="animate-fadeIn">
            <AdminNotificaciones numeros={numerosNotificacion} />
          </div>
        )}
      </main>
    </div>
  );
}
