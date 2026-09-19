"use client";

import { useState } from "react";
import { AdminAliados, AliadoItem } from "@/app/admin/admin-aliados";
import { SuperAdminCRM } from "./superadmin-crm";

export interface ChatMessageData {
  id: number;
  sessionId: string;
  sender: string;
  contenido: string;
  aliadosIds: number[] | null;
  eventosIds: number[] | null;
  atractivosIds: number[] | null;
  createdAt: Date;
}

export interface ChatSessionData {
  id: number;
  sessionId: string;
  ubicacionLat: number | null;
  ubicacionLng: number | null;
  zonaDetectada: string | null;
  direccionDetallada?: string | null;
  ciudad: string | null;
  provincia: string | null;
  pais: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  totalMensajes: number;
  createdAt: Date;
  updatedAt: Date;
  mensajes: ChatMessageData[];
}

export interface RecomendacionItem {
  id: number;
  mensaje: string;
  contacto: string | null;
  createdAt: Date;
}

interface Props {
  initialAliados: AliadoItem[];
  initialSessions: ChatSessionData[];
  initialRecomendaciones?: RecomendacionItem[];
  stats: {
    total: number;
    conUbicacion: number;
    zonasFrecuentes: { zona: string; count: number }[];
  };
}

type Tab = "aliados" | "crm" | "buzon";

export function SuperAdminDashboardClient({
  initialAliados,
  initialSessions,
  initialRecomendaciones = [],
  stats,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("crm");

  const handleLogout = async () => {
    await fetch("/api/superadmin/auth", { method: "DELETE" });
    window.location.href = "/superadmin/login";
  };

  const tabs: { id: Tab; label: string; emoji: string; count?: number }[] = [
    { id: "crm", label: "CRM Chatbot", emoji: "📊" },
    { id: "aliados", label: "Aliados Comerciales", emoji: "🤝", count: initialAliados.length },
    { id: "buzon", label: "Buzón de Sugerencias", emoji: "📬", count: initialRecomendaciones.length },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 shadow-md">
            <span className="text-lg">🔐</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight uppercase">Super Admin</h1>
            <p className="text-[11px] text-zinc-500">Agenda Cultural Loja</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-zinc-400 hover:text-red-400 transition-colors font-semibold flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          Cerrar sesión
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-zinc-800 px-4 sm:px-6">
        <div className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
              {typeof tab.count === "number" && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "crm" && (
          <SuperAdminCRM sessions={initialSessions} stats={stats} />
        )}
        {activeTab === "aliados" && (
          <AdminAliados initialAliados={initialAliados} />
        )}
        {activeTab === "buzon" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>📬</span> Buzón de Sugerencias ({initialRecomendaciones.length})
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Aportes, opiniones y recomendaciones enviadas libremente por la comunidad desde la web.
              </p>
            </div>

            {initialRecomendaciones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
                <p className="text-sm text-zinc-400">
                  Aún no se han recibido sugerencias desde el buzón de la web.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialRecomendaciones.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm flex flex-col justify-between"
                  >
                    <p className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed mb-4">
                      &ldquo;{rec.mensaje}&rdquo;
                    </p>
                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800">
                      <span>
                        {rec.contacto ? (
                          <span className="text-zinc-300 font-semibold">
                            👤 {rec.contacto}
                          </span>
                        ) : (
                          <span className="italic text-zinc-500">Anónimo</span>
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
      </main>
    </div>
  );
}
