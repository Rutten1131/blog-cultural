import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/types";
import {
  EventoCardFeatured,
  EventoCardHorizontal,
  EstadoVacioEvento,
} from "@/components/EventoListCard";
import { Navbar } from "@/components/Navbar";
import { CategoryTicker } from "@/components/CategoryTicker";
import { UltimosEventosSection } from "@/components/UltimosEventosSection";
import { ProximosEventosCarousel } from "@/components/ProximosEventosCarousel";

export const revalidate = 60;

/* ── Datos de categorías con emojis y color de acento ── */
const CAT_META: Record<string, { emoji: string; color: string; bg: string }> = {
  "arte-y-exposiciones": { emoji: "🎨", color: "#7c3aed", bg: "from-violet-500/20 to-purple-500/10" },
  teatro:               { emoji: "🎭", color: "#ec4899", bg: "from-pink-500/20 to-rose-500/10" },
  musica:               { emoji: "🎵", color: "#3b82f6", bg: "from-blue-500/20 to-indigo-500/10"  },
  ferias:               { emoji: "🏮", color: "#f59e0b", bg: "from-amber-500/20 to-orange-500/10" },
  "artes-vivas":        { emoji: "✨", color: "#10b981", bg: "from-emerald-500/20 to-teal-500/10" },
};

/* ── Blob SVG decorativo ── */
function BlobDecorativo({
  className = "",
  variant = 1,
}: {
  className?: string;
  variant?: 1 | 2;
}) {
  if (variant === 2) {
    return (
      <svg
        viewBox="0 0 600 500"
        xmlns="http://www.w3.org/2000/svg"
        className={`blob-float-delay ${className}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="blob2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#a78bfa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path
          d="M300,80 C420,60 520,140 510,260 C500,380 400,440 280,430 C160,420 60,360 70,240 C80,120 180,100 300,80 Z"
          fill="url(#blob2)"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 600 500"
      xmlns="http://www.w3.org/2000/svg"
      className={`blob-float ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="blob1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#ec4899" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path
        d="M320,50 C460,30 560,130 545,270 C530,410 420,480 280,460 C140,440 30,360 50,220 C70,80 180,70 320,50 Z"
        fill="url(#blob1)"
      />
    </svg>
  );
}

/* ── Sección por categoría ── */
async function SeccionCategoria({
  slug,
  nombre,
  blobVariant,
}: {
  slug: string;
  nombre: string;
  blobVariant: 1 | 2;
}) {
  const eventos = await prisma.evento.findMany({
    where: { estado: "APROBADO", fecha: { gte: new Date() }, categoria: { slug } },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
    take: 5,
  });

  const meta = CAT_META[slug] ?? { emoji: "🎭", color: "#7c3aed", bg: "from-purple-500/20 to-violet-500/10" };

  return (
    <section className="relative w-full overflow-hidden" aria-label={`Sección ${nombre}`}>
      {/* Blob decorativo de fondo */}
      <BlobDecorativo
        variant={blobVariant}
        className="pointer-events-none absolute -right-32 top-0 w-[420px] opacity-60 md:w-[520px]"
      />

      <div className="relative z-10">
        {/* Header de sección */}
        <div className="mb-6 flex items-baseline gap-4">
          <h2
            className="font-display text-5xl font-black uppercase tracking-tighter leading-none sm:text-6xl md:text-7xl"
            style={{ color: meta.color }}
          >
            {nombre.split(" ")[0]}
          </h2>
          <span className="hidden text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)] sm:block">
            {nombre.includes(" ") ? nombre.split(" ").slice(1).join(" ") : "Próximos eventos"}
          </span>
        </div>

        {eventos.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No hay eventos próximos en esta categoría por el momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {/* Featured card (primera) */}
            <div className="lg:hidden">
              <EventoCardFeatured evento={eventos[0]} />
            </div>
            {/* Layout desktop: featured grande + lista */}
            <div className="hidden lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-6">
              <EventoCardFeatured evento={eventos[0]} />
              <div className="flex flex-col gap-3">
                {eventos.slice(1).map((ev) => (
                  <EventoCardHorizontal key={ev.id} evento={ev} />
                ))}
              </div>
            </div>
            {/* Resto en móvil */}
            <div className="lg:hidden flex flex-col gap-3">
              {eventos.slice(1).map((ev) => (
                <EventoCardHorizontal key={ev.id} evento={ev} />
              ))}
            </div>
          </div>
        )}

        {/* Ver todos */}
        <div className="mt-5">
          <Link
            href={`/eventos/categoria/${slug}`}
            className="inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5"
            style={{ borderColor: meta.color, color: meta.color }}
          >
            Ver todo en {nombre}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   PAGE — Homepage Magazine
══════════════════════════════════════════════════ */
export default async function Home() {
  // Próximos eventos ordenados por fecha (hasta 12 para el carrusel)
  const destacados = await prisma.evento.findMany({
    where: { estado: "APROBADO", fecha: { gte: new Date() } },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
    take: 12,
  });

  // Últimos eventos publicados (ordenados por fecha de creación descendente)
  const ultimosEventos = await prisma.evento.findMany({
    where: { estado: "APROBADO" },
    include: { categoria: true, zona: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-bg)" }}>
      {/* ── Navbar flotante ── */}
      <Navbar />

      <main className="flex flex-1 flex-col" id="main-content">

        {/* ═══════════════════════════════
            HERO — Eventos destacados
        ═══════════════════════════════ */}
        <section
          className="relative w-full overflow-hidden pb-12 pt-28 sm:pt-32"
          aria-label="Eventos destacados"
        >
          {/* Blob de fondo hero */}
          <BlobDecorativo
            className="pointer-events-none absolute -left-40 top-0 w-[600px] opacity-40 md:opacity-50"
            variant={1}
          />
          <BlobDecorativo
            className="pointer-events-none absolute -right-40 bottom-0 w-[500px] opacity-30 md:opacity-40"
            variant={2}
          />

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
            {/* Eyebrow */}
            <div className="mb-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-coral)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-coral)]" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Próximos eventos
              </span>
            </div>

            {/* Título hero */}
            <h1 className="font-display mb-10 text-5xl font-black uppercase leading-none tracking-tighter text-[var(--color-dark)] sm:text-6xl md:text-7xl lg:text-8xl fade-up">
              Agenda{" "}
              <span className="text-gradient-purple">Cultural</span>
              <br />
              <span className="text-3xl font-bold sm:text-4xl md:text-5xl">Loja</span>
            </h1>

            {/* Carrusel de próximos eventos ordenados por fecha */}
            {destacados.length > 0 ? (
              <div className="relative px-1">
                <ProximosEventosCarousel eventos={destacados} />
              </div>
            ) : (
              <EstadoVacioEvento mensaje="No hay eventos próximos publicados todavía." />
            )}

            {/* CTA secundario */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/eventos"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-dark)] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[var(--color-purple-1)] hover:shadow-[0_12px_28px_-8px_rgba(109,40,217,0.5)]"
              >
                Ver todos los eventos
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════
            CATEGORY PILLS
        ═══════════════════════════════ */}
        <section className="w-full py-8 sm:py-10" aria-label="Explorar por categoría">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Explorar por categoría
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {CATEGORIAS.map((cat) => {
                const meta = CAT_META[cat.slug] ?? { emoji: "🎭", color: "#7c3aed", bg: "from-purple-500/20 to-violet-500/10" };
                return (
                  <Link
                    key={cat.slug}
                    href={`/eventos/categoria/${cat.slug}`}
                    className="sheen-hover group inline-flex items-center gap-2.5 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
                    style={{ "--hover-color": meta.color } as React.CSSProperties}
                  >
                    <span className="text-xl">{meta.emoji}</span>
                    <span className="font-display text-sm font-black uppercase tracking-wide text-[var(--color-dark)] transition-colors group-hover:text-[var(--color-purple-1)]">
                      {cat.nombre}
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 text-[var(--color-purple-1)]"
                      aria-hidden="true"
                    >
                      <path d="m9 5 7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════
            ÚLTIMOS EVENTOS PUBLICADOS + BUSCADOR
        ═══════════════════════════════ */}
        <UltimosEventosSection eventos={ultimosEventos} />

        {/* ═══════════════════════════════
            TICKER MARQUEE
        ═══════════════════════════════ */}
        <CategoryTicker />

        {/* ═══════════════════════════════
            SECCIONES POR CATEGORÍA
        ═══════════════════════════════ */}
        <div className="mx-auto w-full max-w-6xl space-y-20 px-4 py-16 sm:px-6 sm:py-20">
          {CATEGORIAS.map((cat, i) => (
            <SeccionCategoria
              key={cat.slug}
              slug={cat.slug}
              nombre={cat.nombre}
              blobVariant={i % 2 === 0 ? 1 : 2}
            />
          ))}
        </div>

        {/* ═══════════════════════════════
            FOOTER
        ═══════════════════════════════ */}
        <footer className="mt-auto bg-[var(--color-dark)] text-white">
          {/* Decorative top border */}
          <div
            className="h-1 w-full"
            style={{ background: "var(--grad-blob-1)" }}
            aria-hidden="true"
          />
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
              {/* Brand */}
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-display text-2xl font-black uppercase tracking-tight">
                    Agenda Cultural
                  </p>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-violet)]">
                    Loja · Ecuador
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-white/60">
                  El directorio de eventos culturales de Loja. Arte, teatro, música,
                  ferias y artes vivas en un solo lugar.
                </p>
              </div>

              {/* Categorías */}
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                  Categorías
                </p>
                <ul className="space-y-2">
                  {CATEGORIAS.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/eventos/categoria/${cat.slug}`}
                        className="text-sm font-medium text-white/70 transition-colors hover:text-white"
                      >
                        {CAT_META[cat.slug]?.emoji} {cat.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Información */}
              <div className="flex flex-col gap-4">
                <p className="mb-0 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                  Agenda Cultural
                </p>
                <p className="text-sm leading-relaxed text-white/60">
                  Descubre las mejores actividades, exposiciones, obras y conciertos en Loja, Ecuador.
                </p>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 sm:flex-row">
              <p className="text-xs text-white/30">
                © {new Date().getFullYear()} Agenda Cultural Loja. Todos los derechos reservados.
              </p>
              <Link
                href="/admin/login"
                className="text-xs text-white/20 transition-colors hover:text-white/50"
              >
                Admin
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

