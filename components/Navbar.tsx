"use client";
import Link from "next/link";
import { useState } from "react";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/** Logo geométrico SVG — formas superpuestas (rect + circle + triangle) en gradiente púrpura */
function LogoGeometrico({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="grad-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* Rectángulo de fondo (teatro / escenario) */}
      <rect x="4" y="10" width="22" height="26" rx="3" fill="url(#grad-logo)" opacity="0.9" />
      {/* Círculo (arte / mirada) */}
      <circle cx="27" cy="16" r="10" fill="#ec4899" opacity="0.75" />
      {/* Triángulo (música / acústica) */}
      <polygon points="14,6 34,6 24,22" fill="#3b82f6" opacity="0.7" />
    </svg>
  );
}

const MAIN_NAV_LEFT = [
  { href: "/",                           key: "nav.inicio",       fallback: "Inicio" },
  { href: "/eventos/esta-semana",        key: "nav.esta_semana",  fallback: "Esta Semana" },
  { href: "/eventos/este-fin-de-semana", key: "nav.fin_semana",   fallback: "Fin de Semana" },
];

const CATEGORIAS_MENU = [
  { href: "/eventos/categoria/arte-y-exposiciones", key: "nav.arte",        fallback: "Arte y Exposiciones", emoji: "🎨", color: "from-purple-500/20 to-violet-500/20", border: "hover:border-purple-400" },
  { href: "/eventos/categoria/teatro",              key: "nav.teatro",      fallback: "Teatro",              emoji: "🎭", color: "from-pink-500/20 to-rose-500/20",     border: "hover:border-pink-400" },
  { href: "/eventos/categoria/musica",              key: "nav.musica",      fallback: "Música",              emoji: "🎵", color: "from-blue-500/20 to-indigo-500/20",   border: "hover:border-blue-400" },
  { href: "/eventos/categoria/ferias",              key: "nav.ferias",      fallback: "Ferias",              emoji: "🏮", color: "from-amber-500/20 to-orange-500/20",  border: "hover:border-amber-400" },
  { href: "/festival-artes-vivas-loja-2026",        key: "nav.artes_vivas", fallback: "Artes Vivas",         emoji: "✨", color: "from-emerald-500/20 to-teal-500/20",   border: "hover:border-emerald-400" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [catHover, setCatHover] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="fixed inset-x-0 top-2.5 z-50 px-2.5 sm:top-4 sm:px-6">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl sm:rounded-full bg-white/95 px-3 py-2 sm:px-5 sm:py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-xl border border-white/80 transition-all">
        
        {/* ── Nuevo Logo Oficial ── */}
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
          aria-label="Agenda Cultural Loja — Inicio"
        >
          <img
            src="/nuevo-logo-agenda.jpg"
            alt="Agenda Cultural Loja"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-contain shadow-sm border border-slate-100"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[13px] sm:text-[15px] font-black uppercase tracking-tight text-slate-900">
              Agenda Cultural
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-purple-700">
              Loja
            </span>
          </span>
        </Link>

        {/* ── Nav Links con Desplegable / Acordeón Hover para Categorías (Desktop) ── */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-3 py-1 gap-1 xl:gap-2">
          {MAIN_NAV_LEFT.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative shrink-0 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 transition-all duration-200 hover:text-purple-700 hover:bg-purple-50 active:scale-95"
            >
              <span>{t(item.key, item.fallback)}</span>
            </Link>
          ))}

          {/* ── ACORDEÓN / DESPLEGABLE DE CATEGORÍAS (HOVER) ── */}
          <div
            className="relative"
            onMouseEnter={() => setCatHover(true)}
            onMouseLeave={() => setCatHover(false)}
          >
            <button
              type="button"
              className={`group relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                catHover
                  ? "bg-purple-100 text-purple-800 shadow-sm"
                  : "text-slate-700 hover:text-purple-700 hover:bg-purple-50"
              }`}
            >
              <span>Categorías</span>
              <svg
                className={`h-3 w-3 text-purple-600 transition-transform duration-300 ${
                  catHover ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Menú acordeón desplegable flotante estilo blanco elegante */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 w-64 transition-all duration-200 z-50 ${
                catHover
                  ? "opacity-100 translate-y-0 pointer-events-auto visible"
                  : "opacity-0 -translate-y-2 pointer-events-none invisible"
              }`}
            >
              <div className="rounded-2xl border border-slate-200/80 bg-white/98 p-2 shadow-[0_20px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl flex flex-col gap-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 px-3 py-1 border-b border-slate-100">
                  Disciplinas Culturales
                </div>
                {CATEGORIAS_MENU.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="group/item flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:bg-purple-50 hover:text-purple-700 hover:translate-x-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base transition-transform group-hover/item:scale-125">
                        {cat.emoji}
                      </span>
                      <span>{t(cat.key, cat.fallback)}</span>
                    </div>
                    <span className="text-slate-400 group-hover/item:text-purple-700 transition-transform group-hover/item:translate-x-0.5">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/sobre-el-proyecto"
            className="group relative shrink-0 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 transition-all duration-200 hover:text-purple-700 hover:bg-purple-50 active:scale-95"
          >
            <span>{t("nav.sobre_proyecto", "Sobre el proyecto")}</span>
          </Link>
        </div>

        {/* ── Acciones a la derecha: Idioma & Botón Publicar ── */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* Selector de idioma */}
          <div className="hidden sm:inline-block">
            <LanguageSelector />
          </div>

          {/* CTA Publicar Púrpura Elegante */}
          <Link
            href="/publicar"
            className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span>{t("nav.publicar", "+ Publicar evento")}</span>
          </Link>

          {/* Selector pequeño en mobile */}
          <div className="sm:hidden">
            <LanguageSelector />
          </div>

          {/* ── Hamburger mobile ── */}
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-800 shadow-sm transition-all duration-200 hover:bg-slate-200"
          >
            <span className="relative block h-[12px] w-[16px]">
              <span className={`absolute left-0 right-0 top-0 h-[2px] rounded-full bg-slate-800 transition-transform duration-300 origin-center ${open ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-slate-800 transition-all duration-200 ${open ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`absolute left-0 right-0 bottom-0 h-[2px] rounded-full bg-slate-800 transition-transform duration-300 origin-center ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>

        {/* ── Mobile menu dropdown (Elegante Blanco) ── */}
        {open && (
          <div className="absolute right-2 top-full mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white/98 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-2xl lg:hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto no-scrollbar">
              {MAIN_NAV_LEFT.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                >
                  {t(item.key, item.fallback)}
                </Link>
              ))}

              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 px-3 pt-2 pb-1 border-t border-slate-100 mt-1">
                Categorías
              </div>

              {CATEGORIAS_MENU.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
                >
                  <span>{cat.emoji}</span>
                  <span>{t(cat.key, cat.fallback)}</span>
                </Link>
              ))}

              <Link
                href="/sobre-el-proyecto"
                onClick={() => setOpen(false)}
                className="flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-purple-50 hover:text-purple-700 border-t border-slate-100 mt-1"
              >
                {t("nav.sobre_proyecto", "Sobre el proyecto")}
              </Link>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100">
              <LanguageSelector variant="mobile" />
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100">
              <Link
                href="/publicar"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-700 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md"
              >
                {t("nav.publicar", "+ Publicar evento")}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}


