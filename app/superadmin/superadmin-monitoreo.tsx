"use client";

import { useState, useMemo } from "react";
import { formatFechaLojaCliente } from "@/lib/fechasCliente";
import Image from "next/image";

export interface EventoWebItem {
  id: number;
  slug: string;
  nombre: string;
  fecha: Date | string;
  fechaFin?: Date | string | null;
  lugar: string;
  descripcion: string;
  imagenUrl: string | null;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  nombreGestor: string;
  categoria?: { nombre: string } | null;
  zona?: { nombre: string } | null;
  createdAt: Date | string;
}

export interface PublicacionRedSocialItem {
  id: number;
  eventoId: number;
  evento: {
    id: number;
    nombre: string;
    fecha: Date | string;
    lugar: string;
    imagenUrl: string | null;
  };
  plataformas: string;
  tipo: string;
  programadoAt: Date | string;
  publicadoAt: Date | string | null;
  estado: "PENDIENTE" | "PROGRAMADO" | "PUBLICADO" | "FALLIDO" | "CANCELADO";
  error: string | null;
  createdAt: Date | string;
}

export interface PostSocialBotItem {
  id: number;
  origen: string;
  urlOriginal: string | null;
  textoOriginal: string | null;
  titulo: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  fechaPublicacion: Date | string | null;
  lugar: string | null;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  grupoId: string | null;
  confianzaIA: number | null;
  fechaDeteccion: Date | string;
  createdAt: Date | string;
}

interface Props {
  eventosWeb: EventoWebItem[];
  publicacionesRedes: PublicacionRedSocialItem[];
  postsBot: PostSocialBotItem[];
}

type TabVista = "TODOS" | "WEB" | "REDES" | "BOT_WA";
type FiltroFecha = "HOY" | "AYER" | "CUSTOM" | "TODAS";

export function SuperAdminMonitoreo({
  eventosWeb = [],
  publicacionesRedes = [],
  postsBot = [],
}: Props) {
  const [tab, setTab] = useState<TabVista>("TODOS");
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>("HOY");
  
  // Fechas de referencia usando hora local (Ecuador UTC-5)
  const ahora = new Date();
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const hoyStr = formatYMD(ahora);
  const ayerDate = new Date(ahora);
  ayerDate.setDate(ayerDate.getDate() - 1);
  const ayerStr = formatYMD(ayerDate);

  const [fechaCustom, setFechaCustom] = useState<string>(hoyStr);

  // Fecha seleccionada según el filtro
  const targetDateStr = useMemo(() => {
    if (filtroFecha === "HOY") return hoyStr;
    if (filtroFecha === "AYER") return ayerStr;
    if (filtroFecha === "CUSTOM") return fechaCustom;
    return null;
  }, [filtroFecha, hoyStr, ayerStr, fechaCustom]);

  const matchDate = (dateVal: Date | string | null | undefined, target: string | null) => {
    if (!target) return true;
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    return formatYMD(d) === target;
  };

  // Filtrado de Eventos en Web (por fecha de evento o fecha de creación)
  const eventosWebFiltrados = useMemo(() => {
    return eventosWeb.filter((e) => {
      if (filtroFecha === "TODAS") return true;
      return matchDate(e.fecha, targetDateStr) || matchDate(e.createdAt, targetDateStr);
    });
  }, [eventosWeb, filtroFecha, targetDateStr]);

  // Filtrado de Publicaciones en Redes (por programadoAt o createdAt)
  const publicacionesRedesFiltradas = useMemo(() => {
    return publicacionesRedes.filter((p) => {
      if (filtroFecha === "TODAS") return true;
      return matchDate(p.programadoAt, targetDateStr) || matchDate(p.createdAt, targetDateStr);
    });
  }, [publicacionesRedes, filtroFecha, targetDateStr]);

  // Filtrado de Posts Capturados por Bot WhatsApp
  const postsBotFiltrados = useMemo(() => {
    return postsBot.filter((b) => {
      if (filtroFecha === "TODAS") return true;
      return matchDate(b.fechaDeteccion, targetDateStr) || matchDate(b.createdAt, targetDateStr);
    });
  }, [postsBot, filtroFecha, targetDateStr]);

  // Contadores para insignias
  const conteoWebHoy = useMemo(() => eventosWeb.filter((e) => matchDate(e.createdAt, hoyStr) || matchDate(e.fecha, hoyStr)).length, [eventosWeb, hoyStr]);
  const conteoRedesHoy = useMemo(() => publicacionesRedes.filter((p) => matchDate(p.programadoAt, hoyStr) || matchDate(p.createdAt, hoyStr)).length, [publicacionesRedes, hoyStr]);
  const conteoBotHoy = useMemo(() => postsBot.filter((b) => matchDate(b.fechaDeteccion, hoyStr)).length, [postsBot, hoyStr]);

  const conteoWebAyer = useMemo(() => eventosWeb.filter((e) => matchDate(e.createdAt, ayerStr) || matchDate(e.fecha, ayerStr)).length, [eventosWeb, ayerStr]);
  const conteoRedesAyer = useMemo(() => publicacionesRedes.filter((p) => matchDate(p.programadoAt, ayerStr) || matchDate(p.createdAt, ayerStr)).length, [publicacionesRedes, ayerStr]);
  const conteoBotAyer = useMemo(() => postsBot.filter((b) => matchDate(b.fechaDeteccion, ayerStr)).length, [postsBot, ayerStr]);

  return (
    <div className="space-y-6">
      {/* Header y Control de Fechas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📡</span>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  Monitoreo de Publicaciones (Web & Redes)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Supervisa eventos publicados en la web, contenido programado/publicado en redes y capturas del bot.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Filtro de Fechas */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltroFecha("HOY")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filtroFecha === "HOY"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400"
                  : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-700/60"
              }`}
            >
              <span>⚡ Hoy</span>
              <span className="text-[10px] bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                {conteoWebHoy + conteoRedesHoy + conteoBotHoy}
              </span>
            </button>

            <button
              onClick={() => setFiltroFecha("AYER")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filtroFecha === "AYER"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400"
                  : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 border border-zinc-700/60"
              }`}
            >
              <span>⏮️ Ayer</span>
              <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-700">
                {conteoWebAyer + conteoRedesAyer + conteoBotAyer}
              </span>
            </button>

            {/* Input para Elegir Fecha Específica */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              filtroFecha === "CUSTOM"
                ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-400"
                : "bg-zinc-800/80 border-zinc-700/60"
            }`}>
              <span className="text-xs text-zinc-400 font-bold">📅 Fecha:</span>
              <input
                type="date"
                value={fechaCustom}
                onChange={(e) => {
                  setFechaCustom(e.target.value);
                  setFiltroFecha("CUSTOM");
                }}
                className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setFiltroFecha("TODAS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filtroFecha === "TODAS"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400"
                  : "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 border border-zinc-700/60"
              }`}
            >
              📜 Todo
            </button>
          </div>
        </div>

        {/* Resumen numérico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌐</span>
              <span className="text-xs font-semibold text-zinc-300">Eventos en Web</span>
            </div>
            <span className="text-lg font-black text-white">{eventosWebFiltrados.length}</span>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📱</span>
              <span className="text-xs font-semibold text-zinc-300">Publicaciones Redes</span>
            </div>
            <span className="text-lg font-black text-purple-300">{publicacionesRedesFiltradas.length}</span>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="text-xs font-semibold text-zinc-300">Capturas Bot WA</span>
            </div>
            <span className="text-lg font-black text-emerald-400">{postsBotFiltrados.length}</span>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas de Vista */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setTab("TODOS")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            tab === "TODOS"
              ? "bg-white text-zinc-950 shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <span>👁️ Ver Todo Integrado</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            {eventosWebFiltrados.length + publicacionesRedesFiltradas.length + postsBotFiltrados.length}
          </span>
        </button>

        <button
          onClick={() => setTab("WEB")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            tab === "WEB"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <span>🌐 Eventos en Web</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            {eventosWebFiltrados.length}
          </span>
        </button>

        <button
          onClick={() => setTab("REDES")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            tab === "REDES"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <span>📱 Redes (IG / FB)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            {publicacionesRedesFiltradas.length}
          </span>
        </button>

        <button
          onClick={() => setTab("BOT_WA")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            tab === "BOT_WA"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <span>🤖 Capturas Bot WhatsApp</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            {postsBotFiltrados.length}
          </span>
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      <div className="space-y-6">
        {/* SECCIÓN 1: EVENTOS EN LA WEB */}
        {(tab === "TODOS" || tab === "WEB") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <span>🌐</span> Eventos en la Web ({eventosWebFiltrados.length})
              </h3>
            </div>

            {eventosWebFiltrados.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
                No hay eventos registrados en la web para la fecha seleccionada.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eventosWebFiltrados.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex gap-3 items-start hover:border-zinc-700 transition-colors"
                  >
                    {ev.imagenUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-700">
                        <Image
                          src={ev.imagenUrl}
                          alt={ev.nombre}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0 border border-zinc-700 text-zinc-500">
                        🎭
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                          ev.estado === "APROBADO"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                            : ev.estado === "PENDIENTE"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                            : "bg-rose-950/80 text-rose-400 border border-rose-800"
                        }`}>
                          {ev.estado}
                        </span>
                        {ev.categoria && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                            {ev.categoria.nombre}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1 truncate" title={ev.nombre}>
                        {ev.nombre}
                      </h4>
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span>📍 {ev.lugar}</span>
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-2">
                        <span>🗓️ Fecha Evento: <strong className="text-zinc-300">{formatFechaLojaCliente(ev.fecha)}</strong></span>
                        <span>Ingreso: <strong className="text-zinc-400">{new Date(ev.createdAt).toLocaleDateString("es-EC")}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 2: PUBLICACIONES EN REDES SOCIALES */}
        {(tab === "TODOS" || tab === "REDES") && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <span>📱</span> Publicaciones Redes Sociales ({publicacionesRedesFiltradas.length})
              </h3>
            </div>

            {publicacionesRedesFiltradas.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
                No hay publicaciones de redes registradas para la fecha seleccionada.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {publicacionesRedesFiltradas.map((pub) => (
                  <div
                    key={pub.id}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex gap-3 items-start hover:border-zinc-700 transition-colors"
                  >
                    {pub.evento?.imagenUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-700">
                        <Image
                          src={pub.evento.imagenUrl}
                          alt={pub.evento.nombre}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0 border border-zinc-700 text-zinc-500">
                        📱
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                          pub.estado === "PUBLICADO"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                            : pub.estado === "PROGRAMADO"
                            ? "bg-sky-950/80 text-sky-400 border border-sky-800"
                            : pub.estado === "PENDIENTE"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                            : "bg-rose-950/80 text-rose-400 border border-rose-800"
                        }`}>
                          {pub.estado}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                          {pub.plataformas}
                        </span>
                        <span className="text-[10px] font-medium text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded-md">
                          {pub.tipo}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1 truncate" title={pub.evento?.nombre}>
                        {pub.evento?.nombre || `Evento #${pub.eventoId}`}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        📍 {pub.evento?.lugar || "Sin lugar especificado"}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-2">
                        <span>⏰ Prog: <strong className="text-purple-300">{new Date(pub.programadoAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</strong></span>
                        {pub.publicadoAt && (
                          <span>✅ Publicado: <strong className="text-emerald-400">{new Date(pub.publicadoAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</strong></span>
                        )}
                      </div>
                      {pub.error && (
                        <p className="text-[11px] text-rose-400 mt-1.5 bg-rose-950/40 p-1.5 rounded border border-rose-900/50">
                          ⚠️ Error: {pub.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 3: CAPTURAS DEL BOT DE WHATSAPP */}
        {(tab === "TODOS" || tab === "BOT_WA") && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <span>🤖</span> Capturas del Bot de WhatsApp ({postsBotFiltrados.length})
              </h3>
            </div>

            {postsBotFiltrados.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
                No hay capturas del bot de WhatsApp para la fecha seleccionada.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {postsBotFiltrados.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex gap-3 items-start hover:border-zinc-700 transition-colors"
                  >
                    {post.imagenUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-700">
                        <Image
                          src={post.imagenUrl}
                          alt={post.titulo || "Post"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0 border border-zinc-700 text-zinc-500">
                        💬
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                          post.estado === "APROBADO"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                            : post.estado === "PENDIENTE"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                            : "bg-rose-950/80 text-rose-400 border border-rose-800"
                        }`}>
                          {post.estado}
                        </span>
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                          {post.origen}
                        </span>
                        {typeof post.confianzaIA === "number" && (
                          <span className="text-[10px] text-purple-400">
                            IA: {Math.round(post.confianzaIA * 100)}%
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1 truncate" title={post.titulo || post.textoOriginal || ""}>
                        {post.titulo || post.textoOriginal?.slice(0, 50) || "Sin título"}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        📍 {post.lugar || "Lugar pendiente"}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-2">
                        <span>Detectado: <strong className="text-zinc-300">{new Date(post.fechaDeteccion).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
