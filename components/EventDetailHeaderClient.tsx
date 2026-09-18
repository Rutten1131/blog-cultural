"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BackButton } from "./BackButton";
import { TranslatedEventText } from "./TranslatedEventText";

const CAT_MAP: Record<string, string> = {
  "arte-y-exposiciones": "cat.arte",
  teatro: "cat.teatro",
  musica: "cat.musica",
  ferias: "cat.ferias",
  "artes-vivas": "cat.artes_vivas",
};

interface Props {
  categoria: { nombre: string; slug: string } | null;
  zona: { nombre: string; tipo: string } | null;
  fechaFin: boolean;
  nombreOriginal: string;
}

export function EventDetailHeaderClient({
  categoria,
  zona,
  fechaFin,
  nombreOriginal,
}: Props) {
  const { t } = useLanguage();

  const categoriaTraducida = categoria
    ? (CAT_MAP[categoria.slug] ? t(CAT_MAP[categoria.slug], categoria.nombre) : categoria.nombre)
    : null;

  return (
    <>
      {/* Navegación y Volver */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <BackButton />
        <nav className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          <Link href="/" className="hover:text-purple-600 transition-colors">
            {t("nav.inicio", "Inicio")}
          </Link>
          <span>›</span>
          <Link href="/eventos" className="hover:text-purple-600 transition-colors">
            {t("nav.todos_eventos", "Eventos")}
          </Link>
          {categoria && (
            <>
              <span>›</span>
              <Link
                href={`/eventos/categoria/${categoria.slug}`}
                className="hover:text-purple-600 transition-colors"
              >
                {categoriaTraducida}
              </Link>
            </>
          )}
          <span>›</span>
          <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[140px] sm:max-w-[220px]">
            <TranslatedEventText text={nombreOriginal} as="span" />
          </span>
        </nav>
      </div>

      {/* Badges de Categoría y Zona */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {categoria && (
          <Link
            href={`/eventos/categoria/${categoria.slug}`}
            className="inline-flex items-center rounded-full bg-zinc-100 hover:bg-purple-100 hover:text-purple-700 dark:bg-zinc-800 px-3.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            {categoriaTraducida}
          </Link>
        )}
        {zona && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            📍 {zona.nombre} ({zona.tipo === "URBANA" ? t("zona.urbana", "URBANA") : t("zona.rural", "RURAL")})
          </span>
        )}
        {fechaFin && (
          <span className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-3.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
            ✨ {t("evento.varios_dias", "Evento de varios días")}
          </span>
        )}
      </div>
    </>
  );
}

export function EventDetailUbicacionTitleClient() {
  const { t } = useLanguage();
  return (
    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
      <span className="text-xl">📍</span>
      {t("evento.ubicacion_titulo", "Ubicación del evento")}
    </h2>
  );
}

export function EventDetailMapsButtonClient({ mapaHref }: { mapaHref: string }) {
  const { t } = useLanguage();
  return (
    <a
      href={mapaHref}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200"
    >
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>{t("evento.abrir_maps", "Abrir en Google Maps")}</span>
      <svg className="h-4 w-4 opacity-75 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

export function EventDetailRelatedTitleClient() {
  const { t } = useLanguage();
  return (
    <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">
      {t("evento.otros_interesar", "Otros eventos que te pueden interesar")}
    </h2>
  );
}
