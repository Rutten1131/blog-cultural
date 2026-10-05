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

/* ── Metadatos visuales por categoría (imágenes hero en alta resolución y colores) ── */
const CAT_HERO_VISUALS: Record<
  string,
  {
    image: string;
    emoji: string;
    color: string;
    bgGradient: string;
    tagline: string;
  }
> = {
  "arte-y-exposiciones": {
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=85",
    emoji: "🎨",
    color: "#7c3aed",
    bgGradient: "from-purple-950/90 via-slate-950/75 to-purple-950/90",
    tagline: "Galerías, Pintura, Fotografía & Escultura",
  },
  teatro: {
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1600&q=85",
    emoji: "🎭",
    color: "#ec4899",
    bgGradient: "from-pink-950/90 via-slate-950/75 to-pink-950/90",
    tagline: "Artes Escénicas, Dramaturgia & Salas Teatrales",
  },
  musica: {
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=85",
    emoji: "🎵",
    color: "#3b82f6",
    bgGradient: "from-blue-950/90 via-slate-950/75 to-blue-950/90",
    tagline: "Conciertos, Sinfónica, Recitales & Festivales",
  },
  ferias: {
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1600&q=85",
    emoji: "🏮",
    color: "#f59e0b",
    bgGradient: "from-amber-950/90 via-slate-950/75 to-amber-950/90",
    tagline: "Emprendimientos, Gastronomía & Tradición",
  },
  "artes-vivas": {
    image: "/artes-vivas-loja.jpg",
    emoji: "✨",
    color: "#10b981",
    bgGradient: "from-emerald-950/90 via-slate-950/75 to-emerald-950/90",
    tagline: "Danza, Performance, Mimo & Teatro de Calle",
  },
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
  const visual = CAT_HERO_VISUALS[categoriaSlug] ?? CAT_HERO_VISUALS["arte-y-exposiciones"];

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
  } else if (locale === "ko") {
    tituloH1 = `로하 ${nombreCategoria} 행사 및 축제`;
  }

  return (
    <>
      {/* ── Breadcrumb de navegación ── */}
      <nav className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">
          {t("nav.inicio", "Inicio")}
        </Link>
        <span>›</span>
        <span className="text-[var(--color-dark)] font-bold">{nombreCategoria}</span>
      </nav>

      {/* ── HERO HEADER DE CATEGORÍA: FOTOGRAFÍA NÍTIDA Y TEXTO SEPARADOS ── */}
      <div className="relative mb-12 w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(0,0,0,0.06)] p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Columna de Texto (Legible, Limpio, Profesional) */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm"
                style={{ backgroundColor: visual.color }}
              >
                <span className="text-sm">{visual.emoji}</span>
                <span>{visual.tagline}</span>
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                {proximosCount} {t("cat.proximos", "próximos")} · {totalCount} {t("cat.total", "en total")}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 leading-tight">
              {tituloH1}
            </h1>

            <h2
              className="font-display text-base sm:text-lg md:text-xl font-bold tracking-tight"
              style={{ color: visual.color }}
            >
              {preguntaH2}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {descripcionSeo}
            </p>
          </div>

          {/* Columna de Imagen (Completamente Nítida, Sin oscurecer el texto) */}
          <div className="lg:col-span-5 relative w-full h-56 sm:h-64 md:h-72 rounded-2xl overflow-hidden shadow-md group">
            <img
              src={visual.image}
              alt={nombreCategoria}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            {/* Borde sutil y brillo */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10" />
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
              {visual.emoji} {nombreCategoria}
            </div>
          </div>

        </div>
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