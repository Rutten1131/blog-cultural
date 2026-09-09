"use client";

import { useState, useMemo } from "react";
import { EventoCard } from "./evento-card";
import { EventoAdminRow } from "./evento-admin-row";
import { AdminNotificaciones } from "./admin-notificaciones";
import { AdminInstituciones } from "./admin-instituciones";
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
  slug: string;
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
  institucionId?: number | null;
  institucion?: { nombre: string } | null;
  createdAt: Date;
}

interface InstitucionItem {
  id: number;
  nombre: string;
  slug: string;
  password: string;
  activa: boolean;
  createdAt: Date;
}

interface SessionData {
  role: "SUPERADMIN" | "INSTITUCION";
  nombre: string;
  institucionId?: number;
  slug?: string;
}

export function AdminDashboardClient({
  session,
  eventosPendientes,
  todosLosEventos,
  recomendaciones,
  numerosNotificacion,
  instituciones,
  categorias,
  zonas,
}: {
  session: SessionData;
  eventosPendientes: EventoItem[];
  todosLosEventos: EventoItem[];
  recomendaciones: RecomendacionItem[];
  numerosNotificacion: NumeroNotificacionItem[];
  instituciones: InstitucionItem[];
  categorias: Categoria[];
  zonas: Zona[];
}) {
  const esSuperadmin = session.role === "SUPERADMIN";

  const [activeTab, setActiveTab] = useState<
    "pendientes" | "todos" | "buzon" | "notificaciones" | "instituciones"
  >("pendientes");

  // Control de acordeón único para moderar pendientes (uno a la vez)
  const [openPendienteId, setOpenPendienteId] = useState<number | null>(
    eventosPendientes[0]?.id ?? null
  );

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
              {esSuperadmin ? "🛡️" : "🏛️"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Panel de Administración
                </h1>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  esSuperadmin
                    ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                }`}>
                  {esSuperadmin ? "Superadmin General" : session.nombre}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                {esSuperadmin
                  ? "Control Total · Agenda Cultural de Loja"
                  : `Gestión exclusiva asignada a: ${session.nombre}`}
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

          {/* Buzón de Sugerencias: SOLO SUPERADMIN GENERAL */}
          {esSuperadmin && (
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
          )}

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

          {/* Gestión de Instituciones y Contraseñas: SOLO SUPERADMIN */}
          {esSuperadmin && (
            <button
              onClick={() => setActiveTab("instituciones")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "instituciones"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>🏛️ Cuentas Institucionales</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  activeTab === "instituciones"
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {instituciones.length}
              </span>
            </button>
          )}
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
                  {esSuperadmin
                    ? "Revisa los aportes enviados por la comunidad, clasifícalos y publícalos o descártalos."
                    : `Revisa los eventos enviados para ${session.nombre}.`}
                </p>
              </div>
              <span className="self-start sm:self-auto rounded-full bg-purple-100 dark:bg-purple-950/60 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                {eventosPendientes.length}{" "}
                {eventosPendientes.length === 1 ? "pendiente" : "pendientes"}
              </span>
            </div>

            {eventosPendientes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                <span className="text-3xl">✨</span>
                <h3 className="mt-2 text-base font-bold text-zinc-800 dark:text-zinc-200">
                  Todo al día
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  No hay eventos pendientes de revisión en este momento.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {eventosPendientes.map((evento) => (
                  <EventoCard
                    key={evento.id}
                    evento={evento}
                    categorias={categorias}
                    zonas={zonas}
                    isOpen={openPendienteId === evento.id}
                    onToggle={() =>
                      setOpenPendienteId((prev) =>
                        prev === evento.id ? null : evento.id
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: TODOS LOS EVENTOS ===================== */}
        {activeTab === "todos" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  Gestor de Eventos
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {esSuperadmin
                    ? "Edición integral de todos los eventos, fechas, descripciones y estados."
                    : `Historial y edición de los eventos correspondientes a ${session.nombre}.`}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 border border-emerald-200 dark:border-emerald-800">
                  🟢 {totalAprobados} Aprobados
                </span>
                <span className="rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-3 py-1.5 border border-amber-200 dark:border-amber-800">
                  ⏳ {eventosPendientes.length} Pendientes
                </span>
                <span className="rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-3 py-1.5 border border-rose-200 dark:border-rose-800">
                  🔴 {totalRechazados} Rechazados
                </span>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Nombre, lugar o gestor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Estado
                </label>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="APROBADO">Aprobados</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="RECHAZADO">Rechazados</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Categoría
                </label>
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="TODOS">Todas las Categorías</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Zona / Parroquia
                </label>
                <select
                  value={filterZona}
                  onChange={(e) => setFilterZona(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="TODOS">Todas las Zonas</option>
                  {zonas.map((z) => (
                    <option key={z.id} value={String(z.id)}>
                      {z.nombre} ({z.tipo})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Listado de Filas de Eventos */}
            {eventosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                <span className="text-3xl">🔍</span>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
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

        {/* ===================== TAB 3: BUZÓN (SOLO SUPERADMIN) ===================== */}
        {esSuperadmin && activeTab === "buzon" && (
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
            <AdminNotificaciones
              numeros={numerosNotificacion}
              instituciones={instituciones}
              esSuperadmin={esSuperadmin}
            />
          </div>
        )}

        {/* ===================== TAB 5: INSTITUCIONES Y CONTRASEÑAS (SOLO SUPERADMIN) ===================== */}
        {esSuperadmin && activeTab === "instituciones" && (
          <div className="animate-fadeIn">
            <AdminInstituciones instituciones={instituciones} />
          </div>
        )}
      </main>
    </div>
  );
}
