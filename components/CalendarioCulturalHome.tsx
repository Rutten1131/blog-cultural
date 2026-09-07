"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  formatFechaLojaCliente,
  formatRangoFechasLojaCliente,
} from "@/lib/fechasCliente";
import { EventosDiaCardStack } from "./EventosDiaCardStack";

export interface EventoCalendario {
  id: number;
  nombre: string;
  slug: string;
  fecha: Date | string;
  fechaFin?: Date | string | null;
  lugar: string;
  descripcion: string;
  imagenUrl: string | null;
  categoria: { nombre: string; slug: string } | null;
  zona: { nombre: string } | null;
}

interface Props {
  eventos: EventoCalendario[];
}

const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/**
 * Convierte un Date o string ISO a cadena YYYY-MM-DD en hora de Loja (UTC-5)
 */
function toLojaYMD(dateInput: Date | string): string {
  return formatFechaLojaCliente(dateInput, "iso");
}

export function CalendarioCulturalHome({ eventos }: Props) {
  // Fecha actual en hora local Loja (aproximada para UI)
  const hoyLoja = useMemo(() => {
    const ahora = new Date();
    return toLojaYMD(ahora);
  }, []);

  // Determinar año y mes inicial en base a hoy o al primer evento
  const [currentYear, setCurrentYear] = useState(() => {
    const parts = hoyLoja.split("-");
    return parseInt(parts[0], 10) || 2026;
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    const parts = hoyLoja.split("-");
    return (parseInt(parts[1], 10) || 9) - 1; // 0-indexed
  });

  // Día seleccionado (por defecto null para que se vea el calendario completo; al hacer clic se esconde y muestra actividades)
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Mapear eventos a días (un evento multi-día cubre desde su inicio hasta su fin)
  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>();

    eventos.forEach((ev) => {
      const iniYMD = toLojaYMD(ev.fecha);
      if (!iniYMD) return;

      if (!ev.fechaFin) {
        // Evento de un solo día
        const actuales = mapa.get(iniYMD) || [];
        actuales.push(ev);
        mapa.set(iniYMD, actuales);
      } else {
        // Evento multi-día: iterar todos los días del rango
        const finYMD = toLojaYMD(ev.fechaFin);
        if (!finYMD || finYMD < iniYMD) {
          const actuales = mapa.get(iniYMD) || [];
          actuales.push(ev);
          mapa.set(iniYMD, actuales);
          return;
        }

        // Límite de seguridad para evitar loops infinitos (máximo 60 días)
        const dCurrent = new Date(`${iniYMD}T12:00:00-05:00`);
        const dEnd = new Date(`${finYMD}T12:00:00-05:00`);
        let iterCount = 0;

        while (dCurrent <= dEnd && iterCount < 60) {
          const ymd = toLojaYMD(dCurrent);
          const actuales = mapa.get(ymd) || [];
          if (!actuales.some((e) => e.id === ev.id)) {
            actuales.push(ev);
          }
          mapa.set(ymd, actuales);

          dCurrent.setDate(dCurrent.getDate() + 1);
          iterCount++;
        }
      }
    });

    return mapa;
  }, [eventos]);

  // Generar cuadrícula del mes
  const gridDias = useMemo(() => {
    const dias: Array<{
      ymd: string;
      diaNumero: number;
      isCurrentMonth: boolean;
      isWeekend: boolean; // Viernes (5), Sábado (6), Domingo (0)
      dayOfWeek: number;
      eventosCount: number;
      eventos: EventoCalendario[];
    }> = [];

    const primerDiaMes = new Date(currentYear, currentMonth, 1);
    const ultimoDiaMes = new Date(currentYear, currentMonth + 1, 0);

    // Ajuste para que la semana empiece en Lunes (0: Lun, ..., 6: Dom)
    let startDayOfWeek = primerDiaMes.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    // Días del mes anterior para rellenar
    const diasMesAnterior = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const num = diasMesAnterior - i;
      const prevDate = new Date(currentYear, currentMonth - 1, num);
      const ymd = toLojaYMD(prevDate);
      const dayOfWeek = prevDate.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
      const evs = eventosPorDia.get(ymd) || [];

      dias.push({
        ymd,
        diaNumero: num,
        isCurrentMonth: false,
        isWeekend,
        dayOfWeek,
        eventosCount: evs.length,
        eventos: evs,
      });
    }

    // Días del mes actual
    for (let day = 1; day <= ultimoDiaMes.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const ymd = toLojaYMD(date);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
      const evs = eventosPorDia.get(ymd) || [];

      dias.push({
        ymd,
        diaNumero: day,
        isCurrentMonth: true,
        isWeekend,
        dayOfWeek,
        eventosCount: evs.length,
        eventos: evs,
      });
    }

    // Completar días del siguiente mes para cerrar la cuadrícula (múltiplo de 7)
    const resto = dias.length % 7;
    if (resto > 0) {
      const needed = 7 - resto;
      for (let day = 1; day <= needed; day++) {
        const nextDate = new Date(currentYear, currentMonth + 1, day);
        const ymd = toLojaYMD(nextDate);
        const dayOfWeek = nextDate.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
        const evs = eventosPorDia.get(ymd) || [];

        dias.push({
          ymd,
          diaNumero: day,
          isCurrentMonth: false,
          isWeekend,
          dayOfWeek,
          eventosCount: evs.length,
          eventos: evs,
        });
      }
    }

    return dias;
  }, [currentYear, currentMonth, eventosPorDia]);

  // Eventos para el día seleccionado actualmente
  const eventosSeleccionados = useMemo(() => {
    if (!selectedDay) return [];
    return eventosPorDia.get(selectedDay) || [];
  }, [selectedDay, eventosPorDia]);

  // Botón "Ir a Hoy"
  const irAHoy = () => {
    const parts = hoyLoja.split("-");
    setCurrentYear(parseInt(parts[0], 10));
    setCurrentMonth(parseInt(parts[1], 10) - 1);
    setSelectedDay(hoyLoja);
  };

  // Botón "Este Fin de Semana"
  const irAFinDeSemana = () => {
    const ahora = new Date();
    const dayOfWeek = ahora.getDay(); // 0: Dom, 1: Lun, ..., 5: Vie, 6: Sáb
    let diasHastaViernes = 5 - dayOfWeek;
    if (diasHastaViernes < 0) diasHastaViernes += 7;

    const viernes = new Date(ahora);
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      // Fin de semana actual
    } else {
      viernes.setDate(ahora.getDate() + diasHastaViernes);
    }
    const ymd = toLojaYMD(viernes);
    const parts = ymd.split("-");
    setCurrentYear(parseInt(parts[0], 10));
    setCurrentMonth(parseInt(parts[1], 10) - 1);
    setSelectedDay(ymd);
  };

  const mesAnterior = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const mesSiguiente = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="w-full rounded-3xl border border-zinc-200/80 bg-white/90 p-4 sm:p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
      {/* ── CASO 1: SE SELECCIONÓ UN DÍA -> SE ESCONDE EL CALENDARIO Y SE MUESTRAN SOLO LAS ACTIVIDADES ── */}
      {selectedDay ? (
        <div className="animate-fadeIn">
          {eventosSeleccionados.length > 0 ? (
            <EventosDiaCardStack
              eventos={eventosSeleccionados}
              diaTexto={formatFechaLojaCliente(selectedDay, "largo")}
              onVolverCalendario={() => setSelectedDay(null)}
            />
          ) : (
            <div className="py-10 text-center space-y-4">
              <span className="text-4xl">📅</span>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-black uppercase text-zinc-900 dark:text-zinc-100">
                  {formatFechaLojaCliente(selectedDay, "largo")}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  No hay actividades culturales programadas para esta fecha.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition-all cursor-pointer"
              >
                ← Volver al calendario
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── CASO 2: VISTA PRINCIPAL DEL CALENDARIO COMPLETO ── */
        <div className="animate-fadeIn">
          {/* Cabecera del Calendario */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Agenda por fecha
              </span>
              <h2 className="font-display text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                {NOMBRES_MESES[currentMonth]} {currentYear}
              </h2>
            </div>

            {/* Accesos rápidos y cambio de mes */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={irAFinDeSemana}
                className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 transition-colors"
              >
                🍿 Fin de semana
              </button>
              <button
                type="button"
                onClick={irAHoy}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Hoy
              </button>
              <div className="flex items-center rounded-full border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={mesAnterior}
                  aria-label="Mes anterior"
                  className="flex h-7 w-7 items-center justify-center rounded-l-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={mesSiguiente}
                  aria-label="Mes siguiente"
                  className="flex h-7 w-7 items-center justify-center rounded-r-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* Cuadrícula del Calendario Limpia y Minimalista */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
            {/* Cabecera Lun - Dom */}
            <div className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-semibold text-zinc-400">
              {DIAS_SEMANA.map((dia, idx) => (
                <div
                  key={dia}
                  className={`py-0.5 ${idx >= 5 ? "text-purple-600 font-bold dark:text-purple-400" : ""}`}
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Grilla de Días */}
            <div className="grid grid-cols-7 gap-1">
              {gridDias.map((item, index) => {
                const isSelected = selectedDay === item.ymd;
                const isToday = item.ymd === hoyLoja;
                const hasEvents = item.eventosCount > 0;

                return (
                  <button
                    key={`${item.ymd}-${index}`}
                    type="button"
                    onClick={() => setSelectedDay(item.ymd)}
                    className={`relative flex h-11 sm:h-13 flex-col items-center justify-center rounded-xl transition-all ${
                      !item.isCurrentMonth
                        ? "opacity-25 hover:opacity-50"
                        : item.isWeekend
                        ? "bg-purple-50/40 dark:bg-purple-950/20"
                        : "hover:bg-white dark:hover:bg-zinc-800/60"
                    } ${
                      isSelected
                        ? "!bg-purple-600 !text-white shadow-sm ring-2 ring-purple-600/30"
                        : ""
                    }`}
                  >
                    {/* Número del día */}
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        isSelected
                          ? "text-white font-bold"
                          : isToday
                          ? "text-purple-600 font-bold dark:text-purple-400"
                          : item.isWeekend && item.isCurrentMonth
                          ? "text-purple-900 font-medium dark:text-purple-300"
                          : "text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {item.diaNumero}
                    </span>

                    {/* Indicador limpio: 1 solo punto si hay eventos */}
                    {hasEvents && (
                      <span
                        className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                          isSelected
                            ? "bg-white"
                            : "bg-purple-600 dark:bg-purple-400"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-zinc-400">
            Toca cualquier día para ver sus eventos en pantalla completa
          </p>
        </div>
      )}
    </div>
  );
}
