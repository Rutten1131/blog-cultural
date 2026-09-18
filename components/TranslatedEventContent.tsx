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
        <div>
          <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
            {t("evento.organizador", "Organizador / Gestor")}
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 break-words [overflow-wrap:anywhere]">
            {nombreGestor}
          </span>
        </div>
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
      <div className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          {t("evento.sobre_este_evento", "Sobre este evento")}
        </h2>
        <div className="whitespace-pre-line text-base break-words [overflow-wrap:anywhere] transition-opacity duration-200" style={{ opacity: loading ? 0.6 : 1 }}>
          {description}
        </div>
      </div>
    </div>
  );
}
