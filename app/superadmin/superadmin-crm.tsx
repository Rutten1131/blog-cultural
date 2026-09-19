"use client";

import { useState } from "react";
import type { ChatSessionData } from "./superadmin-dashboard-client";

interface Props {
  sessions: ChatSessionData[];
  stats: {
    total: number;
    conUbicacion: number;
    zonasFrecuentes: { zona: string; count: number }[];
  };
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("es-EC", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function simplifyUA(ua: string | null): string {
  if (!ua) return "Desconocido";
  if (/iPhone|iPad/i.test(ua)) return "📱 iOS";
  if (/Android/i.test(ua)) return "📱 Android";
  if (/Windows/i.test(ua)) return "💻 Windows";
  if (/Mac/i.test(ua)) return "💻 Mac";
  if (/Linux/i.test(ua)) return "🐧 Linux";
  return "🌐 Web";
}

export function SuperAdminCRM({ sessions, stats }: Props) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.zonaDetectada?.toLowerCase().includes(q) ||
      s.ciudad?.toLowerCase().includes(q) ||
      s.sessionId.includes(q) ||
      s.mensajes.some((m) => m.contenido.toLowerCase().includes(q))
    );
  });

  const porcentajeUbicacion = stats.total > 0
    ? Math.round((stats.conUbicacion / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Total Sesiones</p>
          <p className="text-3xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Con Ubicación</p>
          <p className="text-3xl font-black text-emerald-400">{stats.conUbicacion}</p>
          <p className="text-xs text-zinc-600 mt-1">{porcentajeUbicacion}% del total</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Sin Ubicación</p>
          <p className="text-3xl font-black text-zinc-400">{stats.total - stats.conUbicacion}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Zona Top</p>
          <p className="text-base font-black text-purple-400 truncate">
            {stats.zonasFrecuentes[0]?.zona || "—"}
          </p>
          {stats.zonasFrecuentes[0] && (
            <p className="text-xs text-zinc-600 mt-1">{stats.zonasFrecuentes[0].count} visitas</p>
          )}
        </div>
      </div>

      {/* Zonas frecuentes */}
      {stats.zonasFrecuentes.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">📍 Zonas Más Frecuentes</h2>
          <div className="space-y-3">
            {stats.zonasFrecuentes.map((z, i) => {
              const max = stats.zonasFrecuentes[0].count;
              const pct = Math.round((z.count / max) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-4 font-bold">{i + 1}</span>
                  <span className="text-sm text-zinc-300 w-36 truncate">{z.zona}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-8 text-right">{z.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Buscador */}
      <div>
        <input
          type="search"
          placeholder="Buscar por zona, ciudad, mensaje..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Lista de sesiones */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
          Conversaciones ({filtered.length})
        </h2>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-zinc-600">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm">No hay conversaciones aún</p>
            <p className="text-xs mt-1">Las sesiones del chatbot aparecerán aquí</p>
          </div>
        )}

        {filtered.map((session) => {
          const isExpanded = expandedSession === session.sessionId;
          const userMessages = session.mensajes.filter((m) => m.sender === "user");
          const botMessages = session.mensajes.filter((m) => m.sender === "bot");

          return (
            <div key={session.sessionId} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Session header */}
              <button
                onClick={() => setExpandedSession(isExpanded ? null : session.sessionId)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg ${session.ubicacionLat ? "bg-emerald-950 border border-emerald-800" : "bg-zinc-800"}`}>
                    {session.ubicacionLat ? "📍" : "💬"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {session.zonaDetectada && (
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 rounded-full px-2 py-0.5">
                          {session.zonaDetectada}
                        </span>
                      )}
                      {session.ciudad && session.ciudad !== session.zonaDetectada && (
                        <span className="text-xs text-zinc-500">{session.ciudad}</span>
                      )}
                      <span className="text-xs text-zinc-600">{simplifyUA(session.userAgent)}</span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5">{formatDate(session.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">{session.mensajes.length} mensajes</p>
                    <p className="text-[10px] text-zinc-700">{userMessages.length}↑ {botMessages.length}↓</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded: mensajes */}
              {isExpanded && (
                <div className="border-t border-zinc-800 px-5 py-4 space-y-4">
                  {/* Datos de ubicación */}
                  {session.ubicacionLat && (
                    <div className="flex items-start gap-3 text-xs text-zinc-400 bg-zinc-800/60 rounded-xl px-4 py-3">
                      <span className="text-xl mt-0.5">🗺️</span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-emerald-400 text-sm">
                            {session.zonaDetectada || "Zona detectada"}
                          </p>
                          <span className="text-zinc-500">({session.ciudad || "Loja"}, {session.provincia})</span>
                        </div>
                        {session.direccionDetallada && (
                          <p className="text-zinc-300 font-mono text-[11px] bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                            📍 <span className="text-zinc-400">Punto exacto:</span> {session.direccionDetallada}
                          </p>
                        )}
                        <p className="text-zinc-500 text-[11px]">
                          Coordenadas GPS: <span className="text-zinc-300 font-mono">{session.ubicacionLat.toFixed(5)}, {session.ubicacionLng?.toFixed(5)}</span>
                          {" · "}
                          <a
                            href={`https://maps.google.com/maps?q=${session.ubicacionLat},${session.ubicacionLng}&z=16`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 font-medium underline inline-flex items-center gap-0.5"
                          >
                            Abrir en Google Maps ↗
                          </a>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chat messages */}
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {session.mensajes.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.sender === "user"
                              ? "bg-purple-600 text-white rounded-br-sm"
                              : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                          }`}
                        >
                          <p className="leading-relaxed">{msg.contenido}</p>
                          {msg.sender === "bot" && (
                            <div className="flex gap-2 mt-1.5 flex-wrap">
                              {Array.isArray(msg.eventosIds) && msg.eventosIds.length > 0 && (
                                <span className="text-[10px] bg-zinc-700 text-zinc-400 rounded-full px-2 py-0.5">
                                  🎭 {msg.eventosIds.length} evento(s)
                                </span>
                              )}
                              {Array.isArray(msg.aliadosIds) && msg.aliadosIds.length > 0 && (
                                <span className="text-[10px] bg-zinc-700 text-zinc-400 rounded-full px-2 py-0.5">
                                  🤝 {msg.aliadosIds.length} aliado(s)
                                </span>
                              )}
                              {Array.isArray(msg.atractivosIds) && msg.atractivosIds.length > 0 && (
                                <span className="text-[10px] bg-zinc-700 text-zinc-400 rounded-full px-2 py-0.5">
                                  🌿 {msg.atractivosIds.length} atractivo(s)
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-[10px] opacity-40 mt-1 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
