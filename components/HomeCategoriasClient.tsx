"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProximosEventosCarousel } from "@/components/ProximosEventosCarousel";

/* ── Tipos ── */
interface Evento {
  id: number;
  slug: string;
  nombre: string;
  fecha: Date | string;
  lugar: string;
  imagenUrl: string | null;
  categoria: { nombre: string; slug: string } | null;
  zona: { nombre: string } | null;
}

interface CategoriaConEventos {
  slug: string;
  /** nombre en ES (para la key de cat.*) */
  slugKey: string;
  color: string;
  bg: string;
  emoji: string;
  image: string;
  eventos: Evento[];
  blobVariant: 1 | 2;
}

interface HomeCategoriasClientProps {
  categorias: CategoriaConEventos[];
}

/* ── Blobs decorativos ── */
function BlobDecorativo({ className = "", variant = 1 }: { className?: string; variant?: 1 | 2 }) {
  if (variant === 2) {
    return (
      <svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg" className={`blob-float-delay ${className}`} aria-hidden="true">
        <defs>
          <linearGradient id="blob2c" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#a78bfa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path d="M300,80 C420,60 520,140 510,260 C500,380 400,440 280,430 C160,420 60,360 70,240 C80,120 180,100 300,80 Z" fill="url(#blob2c)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg" className={`blob-float ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id="blob1c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#ec4899" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path d="M320,50 C460,30 560,130 545,270 C530,410 420,480 280,460 C140,440 30,360 50,220 C70,80 180,70 320,50 Z" fill="url(#blob1c)" />
    </svg>
  );
}

/* ── Mapeo de slugs a claves de traducción ── */
const SLUG_TO_KEYS: Record<string, { cat: string; h2: string; seo: string }> = {
  "arte-y-exposiciones": { cat: "cat.arte", h2: "scat.h2.arte", seo: "scat.seo.arte" },
  teatro:               { cat: "cat.teatro", h2: "scat.h2.teatro", seo: "scat.seo.teatro" },
  musica:               { cat: "cat.musica", h2: "scat.h2.musica", seo: "scat.seo.musica" },
  ferias:               { cat: "cat.ferias", h2: "scat.h2.ferias", seo: "scat.seo.ferias" },
  "artes-vivas":        { cat: "cat.artes_vivas", h2: "scat.h2.artes_vivas", seo: "scat.seo.artes_vivas" },
};

/* ── Sección individual por categoría (client) ── */
function SeccionCategoriaClient({ cat }: { cat: CategoriaConEventos }) {
  const { t } = useLanguage();
  const keys = SLUG_TO_KEYS[cat.slug] ?? { cat: "cat.arte", h2: "scat.h2.arte", seo: "scat.seo.arte" };
  const nombre = t(keys.cat);
  const preguntaH2 = t(keys.h2);
  const respuestaSeo = t(keys.seo);

  return (
    <section className="relative w-full overflow-hidden pt-4" aria-label={`Sección ${nombre}`}>
      {/* Blob decorativo de fondo */}
      <BlobDecorativo
        variant={cat.blobVariant}
        className="pointer-events-none absolute -right-32 top-0 w-[420px] opacity-60 md:w-[520px]"
      />

      <div className="relative z-10">
        {/* Header de sección con H2 orientado a intención de búsqueda */}
        <div className="mb-6 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{cat.emoji}</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {nombre}
            </span>
          </div>
          <h2
            className="font-display text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight leading-tight"
            style={{ color: cat.color }}
          >
            {preguntaH2}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed max-w-3xl">
            {respuestaSeo}
          </p>
        </div>

        {cat.eventos.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t("scat.sin_eventos")}
          </p>
        ) : (
          <div className="relative my-4">
            <ProximosEventosCarousel eventos={cat.eventos} />
          </div>
        )}

        {/* Ver todos */}
        <div className="mt-5">
          <Link
            href={`/eventos/categoria/${cat.slug}`}
            className="inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5"
            style={{ borderColor: cat.color, color: cat.color }}
          >
            {t("scat.ver_todo")} {nombre}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Sección "Explorar por Categorías" (tarjetas visuales) ── */
function ExplorarCategoriasClient({ categorias }: { categorias: CategoriaConEventos[] }) {
  const { t } = useLanguage();

  return (
    <section className="w-full py-10 sm:py-14" aria-label="Explorar por categoría">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-purple-1)]">
            {t("home.explorar_disciplinas")}
          </span>
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--color-dark)] sm:text-3xl">
            {t("home.explorar_titulo")}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categorias.map((cat) => {
            const keys = SLUG_TO_KEYS[cat.slug];
            const nombre = keys ? t(keys.cat) : cat.slug;
            return (
              <Link
                key={cat.slug}
                href={`/eventos/categoria/${cat.slug}`}
                className="group relative flex h-44 sm:h-48 flex-col justify-end overflow-hidden rounded-2xl border border-white/20 p-4 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-white/40"
              >
                {/* Imagen de fondo */}
                <img
                  src={cat.image}
                  alt={nombre}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Degradado oscuro */}
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.bg} opacity-80 transition-opacity duration-300 group-hover:opacity-70`} />

                {/* Contenido sobrepuesto */}
                <div className="relative z-10">
                  <span className="mb-1 inline-block text-2xl drop-shadow-md transition-transform duration-300 group-hover:scale-110">
                    {cat.emoji}
                  </span>
                  <h3 className="font-display text-base font-black uppercase tracking-tight text-white drop-shadow-sm">
                    {nombre}
                  </h3>
                  <p className="mt-0.5 flex items-center justify-between text-[11px] font-bold text-white/80">
                    <span>{t("home.ver_agenda")}</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Footer del Home ── */
export function HomeFooterClient({ categorias }: { categorias: CategoriaConEventos[] }) {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto bg-[var(--color-dark)] text-white">
      {/* Decorative top border */}
      <div className="h-1 w-full" style={{ background: "var(--grad-blob-1)" }} aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:gap-10 text-center sm:grid-cols-3 sm:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-2 sm:gap-3">
            <div>
              <p className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight">
                Agenda Cultural
              </p>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-violet)]">
                Loja · Ecuador
              </p>
            </div>
            <p className="text-xs leading-relaxed text-white/60 max-w-xs">
              {t("footer.descripcion")}
            </p>
          </div>

          {/* Categorías */}
          <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
            <p className="mb-2 sm:mb-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              {t("footer.categorias")}
            </p>
            <ul className="grid grid-cols-2 sm:flex sm:flex-col gap-x-2 gap-y-1.5 sm:gap-y-2 text-center sm:text-left w-full max-w-xs sm:max-w-none">
              {categorias.map((cat, idx) => {
                const keys = SLUG_TO_KEYS[cat.slug];
                const nombre = keys ? t(keys.cat) : cat.slug;
                return (
                  <li
                    key={cat.slug}
                    className={idx === categorias.length - 1 ? "col-span-2 sm:col-span-1 text-center sm:text-left" : ""}
                  >
                    <Link
                      href={`/eventos/categoria/${cat.slug}`}
                      className="inline-block py-0.5 px-1 sm:p-0 text-xs font-medium text-white/70 transition-colors hover:text-white"
                    >
                      {cat.emoji} {nombre}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Información */}
          <div className="flex flex-col items-center sm:items-start gap-1.5 sm:gap-3">
            <p className="mb-0 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              {t("footer.info")}
            </p>
            <p className="text-xs leading-relaxed text-white/60 max-w-xs">
              {t("footer.info_desc")}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 sm:mt-10 flex flex-col items-center justify-center gap-2 border-t border-white/10 pt-4 sm:pt-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-white/70">
            <Link href="/sobre-el-proyecto" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              {t("footer.sobre")}
            </Link>
            <span>•</span>
            <Link href="/publicar" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              {t("footer.publicar")}
            </Link>
          </div>
          <p className="text-[11px] sm:text-[12px] text-white/50">
            {t("footer.creditos")}{" "}
            <a
              href="https://www.cesarreyesjaramillo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white/80 transition-colors hover:text-white hover:underline"
            >
              César Reyes Jaramillo
            </a>{" "}
            | Agenda Cultural Loja {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ── Componente principal — agrupa Explorar + Secciones ── */
export function HomeCategoriasClient({ categorias }: HomeCategoriasClientProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* ═══ CATEGORY CARDS ═══ */}
      <ExplorarCategoriasClient categorias={categorias} />

      {/* ═══ SECCIONES POR CATEGORÍA ═══ */}
      <div className="mx-auto w-full max-w-6xl space-y-20 px-4 py-16 sm:px-6 sm:py-20">
        {categorias.map((cat) => (
          <SeccionCategoriaClient key={cat.slug} cat={cat} />
        ))}
      </div>
    </>
  );
}
