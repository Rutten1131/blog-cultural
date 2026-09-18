"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Props {
  zonaNombre: string;
  tipoLabel: string;
  proximosCount: number;
}

export function ZonaPageHeaderClient({ zonaNombre, tipoLabel, proximosCount }: Props) {
  const { t, locale } = useLanguage();

  const tipoTraducido = tipoLabel === "Parroquia Urbana"
    ? t("zona.parroquia_urbana", "Parroquia Urbana")
    : t("zona.parroquia_rural", "Parroquia Rural");

  const tituloH1 = (() => {
    if (locale === "en") return `Events in ${zonaNombre}`;
    if (locale === "fr") return `Événements à ${zonaNombre}`;
    if (locale === "de") return `Events in ${zonaNombre}`;
    if (locale === "pt") return `Eventos em ${zonaNombre}`;
    return `Eventos en ${zonaNombre}`;
  })();

  const countText = (() => {
    if (locale === "en") return `${proximosCount} upcoming event${proximosCount !== 1 ? "s" : ""} on the schedule`;
    if (locale === "fr") return `${proximosCount} événement${proximosCount !== 1 ? "s" : ""} à venir`;
    if (locale === "de") return `${proximosCount} kommendes Event${proximosCount !== 1 ? "s" : ""} im Programm`;
    if (locale === "pt") return `${proximosCount} evento${proximosCount !== 1 ? "s" : ""} próximos na agenda`;
    return `${proximosCount} evento${proximosCount !== 1 ? "s" : ""} próximo${proximosCount !== 1 ? "s" : ""} en agenda`;
  })();

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">
          {t("nav.inicio", "Inicio")}
        </Link>
        <span>›</span>
        <span className="text-[var(--color-dark)] font-bold">{zonaNombre}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
            {tipoTraducido}
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
          {tituloH1}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{countText}</p>
      </div>
    </>
  );
}

export function ZonaPageSectionTitleClient() {
  const { t } = useLanguage();
  return (
    <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--color-dark)]">
      {t("eventos_page.seccion_proximos", "Próximos Eventos (Hoy y siguientes días)")}
    </h2>
  );
}

export function ZonaPageBackLinkClient() {
  const { t } = useLanguage();
  return (
    <Link
      href="/"
      className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-purple-1)] transition-colors"
    >
      ← {t("common.volver_inicio", "Volver al inicio")}
    </Link>
  );
}
