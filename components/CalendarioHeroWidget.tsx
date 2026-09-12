"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatFechaLojaCliente } from "@/lib/fechasCliente";
import { CalendarioCulturalHome, EventoCalendario } from "./CalendarioCulturalHome";

const NOMBRES_MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DIAS_SEMANA_CORTO = ["L","M","X","J","V","S","D"];

function toLojaYMD(d: Date | string): string {
  return formatFechaLojaCliente(d, "iso");
}

interface Props {
  eventos: EventoCalendario[];
}

export function CalendarioHeroWidget({ eventos }: Props) {
  const hoyLoja = useMemo(() => toLojaYMD(new Date()), []);

  const [currentYear, setCurrentYear] = useState(() => parseInt(hoyLoja.split("-")[0], 10) || 2026);
  const [currentMonth, setCurrentMonth] = useState(() => (parseInt(hoyLoja.split("-")[1], 10) || 9) - 1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (modalAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalAbierto]);

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModalAbierto(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Mapeo de eventos por día
  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, number>();
    eventos.forEach((ev) => {
      const iniYMD = toLojaYMD(ev.fecha);
      if (!iniYMD) return;
      if (!ev.fechaFin) {
        mapa.set(iniYMD, (mapa.get(iniYMD) || 0) + 1);
      } else {
        const finYMD = toLojaYMD(ev.fechaFin);
        const dC = new Date(`${iniYMD}T12:00:00-05:00`);
        const dE = new Date(`${finYMD}T12:00:00-05:00`);
        let iter = 0;
        while (dC <= dE && iter < 60) {
          const ymd = toLojaYMD(dC);
          mapa.set(ymd, (mapa.get(ymd) || 0) + 1);
          dC.setDate(dC.getDate() + 1);
          iter++;
        }
      }
    });
    return mapa;
  }, [eventos]);

  // Grilla del mes mini
  const gridDias = useMemo(() => {
    const dias: Array<{
      ymd: string;
      num: number;
      isCurrentMonth: boolean;
      isWeekend: boolean;
      hasEvents: boolean;
      isToday: boolean;
    }> = [];

    const primerDia = new Date(currentYear, currentMonth, 1);
    const ultimoDia = new Date(currentYear, currentMonth + 1, 0);
    let startDow = primerDia.getDay() - 1;
    if (startDow === -1) startDow = 6;

    const diasMesAnterior = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const num = diasMesAnterior - i;
      const d = new Date(currentYear, currentMonth - 1, num);
      const ymd = toLojaYMD(d);
      dias.push({ ymd, num, isCurrentMonth: false, isWeekend: [0,5,6].includes(d.getDay()), hasEvents: (eventosPorDia.get(ymd) || 0) > 0, isToday: ymd === hoyLoja });
    }
    for (let day = 1; day <= ultimoDia.getDate(); day++) {
      const d = new Date(currentYear, currentMonth, day);
      const ymd = toLojaYMD(d);
      dias.push({ ymd, num: day, isCurrentMonth: true, isWeekend: [0,5,6].includes(d.getDay()), hasEvents: (eventosPorDia.get(ymd) || 0) > 0, isToday: ymd === hoyLoja });
    }
    const resto = dias.length % 7;
    if (resto > 0) {
      for (let day = 1; day <= 7 - resto; day++) {
        const d = new Date(currentYear, currentMonth + 1, day);
        const ymd = toLojaYMD(d);
        dias.push({ ymd, num: day, isCurrentMonth: false, isWeekend: [0,5,6].includes(d.getDay()), hasEvents: false, isToday: false });
      }
    }
    return dias;
  }, [currentYear, currentMonth, eventosPorDia, hoyLoja]);

  const mesAnterior = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const mesSiguiente = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const totalEventosMes = useMemo(() => {
    let count = 0;
    gridDias.forEach(d => { if (d.isCurrentMonth && d.hasEvents) count++; });
    return count;
  }, [gridDias]);

  return (
    <>
      {/* ── MINI WIDGET COMPACTO PARA EL GAP ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setModalAbierto(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setModalAbierto(true); }}
        className="w-full max-w-[420px] ml-auto cursor-pointer rounded-2xl border border-zinc-200/90 bg-white/95 p-3 shadow-md backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 hover:shadow-[0_10px_35px_rgba(109,40,217,0.2)] hover:border-purple-400/80 transition-all duration-300 group select-none"
        aria-label="Abrir calendario cultural en pantalla completa"
      >
        {/* Cabecera mini */}
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block leading-none mb-0.5">
              Agenda por fecha
            </span>
            <span className="font-display text-xs sm:text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
              {NOMBRES_MESES[currentMonth]} {currentYear}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {totalEventosMes > 0 && (
              <span className="text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 px-1.5 py-0.5 rounded-full">
                {totalEventosMes} con eventos
              </span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); mesAnterior(); }}
              aria-label="Mes anterior"
              className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs leading-none transition-colors"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); mesSiguiente(); }}
              aria-label="Mes siguiente"
              className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs leading-none transition-colors"
            >
              ›
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {DIAS_SEMANA_CORTO.map((d, i) => (
            <div key={d} className={`text-center text-[8px] font-bold pb-0.5 ${i >= 5 ? "text-purple-500" : "text-zinc-400"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Grilla de días compacta */}
        <div className="grid grid-cols-7 gap-0.5">
          {gridDias.map((item, idx) => (
            <div
              key={`${item.ymd}-${idx}`}
              className={`relative flex flex-col items-center justify-center h-6 rounded-md text-[10px] font-medium transition-colors ${
                !item.isCurrentMonth
                  ? "opacity-20"
                  : item.isToday
                  ? "bg-purple-600 text-white font-bold shadow-sm"
                  : item.isWeekend
                  ? "text-purple-800 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/30 font-semibold"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <span>{item.num}</span>
              {item.hasEvents && item.isCurrentMonth && !item.isToday && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-purple-500" />
              )}
              {item.hasEvents && item.isCurrentMonth && item.isToday && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-white" />
              )}
            </div>
          ))}
        </div>

        {/* Indicador de clic para expandir */}
        <div className="mt-1.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[9px] font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 transition-colors">
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            Clic para ampliar calendario
          </span>
          <span className="text-[8px] bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
            Abrir popup ↗
          </span>
        </div>
      </div>

      {/* ── MODAL POPUP — PORTAL AL BODY PARA QUEDAR 100% CENTRADO EN PANTALLA ── */}
      {modalAbierto && mounted && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Calendario cultural completo"
        >
          {/* Backdrop con blur oscuro */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-fadeIn"
            onClick={() => setModalAbierto(false)}
          />

          {/* Panel central del popup */}
          <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Cabecera del modal con botón de cerrar */}
            <div className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-purple-600" />
                <h2 className="font-display font-black text-sm uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                  Agenda y Calendario Cultural
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                aria-label="Cerrar modal"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido del calendario completo */}
            <div className="p-2 sm:p-4">
              <CalendarioCulturalHome eventos={eventos} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
