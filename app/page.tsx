import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/types";
import { inicioDelDiaLojaUTC } from "@/lib/fechas";
import { EstadoVacioEvento } from "@/components/EventoListCard";
import { Navbar } from "@/components/Navbar";
import { CategoryTicker } from "@/components/CategoryTicker";
import { UltimosEventosSection } from "@/components/UltimosEventosSection";
import { ProximosEventosCarousel } from "@/components/ProximosEventosCarousel";
import { CalendarioBotonFlotante } from "@/components/CalendarioBotonFlotante";
import { CalendarioHeroWidget } from "@/components/CalendarioHeroWidget";
import { HeroBannerCarousel, BannerHeroItem } from "@/components/HeroBannerCarousel";
import { HeroHomeContent } from "@/components/HeroHomeContent";
import { BuzonRecomendaciones } from "@/components/BuzonRecomendaciones";
import { HomeCategoriasClient, HomeFooterClient } from "@/components/HomeCategoriasClient";
import { HomeMobileDescubre } from "@/components/HomeMobileDescubre";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Qué hacer en Loja — Eventos, Arte y Agenda Cultural",
  description:
    "Descubre qué está pasando en Loja. ¿Qué hacer en Loja? Conciertos, teatro, exposiciones, ferias y actividades culturales hoy y este fin de semana.",
  keywords: [
    "Qué hacer en Loja",
    "Eventos en Loja",
    "Eventos Loja",
    "Agenda cultural de Loja",
    "Eventos culturales en Loja",
    "Actividades culturales en Loja",
    "Qué hacer este fin de semana en Loja",
    "Teatro en Loja",
    "Conciertos en Loja",
    "Ferias en Loja",
  ],
  alternates: {
    canonical: "https://www.agendaculturalloja.com",
  },
  openGraph: {
    title: "Qué hacer en Loja — Agenda Cultural de Loja",
    description:
      "Descubre qué está pasando en Loja. Cartelera oficial de eventos culturales, arte, música y actividades de fin de semana.",
    url: "https://www.agendaculturalloja.com",
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

/* ── Blob SVG decorativo (solo para el Hero, permanece Server) ── */
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

/* ══════════════════════════════════════════════════
   PAGE — Homepage Magazine
══════════════════════════════════════════════════ */
export default async function Home() {
  const hoyLoja = inicioDelDiaLojaUTC();

  // Próximos eventos ordenados por fecha (desde hoy hacia adelante, orden ascendente)
  const destacados = await prisma.evento.findMany({
    where: {
      estado: "APROBADO",
      OR: [
        { fechaFin: { gte: hoyLoja } },
        { fecha: { gte: hoyLoja } },
      ],
    },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
    take: 12,
  });

  // Todos los eventos aprobados (para alimentar el Calendario Interactivo completo del mes y futuros)
  const eventosCalendario = await prisma.evento.findMany({
    where: { estado: "APROBADO" },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
  });

  // Cartelera activa y próximos eventos ordenados cronológicamente desde hoy
  let ultimosEventos = await prisma.evento.findMany({
    where: {
      estado: "APROBADO",
      OR: [
        { fechaFin: { gte: hoyLoja } },
        { fecha: { gte: hoyLoja } },
      ],
    },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
    take: 16,
  });

  // Fallback si la cartelera futura fuera muy pequeña
  if (ultimosEventos.length < 4) {
    const eventosPasadosRecientes = await prisma.evento.findMany({
      where: { estado: "APROBADO" },
      include: { categoria: true, zona: true },
      orderBy: { fecha: "desc" },
      take: 12,
    });
    ultimosEventos = eventosPasadosRecientes;
  }

  // Banners del Hero (Panorámico estilo Hyundai)
  const bannersDB = await prisma.bannerHero.findMany({
    where: { activo: true },
    orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
  });

  let bannersParaHero: BannerHeroItem[] = bannersDB.map((b) => ({
    id: b.id,
    titulo: b.titulo,
    subtitulo: b.subtitulo,
    link: b.link,
    botonTexto: b.botonTexto,
    imagenDesktop: b.imagenDesktop,
    imagenMobile: b.imagenMobile,
  }));

  // Si no hay banners manuales configurados en el panel, usamos los eventos más nuevos con imagen
  if (bannersParaHero.length === 0) {
    const eventosConImagen = ultimosEventos
      .filter((ev) => Boolean(ev.imagenUrl))
      .slice(0, 5);

    bannersParaHero = eventosConImagen.map((ev) => ({
      id: ev.id,
      titulo: ev.nombre,
      subtitulo: `${new Date(ev.fecha).toLocaleDateString("es-EC", {
        day: "numeric",
        month: "long",
      })} • ${ev.lugar}`,
      link: `/eventos/${ev.slug}`,
      botonTexto: "Ver evento",
      imagenDesktop: ev.imagenUrl!,
      imagenMobile: ev.imagenUrl!,
    }));
  }

  // ── Cargar eventos de cada categoría para el cliente ──
  const categoriasConEventos = await Promise.all(
    CATEGORIAS.map(async (cat, i) => {
      let eventos = await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          categoria: { slug: cat.slug },
          OR: [
            { fechaFin: { gte: hoyLoja } },
            { fecha: { gte: hoyLoja } },
          ],
        },
        include: { categoria: true, zona: true },
        orderBy: { fecha: "asc" },
        take: 6,
      });

      if (eventos.length === 0) {
        eventos = await prisma.evento.findMany({
          where: { estado: "APROBADO", categoria: { slug: cat.slug } },
          include: { categoria: true, zona: true },
          orderBy: { fecha: "desc" },
          take: 4,
        });
      }

      const meta = CAT_META[cat.slug] ?? {
        emoji: "🎭",
        color: "#7c3aed",
        bg: "from-purple-900/80 to-violet-950/90",
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
      };

      return {
        slug: cat.slug,
        slugKey: cat.slug,
        color: meta.color,
        bg: meta.bg,
        emoji: meta.emoji,
        image: meta.image,
        eventos,
        blobVariant: (i % 2 === 0 ? 1 : 2) as 1 | 2,
      };
    })
  );

  // Marcado estructurado JSON-LD (Schema.org) para la Home
  const jsonLdHome = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.agendaculturalloja.com/#website",
        url: "https://www.agendaculturalloja.com",
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
            ...(ev.fechaFin ? { endDate: new Date(ev.fechaFin).toISOString() } : {}),
            location: {
              "@type": "Place",
              name: ev.lugar,
              address: {
                "@type": "PostalAddress",
                addressLocality: "Loja",
                addressCountry: "EC",
              },
            },
            url: `https://www.agendaculturalloja.com/eventos/${ev.slug}`,
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
            HERO BANNERS CINEMATOGRÁFICO — ESTILO HYUNDAI (FADE SLIDER)
        ═══════════════════════════════ */}
        {bannersParaHero.length > 0 && (
          <div id="hero-banner-main" className="w-full pt-0 sm:pt-20">
            <HeroBannerCarousel banners={bannersParaHero} intervalMs={5000} />
          </div>
        )}

        {/* ═══════════════════════════════
            HERO — Eventos destacados & Calendario
        ═══════════════════════════════ */}
        <section
          className="relative w-full overflow-hidden pb-8 sm:pb-12 pt-6 sm:pt-8 flex flex-col justify-between"
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

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 w-full flex flex-col justify-between flex-1 sm:block">
            {/* ── EN DESKTOP: LAYOUT 2 COLUMNAS ── */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-[50%_50%] gap-6 lg:gap-8 items-center">
              <HeroHomeContent />
              <div id="hero-calendario-desktop" className="w-full fade-up fade-up-delay-1">
                <CalendarioHeroWidget eventos={eventosCalendario} />
              </div>
            </div>

            {/* ── EN MODO CELULAR: TÍTULO INFORMATIVO ── */}
            <div className="sm:hidden">
              <HeroHomeContent />
            </div>

            {/* ── CARRUSEL DE CARTAS (solo móvil) ── */}
            <div className="w-full pt-2 sm:hidden">
              {destacados.length > 0 ? (
                <div className="relative w-full px-0 sm:px-1">
                  <ProximosEventosCarousel eventos={destacados} />
                </div>
              ) : (
                <EstadoVacioEvento mensaje="No hay eventos próximos publicados todavía." />
              )}
            </div>

            {/* ── EN MODO CELULAR: TEXTOS DESCRIPTIVOS ── */}
            <HomeMobileDescubre />
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
            CATEGORY CARDS + SECCIONES POR CATEGORÍA (CLIENT — i18n)
        ═══════════════════════════════ */}
        <HomeCategoriasClient categorias={categoriasConEventos} />

        {/* ═══════════════════════════════
            BUZÓN CIUDADANO DE RECOMENDACIONES
        ═══════════════════════════════ */}
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <BuzonRecomendaciones />
        </div>

      </main>

      {/* ═══════════════════════════════
          FOOTER — i18n client
      ═══════════════════════════════ */}
      <HomeFooterClient categorias={categoriasConEventos} />

      {/* ── BOTÓN FLOTANTE Y POPUP LATERAL DEL CALENDARIO ── */}
      <CalendarioBotonFlotante eventos={eventosCalendario} />
    </div>
  );
}