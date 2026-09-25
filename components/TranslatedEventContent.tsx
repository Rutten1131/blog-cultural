"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatFechaHoraLojaCliente } from "@/lib/fechasCliente";

interface TranslatedEventContentProps {
  initialTitle: string;
  initialDescription: string;
  initialLocation: string;
  initialZona: string;
  fechaOriginal: string | Date;
  fechaFinOriginal?: string | Date | null;
  fechaInicioFormateada: string;
  fechaFinFormateada?: string;
  nombreGestor: string;
  hasFechaFin: boolean;
}

/**
 * Detecta si una línea es un "encabezado" (todo en mayúsculas y corta).
 * Ejemplos del mundo real: "FERIA DE EXPOSICIÓN", "CALLES VIVAS", "TESOROS DEL PASADO".
 */
function esEncabezado(linea: string): boolean {
  const s = linea.trim();
  if (!s || s.length > 80) return false;
  return s === s.toUpperCase() && /[A-ZÁÉÍÓÚÑÜ]/.test(s);
}

/** Detecta líneas de hora/precio cortas ("10h00 a 18h00", "Entrada gratuita", "$5"). */
function esDetalle(linea: string): boolean {
  const s = linea.trim();
  return (
    s.length > 0 &&
    s.length <= 50 &&
    /^\d|h\d{2}|entrada|gratis|libre|\$|precio/i.test(s)
  );
}

/**
 * Renderiza la descripción del evento de forma visual sin cambiar una sola palabra.
 * - Líneas en MAYÚSCULAS cortas → encabezado bold
 * - Líneas de hora/precio       → badge inline
 * - Resto                       → párrafo normal agrupado
 */
function FormattedDescription({ text, loading }: { text: string; loading: boolean }) {
  if (!text?.trim()) return null;

  const lineas = text.split(/\r?\n/);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloques: any[] = [];
  let parrafoActual: string[] = [];
  let key = 0;

  function volcarParrafo() {
    if (parrafoActual.length === 0) return;
    const contenido = parrafoActual.join(" ").trim();
    if (contenido) {
      bloques.push(
        <p key={key++} className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {contenido}
        </p>
      );
    }
    parrafoActual = [];
  }

  for (const linea of lineas) {
    const s = linea.trim();

    if (!s) {
      volcarParrafo();
      continue;
    }

    if (esEncabezado(s)) {
      volcarParrafo();
      bloques.push(
        <p key={key++} className="font-bold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wide mt-4 first:mt-0">
          {s}
        </p>
      );
      continue;
    }

    if (esDetalle(s)) {
      volcarParrafo();
      bloques.push(
        <span key={key++} className="inline-block text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-0.5 mr-2 mb-1">
          {s}
        </span>
      );
      continue;
    }

    parrafoActual.push(s);
  }
  volcarParrafo();

  return (
    <div className="space-y-2 transition-opacity duration-200" style={{ opacity: loading ? 0.6 : 1 }}>
      {bloques}
    </div>
  );
}

export function TranslatedEventContent({
  initialTitle,
  initialDescription,
  initialLocation,
  initialZona,
  fechaOriginal,
  fechaFinOriginal,
  fechaInicioFormateada,
  fechaFinFormateada,
  nombreGestor,
  hasFechaFin,
}: TranslatedEventContentProps) {
  const { locale, t } = useLanguage();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si el usuario regresa al español, restauramos el texto original de forma inmediata
    if (locale === "es") {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setLocation(initialLocation);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchTranslation() {
      setLoading(true);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: initialTitle,
            description: initialDescription,
            location: initialLocation,
            targetLang: locale,
          }),
        });

        if (!res.ok) throw new Error("Translation failed");

        const data = await res.json();
        if (!isCancelled) {
          setTitle(data.title || initialTitle);
          setDescription(data.description || initialDescription);
          setLocation(data.location || initialLocation);
        }
      } catch (err) {
        console.error("Error traduciendo evento:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchTranslation();

    return () => {
      isCancelled = true;
    };
  }, [locale, initialTitle, initialDescription, initialLocation]);

  // Formatear fechas respetando el idioma seleccionado
  const displayFechaInicio = locale === "es"
    ? fechaInicioFormateada
    : formatFechaHoraLojaCliente(fechaOriginal, "largo", locale);

  const displayFechaFin = fechaFinOriginal
    ? (locale === "es" ? fechaFinFormateada : formatFechaHoraLojaCliente(fechaFinOriginal, "largo", locale))
    : null;

  return (
    <div>
      {/* Título */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 leading-tight break-words [overflow-wrap:anywhere] transition-opacity duration-200" style={{ opacity: loading ? 0.7 : 1 }}>
        {title}
      </h1>

      {/* Ficha de Detalles del Evento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 mb-8 text-sm">
        <div>
          <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
            {hasFechaFin ? t("evento.fecha_inicio", "Fecha de Inicio") : t("evento.fecha_hora", "Fecha y Hora")}
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
            {displayFechaInicio}
          </span>
        </div>
        {hasFechaFin && displayFechaFin && (
          <div>
            <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
              {t("evento.fecha_fin", "Fecha de Finalización")}
            </span>
            <span className="font-semibold text-purple-700 dark:text-purple-300 capitalize">
              {displayFechaFin}
            </span>
          </div>
        )}
        <div>
          <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
            {t("evento.lugar", "Lugar / Recinto")}
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 break-words [overflow-wrap:anywhere]">
            {location}
          </span>
        </div>
        {/* Ocultar el campo si lo llenó el bot (el organizador real no se conoce) */}
        {nombreGestor && !nombreGestor.includes("Bot WhatsApp") && (
          <div>
            <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
              {t("evento.organizador", "Organizador / Gestor")}
            </span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 break-words [overflow-wrap:anywhere]">
              {nombreGestor}
            </span>
          </div>
        )}
        <div>
          <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
            {t("evento.zona_parroquial", "Ubicación Parroquial")}
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {initialZona}
          </span>
        </div>
      </div>

      {/* Descripción completa */}
      <div className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          {t("evento.sobre_este_evento", "Sobre este evento")}
        </h2>
        <FormattedDescription text={description} loading={loading} />
      </div>
    </div>
  );
}
