import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Eventos Artísticos en Loja — Agenda Cultural Ecuador",
  description:
    "Descubrí qué eventos artísticos hay en Loja. Cartelera actualizada con obras de teatro, conciertos de música, exposiciones de arte, ferias y artes vivas.",
  keywords: [
    "Eventos artísticos en Loja",
    "Qué eventos artísticos hay en Loja",
    "Agenda cultural Loja",
    "Teatro en Loja",
    "Conciertos de música Loja",
    "Exposiciones de arte Loja",
    "Ferias culturales Loja",
    "Artes Vivas Loja Ecuador",
  ],
  alternates: {
    canonical: "https://agendacultural-loja.com",
  },
  openGraph: {
    title: "Eventos Artísticos en Loja — Agenda Cultural",
    description:
      "Directorio completo de eventos artísticos, festivales y agenda cultural en Loja, Ecuador.",
    url: "https://agendacultural-loja.com",
    siteName: "Agenda Cultural Loja",
    locale: "es_EC",
    type: "website",
  },
};

/* ── Datos de categorías con imágenes de fondo, color de acento y respuestas SEO ── */
const CAT_META: Record<string, { emoji: string; color: string; bg: string; image: string }> = {
  "arte-y-exposiciones": {
    emoji: "🎨",
    color: "#7c3aed",
    bg: "from-purple-900/80 via-violet-900/60 to-purple-950/90",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
  },
  teatro: {
    emoji: "🎭",
    color: "#ec4899",
    bg: "from-pink-900/80 via-rose-900/60 to-pink-950/90",
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80",
  },
  musica: {
    emoji: "🎵",
    color: "#3b82f6",
    bg: "from-blue-900/80 via-indigo-900/60 to-blue-950/90",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
  },
  ferias: {
    emoji: "🏮",
    color: "#f59e0b",
    bg: "from-amber-900/80 via-orange-900/60 to-amber-950/90",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80",
  },
  "artes-vivas": {
    emoji: "✨",
    color: "#10b981",
    bg: "from-emerald-900/80 via-teal-900/60 to-emerald-950/90",
    image: "https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=600&q=80",
  },
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

  // Mapeo de preguntas H2 SEO por categoría
  const PREGUNTAS_H2: Record<string, string> = {
    "arte-y-exposiciones": "¿Qué eventos artísticos y exposiciones de arte existen en Loja?",
    teatro: "¿Qué obras de teatro y eventos teatrales se presentan en Loja?",
    musica: "¿Qué conciertos y eventos musicales hay en Loja?",
    ferias: "¿Qué ferias culturales y festivales se realizan en Loja?",
    "artes-vivas": "¿Qué eventos de Artes Vivas y expresiones escénicas hay en Loja?",
  };

  const preguntaH2 = PREGUNTAS_H2[slug] || `¿Qué eventos de ${nombre} existen en Loja?`;

  // Respuestas cortas optimizadas para SEO debajo del H2
  const RESPUESTAS_SEO: Record<string, string> = {
    "arte-y-exposiciones": "Explorá exposiciones de pintura, fotografía, escultura y galerías de arte abiertas al público en Loja.",
    teatro: "Encontrá cartelera de obras teatrales, microteatro, dramaturgia y presentaciones escénicas en los teatros de Loja.",
    musica: "Descubrí conciertos en vivo, recitales sinfónicos, festivales musicales y presentaciones acústicas en Loja.",
    ferias: "Descubrí ferias artesanales, emprendimientos culturales, festivales gastronómicos y mercados tradicionales en Loja.",
    "artes-vivas": "Viví los festivales internacionales y locales de artes vivas, danza, mimo y espectáculos callejeros en Loja.",
  };

  const respuestaSeo = RESPUESTAS_SEO[slug] || `Descubrí los mejores eventos culturales y artísticos de ${nombre} en Loja.`;

  return (
    <section className="relative w-full overflow-hidden pt-4" aria-label={`Sección ${nombre}`}>
      {/* Blob decorativo de fondo */}
      <BlobDecorativo
        variant={blobVariant}
        className="pointer-events-none absolute -right-32 top-0 w-[420px] opacity-60 md:w-[520px]"
      />

      <div className="relative z-10">
        {/* Header de sección con H2 orientado a intención de búsqueda y respuesta SEO */}
        <div className="mb-6 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.emoji}</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {nombre}
            </span>
          </div>
          <h2
            className="font-display text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight leading-tight"
            style={{ color: meta.color }}
          >
            {preguntaH2}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed max-w-3xl">
            {respuestaSeo}
          </p>
        </div>

        {eventos.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No hay eventos próximos en esta categoría por el momento.
          </p>
        ) : (
          <div className="relative my-4">
            <ProximosEventosCarousel eventos={eventos} />
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

  // Marcado estructurado JSON-LD (Schema.org) para la Home
  const jsonLdHome = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://agendacultural-loja.com/#website",
        url: "https://agendacultural-loja.com",
        name: "Agenda Cultural Loja",
        description: "Directorio de eventos artísticos y culturales en Loja, Ecuador",
        inLanguage: "es-EC",
      },
      {
        "@type": "ItemList",
        name: "Próximos Eventos Artísticos en Loja",
        itemListElement: destacados.map((ev, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Event",
            name: ev.nombre,
            startDate: new Date(ev.fecha).toISOString(),
            location: {
              "@type": "Place",
              name: ev.lugar,
              address: {
                "@type": "PostalAddress",
                addressLocality: "Loja",
                addressCountry: "EC",
              },
            },
            url: `https://agendacultural-loja.com/eventos/${ev.slug}`,
          },
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-bg)" }}>
      {/* Marcado Estructurado JSON-LD Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHome) }}
      />

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
                Directorio Cultural de Loja
              </span>
            </div>

            {/* Título hero H1 optimizado en tamaño y jerarquía visual */}
            <h1 className="font-display mb-8 text-3xl font-black uppercase leading-tight tracking-tight text-[var(--color-dark)] sm:text-5xl md:text-6xl fade-up">
              Eventos{" "}
              <span className="text-gradient-purple">Artísticos</span>
              <br />
              <span className="text-xl font-bold sm:text-3xl md:text-4xl text-[var(--color-muted)]">
                en Loja, Ecuador
              </span>
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
            CATEGORY CARDS — Diseño profesional en Tarjetas
        ═══════════════════════════════ */}
        <section className="w-full py-10 sm:py-14" aria-label="Explorar por categoría">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-purple-1)]">
                Disciplinas y Espacios
              </span>
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--color-dark)] sm:text-3xl">
                Explorar por Categorías
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {CATEGORIAS.map((cat) => {
                const meta = CAT_META[cat.slug] ?? {
                  emoji: "🎭",
                  color: "#7c3aed",
                  bg: "from-purple-900/80 to-violet-950/90",
                  image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
                };
                return (
                  <Link
                    key={cat.slug}
                    href={`/eventos/categoria/${cat.slug}`}
                    className="group relative flex h-44 sm:h-48 flex-col justify-end overflow-hidden rounded-2xl border border-white/20 p-4 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-white/40"
                  >
                    {/* Imagen de fondo de la categoría */}
                    <img
                      src={meta.image}
                      alt={cat.nombre}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Degradado oscuro para legibilidad */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${meta.bg} opacity-80 transition-opacity duration-300 group-hover:opacity-70`} />

                    {/* Contenido sobrepuesto */}
                    <div className="relative z-10">
                      <span className="mb-1 inline-block text-2xl drop-shadow-md transition-transform duration-300 group-hover:scale-110">
                        {meta.emoji}
                      </span>
                      <h3 className="font-display text-base font-black uppercase tracking-tight text-white drop-shadow-sm">
                        {cat.nombre}
                      </h3>
                      <p className="mt-0.5 flex items-center justify-between text-[11px] font-bold text-white/80">
                        <span>Ver agenda</span>
                        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      </p>
                    </div>
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
            FOOTER — Centrado en móvil y limpio en desktop
        ═══════════════════════════════ */}
        <footer className="mt-auto bg-[var(--color-dark)] text-white">
          {/* Decorative top border */}
          <div
            className="h-1 w-full"
            style={{ background: "var(--grad-blob-1)" }}
            aria-hidden="true"
          />
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3 sm:text-left">
              {/* Brand */}
              <div className="flex flex-col items-center sm:items-start gap-3">
                <div>
                  <p className="font-display text-2xl font-black uppercase tracking-tight">
                    Agenda Cultural
                  </p>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-violet)]">
                    Loja · Ecuador
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-white/60 max-w-xs">
                  El directorio oficial de eventos culturales de Loja. Arte, teatro, música,
                  ferias y artes vivas en un solo lugar.
                </p>
              </div>

              {/* Categorías */}
              <div className="flex flex-col items-center sm:items-start">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                  Categorías
                </p>
                <ul className="space-y-2 text-center sm:text-left">
                  {CATEGORIAS.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/eventos/categoria/${cat.slug}`}
                        className="text-xs font-medium text-white/70 transition-colors hover:text-white"
                      >
                        {CAT_META[cat.slug]?.emoji} {cat.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Información */}
              <div className="flex flex-col items-center sm:items-start gap-3">
                <p className="mb-0 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                  Agenda Cultural
                </p>
                <p className="text-xs leading-relaxed text-white/60 max-w-xs">
                  Descubre las mejores actividades, exposiciones, obras y conciertos en Loja, Ecuador.
                </p>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 flex flex-col items-center justify-center gap-2 border-t border-white/10 pt-6 text-center">
              <p className="text-[12px] text-white/50">
                Diseñado por{" "}
                <a
                  href="https://www.cesarreyesjaramillo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white/80 transition-colors hover:text-white hover:underline"
                >
                  Cesar Reyes
                </a>{" "}
                | Agenda cultural Loja {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

