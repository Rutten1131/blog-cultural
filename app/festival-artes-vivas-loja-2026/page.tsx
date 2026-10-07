import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { inicioDelDiaLojaUTC } from "@/lib/fechas";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { EventosPasadosList } from "@/components/EventosPasadosList";
import { Navbar } from "@/components/Navbar";
import FiavlLiquidHero from "@/components/FiavlLiquidHero";

export const revalidate = 1800; // 30 minutos

export const metadata: Metadata = {
  title: "Festival de Artes Vivas Loja 2026 (FIAVL) — Cartelera e Itinerario",
  description:
    "Descubre la cartelera oficial, programación e itinerario del Festival Internacional de Artes Vivas Loja 2026 (FIAVL). Fechas, obras en teatros y eventos de calle en Loja.",
  keywords: [
    "Festival de Artes Vivas Loja 2026",
    "FIAVL 2026",
    "Itinerario Festival Artes Vivas Loja",
    "Programacion FIAVL 2026",
    "Festival Internacional de Artes Vivas Loja",
    "Fechas FIAVL 2026",
    "Obras de teatro FIAVL Loja",
    "Teatro Benjamín Carrión Artes Vivas",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/festival-artes-vivas-loja-2026`,
  },
  openGraph: {
    title: "Festival de Artes Vivas Loja 2026 (FIAVL) — Programación Oficial",
    description:
      "Guía y cartelera completa del Festival Internacional de Artes Vivas Loja 2026: fechas, itinerario, teatros y espacios al aire libre.",
    url: `${SITE_CONFIG.url}/festival-artes-vivas-loja-2026`,
    siteName: SITE_CONFIG.nombre,
    locale: SITE_CONFIG.locale,
    type: "website",
  },
};

export default async function FestivalArtesVivasPage() {
  const hoyLoja = inicioDelDiaLojaUTC();

  // Buscar categoría de artes vivas
  const categoriaDb = await prisma.categoria.findUnique({
    where: { slug: "artes-vivas" },
  });

  // Condición estricta: ÚNICAMENTE eventos de la categoría oficial "artes-vivas"
  const searchCondition = {
    estado: "APROBADO" as const,
    ...(categoriaDb ? { categoriaId: categoriaDb.id } : { categoria: { slug: "artes-vivas" } }),
  };

  // 1. Eventos vigentes o futuros de Artes Vivas
  const eventosProximos = await prisma.evento.findMany({
    where: {
      ...searchCondition,
      OR: [
        { fechaFin: { gte: hoyLoja } },
        { fecha: { gte: hoyLoja } },
      ],
    },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
  });

  // 2. Historial de eventos anteriores de Artes Vivas
  const eventosPasados = await prisma.evento.findMany({
    where: {
      ...searchCondition,
      AND: [
        { fecha: { lt: hoyLoja } },
        { OR: [{ fechaFin: null }, { fechaFin: { lt: hoyLoja } }] },
      ],
    },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "desc" },
    take: 30,
  });

  const todosEventos = [...eventosProximos, ...eventosPasados];

  // Schema.org estructurado con EventSeries, Festival y FAQPage
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Festival",
        "@id": `${SITE_CONFIG.url}/festival-artes-vivas-loja-2026#festival`,
        name: "Festival Internacional de Artes Vivas Loja 2026 (FIAVL)",
        description:
          "El mayor encuentro de artes escénicas de Ecuador: teatro, danza, clown, títeres, circo y música en Loja, Capital Cultural del Ecuador.",
        url: `${SITE_CONFIG.url}/festival-artes-vivas-loja-2026`,
        startDate: "2026-11-12T09:00:00-05:00",
        endDate: "2026-11-22T23:59:00-05:00",
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: "Teatro Nacional Benjamín Carrión y Espacios Públicos de Loja",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Loja",
            addressRegion: "Loja",
            addressCountry: "EC",
          },
        },
        organizer: {
          "@type": "Organization",
          name: "Ministerio de Cultura y Patrimonio del Ecuador & Municipio de Loja",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_CONFIG.url}/festival-artes-vivas-loja-2026#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "¿Cuándo es el Festival de Artes Vivas de Loja 2026 (FIAVL)?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "El Festival Internacional de Artes Vivas de Loja se celebra tradicionalmente durante el mes de noviembre en la ciudad de Loja, Ecuador, congregando compañías nacionales e internacionales de teatro, danza y performance.",
            },
          },
          {
            "@type": "Question",
            name: "¿Cómo consultar el itinerario y programación del FIAVL 2026?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "En Agenda Cultural Loja dispones del calendario en tiempo real con horarios, salas (Teatro Benjamín Carrión, Teatro Bolívar, Casona Cultural) y las intervenciones en plazas públicas como San Sebastián y el Parque Central.",
            },
          },
          {
            "@type": "Question",
            name: "¿Las entradas para el Festival de Artes Vivas de Loja son gratuitas?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Gran parte de la programación en plazas, calles y carpas al aire libre (programación 'Camino a Loja' y circuito 'Off') es completamente gratuita y de libre acceso. Las funciones en salas de teatro cerradas suelen manejarse con canje o boletos asignados previo aforo.",
            },
          },
          {
            "@type": "Question",
            name: "¿Cuáles son las sedes principales del FIAVL en Loja?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Las sedes oficiales principales son el Teatro Nacional Benjamín Carrión, el Teatro Bolívar, el Centro Cultural Alfredo Mora Reyes, el Teatro Segundo Cueva Celi, la Plaza de San Sebastián y las calles céntricas de la ciudad de Loja.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_CONFIG.url },
          { "@type": "ListItem", position: 2, name: "Eventos", item: `${SITE_CONFIG.url}/eventos` },
          { "@type": "ListItem", position: 3, name: "Festival Artes Vivas 2026", item: `${SITE_CONFIG.url}/festival-artes-vivas-loja-2026` },
        ],
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ background: "var(--color-bg)" }}>
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      {/* ── HERO FULLSCREEN INTERACTIVO LIQUID (ORDENADOR Y MÓVIL) ── */}
      <FiavlLiquidHero>
        {/* Contenido superior / espaciador para no tapar el navbar fijo */}
        <div className="pt-24 sm:pt-28 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          {/* Breadcrumb translúcido con estilo escénico */}
          <nav
            aria-label="Breadcrumb"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white/80"
          >
            <Link href="/" className="hover:text-pink-400 transition-colors">Inicio</Link>
            <span className="text-white/40">/</span>
            <Link href="/eventos" className="hover:text-pink-400 transition-colors">Eventos</Link>
            <span className="text-white/40">/</span>
            <span className="font-semibold text-white">FIAVL 2026</span>
          </nav>
        </div>

        {/* Bloque central: Texto limpio, moderno y de impacto visual con colores FIAVL */}
        <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full py-8 my-auto text-center flex flex-col items-center">
          {/* Badge vibrante */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-gradient-to-r from-violet-600/80 to-pink-600/80 text-white border border-pink-400/30 backdrop-blur-md shadow-[0_0_24px_rgba(236,72,153,0.35)] mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-300"></span>
            </span>
            ✨ 10ª Edición Oficial 2026 · Loja, Ecuador
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black uppercase tracking-tight text-white leading-[1.05] drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] max-w-4xl">
            Festival Internacional de <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-violet-300 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Artes Vivas Loja
            </span>
          </h1>

          <p className="hidden md:block mt-5 text-sm sm:text-base md:text-lg text-slate-200/90 max-w-2xl font-medium leading-relaxed drop-shadow-md">
            El encuentro de artes escénicas más trascendente del Ecuador. Descubre el itinerario oficial, salas de teatro y las expresiones culturales vivas que transforman las calles lojanas.
          </p>

          {/* Botones de acción limpia */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="#itinerario"
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-[0_4px_20px_rgba(236,72,153,0.45)] hover:shadow-[0_6px_28px_rgba(236,72,153,0.7)] hover:scale-105 active:scale-95 transition-all duration-200"
            >
              🎭 Ver Obras en Cartelera
            </a>
            <Link
              href="/publicar"
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-200"
            >
              + Publicar Función
            </Link>
          </div>
        </div>

        {/* Fila inferior de micro-datos flotantes del festival */}
        <div className="w-full pb-8 pt-4 px-4 sm:px-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
            <div className="px-3 py-1.5 border-r border-white/10 last:border-none">
              <span className="block text-[10px] sm:text-[11px] text-pink-300/80 font-bold uppercase tracking-wider">Temporada</span>
              <span className="text-xs sm:text-sm font-black text-white">Noviembre 2026</span>
            </div>
            <div className="px-3 py-1.5 border-r border-white/10 last:border-none">
              <span className="block text-[10px] sm:text-[11px] text-pink-300/80 font-bold uppercase tracking-wider">Sede Principal</span>
              <span className="text-xs sm:text-sm font-black text-white truncate block">Teatro Benjamín Carrión</span>
            </div>
            <div className="px-3 py-1.5 border-r border-white/10 last:border-none">
              <span className="block text-[10px] sm:text-[11px] text-pink-300/80 font-bold uppercase tracking-wider">Acceso Calles</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400">Entrada Libre</span>
            </div>
            <div className="px-3 py-1.5">
              <span className="block text-[10px] sm:text-[11px] text-pink-300/80 font-bold uppercase tracking-wider">Obras & Funciones</span>
              <span className="text-xs sm:text-sm font-black text-white">{todosEventos.length} Registradas</span>
            </div>
          </div>
        </div>
      </FiavlLiquidHero>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 flex-1" id="itinerario">

        {/* ── SECCIÓN 1: EVENTOS VIGENTES / PRÓXIMOS EN CARTELERA ── */}
        <section className="mb-14">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-black uppercase text-[var(--color-dark)]">
                Itinerario y Obras en Cartelera
              </h2>
            </div>
            <span className="text-xs text-[var(--color-muted)] font-semibold">
              {eventosProximos.length} próximas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosProximos.length > 0 ? (
              eventosProximos.map((evento) => (
                <EventoListCard key={evento.id} evento={evento} />
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-3">
                <EstadoVacioEvento
                  mensaje="La programación oficial de nuevas obras para las próximas semanas se está actualizando. Consulta el histórico de obras de artes vivas a continuación."
                />
              </div>
            )}
          </div>
        </section>

        {/* ── SECCIÓN 2: HISTORIAL DE OBRAS DE ARTES VIVAS ── */}
        {eventosPasados.length > 0 && (
          <section className="mb-14">
            <EventosPasadosList
              eventos={eventosPasados}
              titulo="Histórico de Obras y Presentaciones Anteriores"
              subtitulo="Funciones y montajes escénicos presentados en Loja."
              initialCount={6}
              step={6}
            />
          </section>
        )}

        {/* ── SECCIÓN 3: PREGUNTAS FRECUENTES (SEO FAQ RICH SNIPPETS) ── */}
        <section className="mt-14 pt-10 border-t border-[var(--color-border)]">
          <h2 className="text-2xl font-display font-black uppercase text-[var(--color-dark)] mb-6">
            Preguntas Frecuentes sobre el Festival de Artes Vivas Loja 2026
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-white/40 dark:bg-black/10">
              <h3 className="font-bold text-base text-[var(--color-dark)] mb-2">
                ¿Cuándo se realiza el FIAVL 2026 en Loja?
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                El festival se realiza anualmente durante el mes de noviembre, convirtiendo a Loja en el epicentro de la dramaturgia y la danza en Ecuador con más de 10 días continuos de espectáculos.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-white/40 dark:bg-black/10">
              <h3 className="font-bold text-base text-[var(--color-dark)] mb-2">
                ¿Dónde se presentan las obras del festival?
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                Los principales escenarios cerrados son el <Link href="/lugar/teatro-benjamin-carrion" className="underline font-medium hover:text-purple-600">Teatro Benjamín Carrión</Link>, el <Link href="/lugar/teatro-bolivar" className="underline font-medium hover:text-purple-600">Teatro Bolívar</Link> y la <Link href="/lugar/casona-cultural" className="underline font-medium hover:text-purple-600">Casona Cultural</Link>, además del circuito al aire libre en la <Link href="/lugar/plaza-san-sebastian" className="underline font-medium hover:text-purple-600">Plaza de San Sebastián</Link>.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-white/40 dark:bg-black/10">
              <h3 className="font-bold text-base text-[var(--color-dark)] mb-2">
                ¿Las funciones del festival son gratuitas?
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                Todas las actividades en las calles, plazas y parques son 100% gratuitas y sin reserva previa. Para los teatros oficiales el acceso suele ser libre mediante canje previo de boletos en boleterías designadas.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-white/40 dark:bg-black/10">
              <h3 className="font-bold text-base text-[var(--color-dark)] mb-2">
                ¿Cómo publicar una obra o evento del festival?
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                Si eres gestor cultural, artista o compañía participante, puedes registrar tu función de forma gratuita directamente en nuestra sección de <Link href="/publicar" className="underline font-medium hover:text-purple-600">publicar evento</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Enlaces cruzados para SEO interno */}
        <div className="mt-12 p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-[var(--color-dark)] text-sm">Explora más en Loja</h4>
            <p className="text-xs text-[var(--color-muted)]">Cartelera de la semana y principales recintos de la ciudad.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/eventos/esta-semana" className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white/70 dark:bg-black/20 font-medium hover:border-purple-500 transition-colors">
              📅 Esta Semana
            </Link>
            <Link href="/eventos/este-fin-de-semana" className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white/70 dark:bg-black/20 font-medium hover:border-purple-500 transition-colors">
              🎉 Fin de Semana
            </Link>
            <Link href="/lugar/teatro-benjamin-carrion" className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white/70 dark:bg-black/20 font-medium hover:border-purple-500 transition-colors">
              🏛️ Teatro Benjamín Carrión
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
