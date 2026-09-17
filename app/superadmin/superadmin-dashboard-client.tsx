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

interface Props {
  initialAliados: AliadoItem[];
  initialSessions: ChatSessionData[];
  stats: {
    total: number;
    conUbicacion: number;
    zonasFrecuentes: { zona: string; count: number }[];
  };
}

type Tab = "aliados" | "crm";

export function SuperAdminDashboardClient({ initialAliados, initialSessions, stats }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("crm");

  const handleLogout = async () => {
    await fetch("/api/superadmin/auth", { method: "DELETE" });
    window.location.href = "/superadmin/login";
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "crm", label: "CRM Chatbot", emoji: "📊" },
    { id: "aliados", label: "Aliados Comerciales", emoji: "🤝" },
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
      </main>
    </div>
  );
}
