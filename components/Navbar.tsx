"use client";
import Link from "next/link";
import { useState } from "react";

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

const NAV_LINKS = [
  { href: "/",                                      label: "Inicio" },
  { href: "/eventos/categoria/arte-y-exposiciones", label: "Arte" },
  { href: "/eventos/categoria/teatro",              label: "Teatro" },
  { href: "/eventos/categoria/musica",              label: "Música" },
  { href: "/eventos/categoria/ferias",              label: "Ferias" },
  { href: "/eventos/categoria/artes-vivas",         label: "Artes Vivas" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 px-4 sm:top-4 sm:px-6">
      <nav className="pointer-events-auto relative mx-auto flex max-w-6xl items-center justify-between gap-3">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="sheen-hover inline-flex shrink-0 items-center gap-2.5 overflow-hidden rounded-2xl border border-white/80 bg-white/80 px-3 py-2 shadow-[var(--shadow-nav)] backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(109,40,217,0.28)]"
          aria-label="Agenda Cultural Loja — Inicio"
        >
          <LogoGeometrico className="h-8 w-8 shrink-0" />
          <span className="hidden sm:flex flex-col leading-none">
            <span className="font-display text-[15px] font-black uppercase tracking-wider text-[var(--color-dark)]">
              Agenda Cultural
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-purple-1)]">
              Loja
            </span>
          </span>
        </Link>

        {/* ── Nav links desktop ── */}
        <div className="hidden md:inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/80 px-2 py-1.5 shadow-[var(--shadow-nav)] backdrop-blur-md transition-all duration-300 hover:border-white">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative inline-flex h-8 items-center overflow-hidden rounded-full px-3.5 text-sm font-semibold text-[var(--color-muted)] transition-all duration-300 hover:-translate-y-px hover:text-[var(--color-purple-1)]"
            >
              <span className="absolute inset-0 origin-left scale-x-0 rounded-full bg-purple-50 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* ── Publicar CTA ── */}
        <Link
          href="/publicar"
          className="sheen-hover hidden sm:inline-flex items-center gap-2 rounded-full bg-[var(--color-purple-1)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(109,40,217,0.5)] ring-1 ring-purple-900/20 transition-all duration-300 hover:bg-[var(--color-purple-2)] hover:shadow-[0_14px_32px_-8px_rgba(109,40,217,0.65)] active:scale-[0.97]"
        >
          <span>+ Publicar evento</span>
        </Link>

        {/* ── Hamburger mobile ── */}
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/80 shadow-[var(--shadow-nav)] backdrop-blur-md transition-all duration-200 hover:bg-white"
        >
          <span className="relative block h-[14px] w-[18px]">
            <span className={`absolute left-0 right-0 top-0 h-[2px] rounded-full bg-[var(--color-dark)] transition-transform duration-300 origin-center ${open ? "translate-y-[6px] rotate-45" : ""}`} />
            <span className={`absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[var(--color-dark)] transition-all duration-200 ${open ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`absolute left-0 right-0 bottom-0 h-[2px] rounded-full bg-[var(--color-dark)] transition-transform duration-300 origin-center ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
          </span>
        </button>

        {/* ── Mobile menu dropdown ── */}
        {open && (
          <div className="absolute right-0 top-full mt-3 w-56 origin-top-right rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_18px_48px_-12px_rgba(109,40,217,0.2)] backdrop-blur-md md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-purple-50 hover:text-[var(--color-purple-1)]"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-1 pt-1 border-t border-[var(--color-border)]">
              <Link
                href="/publicar"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-xl bg-[var(--color-purple-1)] px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-purple-2)]"
              >
                + Publicar evento
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
