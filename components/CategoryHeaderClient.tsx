"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Props {
  categoriaSlug: string;
  categoriaNombreDefault: string;
  tituloH1Default: string;
  preguntaH2Default: string;
  descripcionSeoDefault: string;
  proximosCount: number;
  totalCount: number;
}

const SLUG_TO_KEYS: Record<string, { cat: string; h2: string; seo: string }> = {
  "arte-y-exposiciones": { cat: "cat.arte", h2: "scat.h2.arte", seo: "scat.seo.arte" },
  teatro:               { cat: "cat.teatro", h2: "scat.h2.teatro", seo: "scat.seo.teatro" },
  musica:               { cat: "cat.musica", h2: "scat.h2.musica", seo: "scat.seo.musica" },
  ferias:               { cat: "cat.ferias", h2: "scat.h2.ferias", seo: "scat.seo.ferias" },
  "artes-vivas":        { cat: "cat.artes_vivas", h2: "scat.h2.artes_vivas", seo: "scat.seo.artes_vivas" },
};

export function CategoryHeaderClient({
  categoriaSlug,
  categoriaNombreDefault,
  tituloH1Default,
  preguntaH2Default,
  descripcionSeoDefault,
  proximosCount,
  totalCount,
}: Props) {
  const { t, locale } = useLanguage();
  const keys = SLUG_TO_KEYS[categoriaSlug];

  const nombreCategoria = keys ? t(keys.cat, categoriaNombreDefault) : categoriaNombreDefault;
  const preguntaH2 = keys ? t(keys.h2, preguntaH2Default) : preguntaH2Default;
  const descripcionSeo = keys ? t(keys.seo, descripcionSeoDefault) : descripcionSeoDefault;

  // H1 dinámico según idioma
  let tituloH1 = tituloH1Default;
  if (locale === "en") {
    tituloH1 = `${nombreCategoria} Events in Loja`;
  } else if (locale === "fr") {
    tituloH1 = `Événements de ${nombreCategoria} à Loja`;
  } else if (locale === "de") {
    tituloH1 = `Veranstaltungen für ${nombreCategoria} in Loja`;
  } else if (locale === "pt") {
    tituloH1 = `Eventos de ${nombreCategoria} em Loja`;
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">
          {t("nav.inicio", "Inicio")}
        </Link>
        <span>›</span>
        <span className="text-[var(--color-dark)] font-bold">{nombreCategoria}</span>
      </nav>

      {/* Encabezado H1 y H2 SEO con Respuesta Corta */}
      <div className="mb-10 space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-100 dark:bg-purple-950 px-3 py-1 text-xs font-bold uppercase text-[var(--color-purple-1)]">
            {t("cat.header_badge", "Categoría Cultural")}
          </span>
          <span className="text-xs text-[var(--color-muted)] font-medium">
            {proximosCount} {t("cat.proximos", "próximos")} · {totalCount} {t("cat.total", "en total")}
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
          {tituloH1}
        </h1>

        <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--color-purple-1)] pt-1">
          {preguntaH2}
        </h2>

        <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed max-w-3xl">
          {descripcionSeo}
        </p>
      </div>
    </>
  );
}

export function CategorySectionTitleClient({
  defaultText = "Próximos Eventos en Cartelera (Hoy y siguientes días)",
}: {
  defaultText?: string;
}) {
  const { t } = useLanguage();
  return (
    <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--color-dark)]">
      {t("section.proximos_cartelera", defaultText)}
    </h3>
  );
}

export function CategoryBackButtonClient() {
  const { t } = useLanguage();
  return (
    <Link
      href="/"
      className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-purple-1)] transition-colors"
    >
      ← {t("cat.ver_todas_categorias", "Ver todas las categorías")}
    </Link>
  );
}