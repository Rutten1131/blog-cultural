"use client";

import { useState } from "react";

export interface AliadoAnalyticsData {
  id: number;
  nombre: string;
  tipo: string;
  imagenUrl?: string | null;
  totalSesiones: number;
  totalMensajes: number;
  leads: { sessionId: string; nombre: string; fecha: Date; zona?: string | null }[];
  sesionesRecientes: {
    sessionId: string;
    nombreUsuario: string | null;
    zonaDetectada: string | null;
    ciudad: string | null;
    intencionDetectada: string | null;
    contextoResumen?: string | null;
    createdAt: Date;
    mensajesCount: number;
    mensajesRelevantes: { sender: string; contenido: string; createdAt: Date }[];
  }[];
}

const TIPO_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  HOSPEDAJE:    { emoji: "🏨", label: "Hotel",        color: "bg-blue-950/70 border-blue-700/60 text-blue-300" },
  GASTRONOMIA:  { emoji: "🍽️", label: "Restaurante",  color: "bg-rose-950/70 border-rose-700/60 text-rose-300" },
  CAFETERIA:    { emoji: "☕", label: "Cafetería",    color: "bg-amber-950/70 border-amber-700/60 text-amber-300" },
  EXPERIENCIA:  { emoji: "🎯", label: "Experiencia",  color: "bg-purple-950/70 border-purple-700/60 text-purple-300" },
  TRANSPORTE:   { emoji: "🚌", label: "Transporte",   color: "bg-green-950/70 border-green-700/60 text-green-300" },
};

const TRADUCCION_INTENCIONES: Record<string, { tema: string; descripcion: string }> = {
  PLANIFICA_VISITA: { tema: "Planificación de Viaje", descripcion: "Busca armar itinerario o actividades" },
  EVENTOS_CULTURALES: { tema: "Cartelera y Eventos", descripcion: "Consulta conciertos, obras o agenda cultural" },
  HOSPEDAJE_HOTEL: { tema: "Alojamiento / Hospedaje", descripcion: "Interesado en hoteles, precios y habitaciones" },
  GASTRONOMIA_CAFETERIA: { tema: "Gastronomía y Café", descripcion: "Busca restaurantes, cafeterías o comida típica" },
  TURISMO_LUGARES_LOJA: { tema: "Turismo y Naturaleza", descripcion: "Interés en atractivos, cascadas o miradores" },
  VENTA_ALIADO_CONTINUAR: { tema: "Interés Directo en Aliado", descripcion: "Avanzó en consultar habitaciones, precios o menú del aliado" },
  SALUDO_CORTE: { tema: "Contacto Inicial", descripcion: "Saludo o inicio de conversación" },
  AMBIGUO_CONTRADICTORIO: { tema: "Consulta General", descripcion: "Pregunta abierta o variada" },
};

function TipoBadge({ tipo }: { tipo: string }) {
  const info = TIPO_LABELS[tipo] || { emoji: "🤝", label: tipo, color: "bg-zinc-800 border-zinc-700 text-zinc-300" };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border rounded-full px-2.5 py-0.5 ${info.color}`}>
      <span>{info.emoji}</span>
      <span>{info.label}</span>
    </span>
  );
}

function formatTime(d: Date | string) {
  return new Date(d).toLocaleString("es-EC", {
    timeZone: "America/Guayaquil",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function descargarExcelAliado(aliado: AliadoAnalyticsData) {
  const fechaHoy = new Date().toLocaleDateString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const filasLeads = aliado.leads.map((lead, idx) => `
    <tr>
      <td style="text-align:center;border:1px solid #d1d5db;padding:8px;">${idx + 1}</td>
      <td style="font-weight:bold;border:1px solid #d1d5db;padding:8px;color:#1e1b4b;">${lead.nombre}</td>
      <td style="border:1px solid #d1d5db;padding:8px;">${lead.zona || "No especificada"}</td>
      <td style="border:1px solid #d1d5db;padding:8px;">${formatTime(lead.fecha)}</td>
      <td style="font-family:monospace;font-size:11px;border:1px solid #d1d5db;padding:8px;">${lead.sessionId}</td>
    </tr>
  `).join("");

  const filasSesiones = aliado.sesionesRecientes.map((ses, idx) => {
    const infoIntencion = TRADUCCION_INTENCIONES[ses.intencionDetectada || ""] || {
      tema: ses.intencionDetectada || "Consulta General",
      descripcion: "Interés expresado en el chat",
    };

    // Resumen humano claro
    const resumenLimpio = ses.contextoResumen || infoIntencion.descripcion;

    const conversacionTexto = ses.mensajesRelevantes
      .map((m) => `[${m.sender === "user" ? "USUARIO" : "BOT"}]: ${m.contenido.replace(/"/g, "'")}`)
      .join(" || ");

    return `
      <tr>
        <td style="text-align:center;border:1px solid #d1d5db;padding:8px;">${idx + 1}</td>
        <td style="font-weight:bold;border:1px solid #d1d5db;padding:8px;color:#111827;">${ses.nombreUsuario || "Anónimo"}</td>
        <td style="border:1px solid #d1d5db;padding:8px;">${ses.zonaDetectada || ses.ciudad || "Loja"}</td>
        <td style="font-weight:bold;color:#4c1d95;border:1px solid #d1d5db;padding:8px;">${infoIntencion.tema}</td>
        <td style="border:1px solid #d1d5db;padding:8px;font-size:12px;background:#f9fafb;">${resumenLimpio}</td>
        <td style="border:1px solid #d1d5db;padding:8px;">${formatTime(ses.createdAt)}</td>
        <td style="border:1px solid #d1d5db;padding:8px;max-width:350px;font-size:11px;color:#374151;">${conversacionTexto || "Sin mensajes registrados"}</td>
      </tr>
    `;
  }).join("");

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Reporte Aliado</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body style="font-family:Segoe UI, Arial, sans-serif;margin:20px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td colspan="7" style="background:#4c1d95;color:#ffffff;font-size:18px;font-weight:bold;padding:14px;text-align:center;">
              INFORME DE CONSULTAS Y PROSPECTOS — AGENDA CULTURAL LOJA
            </td>
          </tr>
          <tr>
            <td colspan="7" style="background:#f3f4f6;padding:12px;font-size:13px;border-bottom:3px solid #7c3aed;">
              <strong>Aliado:</strong> ${aliado.nombre} &nbsp;|&nbsp;
              <strong>Categoría:</strong> ${aliado.tipo} &nbsp;|&nbsp;
              <strong>Total Consultas Registradas:</strong> ${aliado.totalSesiones} &nbsp;|&nbsp;
              <strong>Total Prospectos (Leads):</strong> ${aliado.leads.length} &nbsp;|&nbsp;
              <strong>Fecha de Emisión:</strong> ${fechaHoy}
            </td>
          </tr>
        </table>

        <h3 style="color:#1f2937;margin-top:24px;font-size:15px;border-left:4px solid #10b981;padding-left:8px;">1. LISTA DE PROSPECTOS INTERESADOS (LEADS)</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
          <thead>
            <tr style="background:#374151;color:#ffffff;font-size:12px;">
              <th style="border:1px solid #1f2937;padding:8px;width:40px;">#</th>
              <th style="border:1px solid #1f2937;padding:8px;text-align:left;">Nombre del Interesado</th>
              <th style="border:1px solid #1f2937;padding:8px;text-align:left;">Ubicación / Zona</th>
              <th style="border:1px solid #1f2937;padding:8px;text-align:left;">Fecha y Hora</th>
              <th style="border:1px solid #1f2937;padding:8px;text-align:left;">ID Sesión</th>
            </tr>
          </thead>
          <tbody>
            ${filasLeads.length > 0 ? filasLeads : `<tr><td colspan="5" style="text-align:center;padding:15px;color:#6b7280;border:1px solid #d1d5db;">No hay leads con nombre capturado aún.</td></tr>`}
          </tbody>
        </table>

        <h3 style="color:#1f2937;margin-top:24px;font-size:15px;border-left:4px solid #6366f1;padding-left:8px;">2. QUÉ PREGUNTARON LOS USUARIOS (TEMA Y RESUMEN DE INTENCIÓN)</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
          <thead>
            <tr style="background:#111827;color:#ffffff;font-size:12px;">
              <th style="border:1px solid #000;padding:8px;width:40px;">#</th>
              <th style="border:1px solid #000;padding:8px;text-align:left;">Usuario</th>
              <th style="border:1px solid #000;padding:8px;text-align:left;">Zona / Ciudad</th>
              <th style="border:1px solid #000;padding:8px;text-align:left;">Tema General</th>
              <th style="border:1px solid #000;padding:8px;text-align:left;">Resumen de la Intención</th>
              <th style="border:1px solid #000;padding:8px;text-align:left;">Fecha</th>
              <th style="border:1px solid #000;padding:8px;text-align:left;">Diálogo Relevante</th>
            </tr>
          </thead>
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const nombreLimpio = aliado.nombre.toLowerCase().replace(/[^a-z0-9]/g, "_");
  a.href = url;
  a.download = `reporte_${nombreLimpio}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SuperAdminAliadosAnalytics({ aliados }: { aliados: AliadoAnalyticsData[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [tabActiva, setTabActiva] = useState<"sesiones" | "leads">("sesiones");

  const filtrados = aliados.filter((a) =>
    !busqueda || a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || a.tipo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalLeads = aliados.reduce((s, a) => s + a.leads.length, 0);
  const totalSesiones = aliados.reduce((s, a) => s + a.totalSesiones, 0);
  const aliadoTop = [...aliados].sort((a, b) => b.totalSesiones - a.totalSesiones)[0];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Total Aliados</p>
          <p className="text-3xl font-black text-white">{aliados.length}</p>
          <p className="text-xs text-zinc-600 mt-1">registrados en el sistema</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Consultas Totales</p>
          <p className="text-3xl font-black text-purple-400">{totalSesiones}</p>
          <p className="text-xs text-zinc-600 mt-1">sesiones que los mencionaron</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Leads Capturados</p>
          <p className="text-3xl font-black text-emerald-400">{totalLeads}</p>
          <p className="text-xs text-zinc-600 mt-1">usuarios con nombre guardado</p>
        </div>
      </div>

      {aliados.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>📊</span> Aliados más consultados en el Chatbot
          </h2>
          <div className="space-y-3">
            {[...aliados]
              .sort((a, b) => b.totalSesiones - a.totalSesiones)
              .slice(0, 8)
              .map((a, i) => {
                const max = aliadoTop?.totalSesiones || 1;
                const pct = Math.round((a.totalSesiones / max) * 100);
                const info = TIPO_LABELS[a.tipo] || { emoji: "🤝" };
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-4 font-bold">{i + 1}</span>
                    <span className="text-sm w-5">{info.emoji}</span>
                    <span className="text-xs sm:text-sm text-zinc-300 w-40 truncate font-medium">{a.nombre}</span>
                    <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-8 text-right font-mono">{a.totalSesiones}</span>
                    {a.leads.length > 0 && (
                      <span className="text-[10px] bg-emerald-900/60 text-emerald-400 border border-emerald-700/40 rounded-full px-1.5 py-0.5 font-bold shrink-0">
                        {a.leads.length} lead{a.leads.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <input
          type="search"
          placeholder="Buscar aliado por nombre o tipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full sm:max-w-sm px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
        />
        <button
          type="button"
          onClick={() => {
            // Descargar consolidado de todos los aliados
            const fechaHoy = new Date().toLocaleDateString("es-EC", { year: "numeric", month: "2-digit", day: "2-digit" });
            const filasConsolidado = aliados.map((a, i) => `
              <tr>
                <td style="text-align:center;border:1px solid #d1d5db;padding:6px;">${i + 1}</td>
                <td style="font-weight:bold;border:1px solid #d1d5db;padding:6px;">${a.nombre}</td>
                <td style="border:1px solid #d1d5db;padding:6px;">${a.tipo}</td>
                <td style="text-align:center;font-weight:bold;border:1px solid #d1d5db;padding:6px;">${a.totalSesiones}</td>
                <td style="text-align:center;border:1px solid #d1d5db;padding:6px;">${a.totalMensajes}</td>
                <td style="text-align:center;font-weight:bold;color:#059669;border:1px solid #d1d5db;padding:6px;">${a.leads.length}</td>
                <td style="border:1px solid #d1d5db;padding:6px;font-size:12px;">${a.leads.map((l) => l.nombre).join(", ") || "Sin leads"}</td>
              </tr>
            `).join("");

            const html = `
              <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>
                <body style="font-family:Segoe UI, Arial, sans-serif;margin:20px;">
                  <h2 style="background:#581c87;color:#fff;padding:12px;text-align:center;">AGENDA CULTURAL LOJA — RESUMEN CONSOLIDADO DE ALIADOS</h2>
                  <p><strong>Fecha de Emisión:</strong> ${fechaHoy} | <strong>Total Aliados:</strong> ${aliados.length}</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <thead>
                      <tr style="background:#1f2937;color:#fff;">
                        <th style="border:1px solid #374151;padding:8px;">#</th>
                        <th style="border:1px solid #374151;padding:8px;text-align:left;">Aliado</th>
                        <th style="border:1px solid #374151;padding:8px;text-align:left;">Tipo</th>
                        <th style="border:1px solid #374151;padding:8px;">Consultas</th>
                        <th style="border:1px solid #374151;padding:8px;">Mensajes</th>
                        <th style="border:1px solid #374151;padding:8px;">Leads</th>
                        <th style="border:1px solid #374151;padding:8px;text-align:left;">Nombres de Leads</th>
                      </tr>
                    </thead>
                    <tbody>${filasConsolidado}</tbody>
                  </table>
                </body>
              </html>
            `;
            const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const aLink = document.createElement("a");
            aLink.href = url;
            aLink.download = `reporte_consolidado_aliados_${new Date().toISOString().slice(0, 10)}.xls`;
            document.body.appendChild(aLink);
            aLink.click();
            document.body.removeChild(aLink);
            URL.revokeObjectURL(url);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          <span>📥</span>
          <span>Descargar Resumen Completo (Excel)</span>
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
          Detalle por Aliado ({filtrados.length})
        </h2>

        {filtrados.length === 0 && (
          <div className="text-center py-16 text-zinc-600">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">No se encontraron aliados que coincidan con la búsqueda.</p>
          </div>
        )}

        {filtrados.map((aliado) => {
          const isExpanded = expandido === aliado.id;
          const info = TIPO_LABELS[aliado.tipo] || { emoji: "🤝" };

          return (
            <div key={aliado.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandido(isExpanded ? null : aliado.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-zinc-800 border border-zinc-700 overflow-hidden">
                    {aliado.imagenUrl ? (
                      <img src={aliado.imagenUrl} alt={aliado.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span>{info.emoji}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white truncate">{aliado.nombre}</span>
                      <TipoBadge tipo={aliado.tipo} />
                      {aliado.leads.length > 0 && (
                        <span className="text-[10px] bg-emerald-900/60 text-emerald-400 border border-emerald-700/40 rounded-full px-2 py-0.5 font-bold">
                          ✅ {aliado.leads.length} lead{aliado.leads.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{aliado.totalSesiones} consultas · {aliado.totalMensajes} mensajes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      descargarExcelAliado(aliado);
                    }}
                    title="Descargar informe Excel de este aliado"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-semibold transition-colors shadow-sm"
                  >
                    <span>📊</span>
                    <span className="hidden sm:inline">Exportar Excel</span>
                  </button>
                  <svg
                    className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-800 px-5 py-4 space-y-4">
                  <div className="flex gap-1 border-b border-zinc-800 -mx-5 px-5">
                    {(["sesiones", "leads"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setTabActiva(tab)}
                        className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                          tabActiva === tab
                            ? "border-purple-500 text-purple-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {tab === "sesiones" ? `💬 Conversaciones (${aliado.sesionesRecientes.length})` : `✅ Leads (${aliado.leads.length})`}
                      </button>
                    ))}
                  </div>

                  {tabActiva === "leads" && (
                    <div className="space-y-3">
                      {aliado.leads.length === 0 ? (
                        <div className="text-center py-8 text-zinc-600">
                          <p className="text-2xl mb-2">🎯</p>
                          <p className="text-xs">Aún no hay leads capturados para este aliado.</p>
                          <p className="text-xs mt-1 text-zinc-700">Los leads aparecen cuando un usuario comparte su nombre durante la conversación de venta.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {aliado.leads.map((lead, i) => (
                            <div key={i} className="flex items-center gap-3 bg-zinc-800/50 rounded-xl px-4 py-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                {lead.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white">{lead.nombre}</p>
                                <p className="text-xs text-zinc-500 truncate">
                                  {lead.zona && <span className="text-emerald-400 mr-2">📍 {lead.zona}</span>}
                                  {formatTime(lead.fecha)}
                                </p>
                              </div>
                              <span className="text-[10px] bg-zinc-700 text-zinc-400 rounded-full px-2 py-0.5 shrink-0 font-mono">
                                {lead.sessionId.slice(0, 12)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {tabActiva === "sesiones" && (
                    <div className="space-y-4">
                      {aliado.sesionesRecientes.length === 0 ? (
                        <div className="text-center py-8 text-zinc-600">
                          <p className="text-xs">Sin conversaciones registradas aún.</p>
                        </div>
                      ) : (
                        aliado.sesionesRecientes.map((ses) => (
                          <div key={ses.sessionId} className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                {ses.nombreUsuario && (
                                  <span className="text-xs font-bold text-emerald-300 bg-emerald-900/40 border border-emerald-700/40 rounded-full px-2 py-0.5">
                                    👤 {ses.nombreUsuario}
                                  </span>
                                )}
                                {ses.zonaDetectada && (
                                  <span className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 rounded-full px-2 py-0.5">
                                    📍 {ses.zonaDetectada}
                                  </span>
                                )}
                                {ses.ciudad && !ses.zonaDetectada && (
                                  <span className="text-xs text-zinc-400">{ses.ciudad}</span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-600 font-mono">{formatTime(ses.createdAt)}</span>
                            </div>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {ses.mensajesRelevantes.map((msg, j) => (
                                <div key={j} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                  <div
                                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                                      msg.sender === "user"
                                        ? "bg-purple-600 text-white rounded-br-none"
                                        : "bg-zinc-700 text-zinc-200 rounded-bl-none"
                                    }`}
                                  >
                                    <p className="leading-relaxed">{msg.contenido}</p>
                                    <p className="text-[9px] opacity-50 mt-0.5 text-right">
                                      {new Date(msg.createdAt).toLocaleTimeString("es-EC", { timeZone: "America/Guayaquil", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-zinc-600 pt-1 border-t border-zinc-700/50">
                              <span>{ses.mensajesCount} mensajes en total</span>
                              <span className="font-mono">{ses.sessionId.slice(0, 16)}...</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
