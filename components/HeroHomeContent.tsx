"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function HeroHomeContent() {
  const { t } = useLanguage();

  return (
    <>
      {/* ── EN DESKTOP: Columna izquierda de Textos y CTA ── */}
      <div className="flex flex-col justify-center gap-5 pt-2">
        {/* Eyebrow */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-coral)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-coral)]" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {t("hero.eyebrow", "Descubre qué está pasando en Loja")}
          </span>
        </div>

        {/* Título hero H1 */}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black uppercase leading-tight tracking-tight text-[var(--color-dark)] fade-up">
          {t("hero.h1_prefix", "¿Qué hacer")}{" "}
          <span className="text-gradient-purple">{t("hero.h1_suffix", "en Loja?")}</span>
          <span className="block text-sm md:text-base lg:text-lg font-bold text-[var(--color-muted)] normal-case tracking-normal mt-2">
            {t("hero.subtitulo", "Eventos, arte y actividades culturales en la ciudad")}
          </span>
        </h1>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 mt-2">
          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-dark)] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[var(--color-purple-1)] hover:shadow-[0_12px_28px_-8px_rgba(109,40,217,0.5)]"
          >
            {t("hero.btn_ver_todos", "Ver todos los eventos")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
            </svg>
          </Link>
          <Link
            href="/publicar"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-purple-1)] px-6 py-3 text-sm font-bold text-[var(--color-purple-1)] transition-all duration-300 hover:bg-[var(--color-purple-1)] hover:text-white"
          >
            {t("hero.btn_publicar", "Publicar evento")}
          </Link>
        </div>
      </div>

      {/* ── EN MODO CELULAR ── */}
      <div className="sm:hidden mb-4 flex flex-col items-center gap-2 text-center">
        <h2 className="font-display text-2xl font-black uppercase leading-tight tracking-tight text-[var(--color-dark)]">
          {t("hero.h1_prefix", "¿Qué hacer")}{" "}
          <span className="text-gradient-purple">{t("hero.h1_suffix", "en Loja?")}</span>
        </h2>
        <p className="text-xs font-semibold text-[var(--color-muted)]">
          {t("hero.subtitulo", "Eventos, arte y actividades culturales en la ciudad")}
        </p>
      </div>
    </>
  );
}
