"use client";

import { useState, useMemo } from "react";
import { EventoCard } from "./evento-card";
import { EventoAdminRow } from "./evento-admin-row";
import { AdminNotificaciones } from "./admin-notificaciones";
import { AdminInstituciones } from "./admin-instituciones";
import { AdminBanners, BannerHeroAdminItem } from "./admin-banners";
import type { AliadoItem } from "./admin-aliados";
import { BotPendientes, type PostBotItem } from "./admin-bot-posts";
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
  banners = [],
  aliados = [],
  postsBot = [],
}: {
  session: SessionData;
  eventosPendientes: EventoItem[];
  todosLosEventos: EventoItem[];
  recomendaciones: RecomendacionItem[];
  numerosNotificacion: NumeroNotificacionItem[];
  instituciones: InstitucionItem[];
  categorias: Categoria[];
  zonas: Zona[];
  banners?: BannerHeroAdminItem[];
  aliados?: AliadoItem[];
  postsBot?: PostBotItem[];
}) {
  const esSuperadmin = session.role === "SUPERADMIN";

  const [activeTab, setActiveTab] = useState<
    "pendientes" | "todos" | "banners" | "notificaciones" | "instituciones"
  >("pendientes");

  // Control de acordeón único para moderar pendientes (uno a la vez)
  const [openPendienteId, setOpenPendienteId] = useState<number | null>(
    eventosPendientes[0]?.id ?? null
  );

  // Los candidatos del bot van a la MISMA cola que los eventos enviados por
  // la comunidad: un solo flujo. Solo se distinguen por la marca 🤖 BOT.
  const postsBotPendientes = postsBot.filter((p) => p.estado === "PENDIENTE");
  const totalPendientes = eventosPendientes.length + postsBotPendientes.length;

  // Filtros para la pestaña "Todos los Eventos"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterCategoria, setFilterCategoria] = useState<string>("TODOS");
  const [filterZona, setFilterZona] = useState<string>("TODOS");
  const [filterFecha, setFilterFecha] = useState<string>("TODAS");

  const eventosFiltrados = useMemo(() => {
    const ahora = new Date();
    const hoyStr = ahora.toISOString().split("T")[0];

    const ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = ayer.toISOString().split("T")[0];

    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().split("T")[0];

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

      // Filtro por Fecha (Fecha del evento o creación)
      if (filterFecha !== "TODAS") {
        const evFechaIso = new Date(ev.fecha).toISOString().split("T")[0];
        const evCreatedIso = new Date(ev.createdAt).toISOString().split("T")[0];

        if (filterFecha === "HOY") {
          if (evFechaIso !== hoyStr && evCreatedIso !== hoyStr) return false;
        } else if (filterFecha === "AYER") {
          if (evFechaIso !== ayerStr && evCreatedIso !== ayerStr) return false;
        } else if (filterFecha === "MANANA") {
          if (evFechaIso !== mananaStr) return false;
        } else if (filterFecha === "FUTUROS") {
          if (evFechaIso < hoyStr) return false;
        } else if (filterFecha === "PASADOS") {
          if (evFechaIso >= hoyStr) return false;
        }
      }

      return true;
    });
  }, [todosLosEventos, searchTerm, filterEstado, filterCategoria, filterZona, filterFecha]);

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

          {/* Bot de WhatsApp: candidatos capturados automáticamente del grupo.
              NO tienen pestaña propia: se integran en "Moderar Pendientes"
              para que todo sea un único flujo de moderación. */}

          {/* Banners Hero: SOLO SUPERADMIN */}
          {esSuperadmin && (
            <button
              onClick={() => setActiveTab("banners")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "banners"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>🖼️ Banners del Hero</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  activeTab === "banners"
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {banners.length}
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
                {totalPendientes}{" "}
                {totalPendientes === 1 ? "pendiente" : "pendientes"}
              </span>
            </div>

            {totalPendientes === 0 ? (
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
                {/* Candidatos capturados del grupo de WhatsApp: misma cola y
                    mismo flujo que los eventos de la comunidad. */}
                <BotPendientes posts={postsBot} />

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
                  Fecha
                </label>
                <select
                  value={filterFecha}
                  onChange={(e) => setFilterFecha(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="TODAS">Cualquier fecha</option>
                  <option value="HOY">Publicados / Hoy</option>
                  <option value="AYER">Ayer</option>
                  <option value="MANANA">Mañana</option>
                  <option value="FUTUROS">Próximos / Futuros</option>
                  <option value="PASADOS">Finalizados</option>
                </select>
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



        {/* ===================== TAB: BANNERS HERO (SOLO SUPERADMIN) ===================== */}
        {esSuperadmin && activeTab === "banners" && (
          <div className="animate-fadeIn">
            <AdminBanners banners={banners} />
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
