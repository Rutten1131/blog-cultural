"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Props {
  proximosCount: number;
}

export function EventosPageHeaderClient({ proximosCount }: Props) {
  const { t } = useLanguage();

  const desc = proximosCount > 0
    ? t("eventos_page.proximos_desc", "Explora los {n} eventos próximos en agenda o toca un día en el calendario interactivo.").replace("{n}", String(proximosCount))
    : t("eventos_page.sin_proximos", "No hay eventos próximos en este momento.");

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">
          {t("nav.inicio", "Inicio")}
        </Link>
        <span>›</span>
        <span className="text-[var(--color-dark)] font-bold">
          {t("eventos_page.breadcrumb_todos", "Todos los eventos")}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
          {t("eventos_page.titulo", "Cartelera y Calendario Cultural")}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{desc}</p>
      </div>
    </>
  );
}

export function EventosPageSectionTitleClient() {
  const { t } = useLanguage();
  return (
    <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--color-dark)]">
      {t("eventos_page.seccion_proximos", "Eventos Próximos (Hoy y siguientes fechas)")}
    </h2>
  );
}
