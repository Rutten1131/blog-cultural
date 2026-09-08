import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { inicioDelDiaLojaUTC } from "@/lib/fechas";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { EventosPasadosList } from "@/components/EventosPasadosList";
import { Navbar } from "@/components/Navbar";
import { CalendarioCulturalHome } from "@/components/CalendarioCulturalHome";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Todos los Eventos Culturales en Loja — Cartelera y Calendario",
  description:
    "Explorá el catálogo completo y calendario interactivo de eventos culturales en Loja, Ecuador: música, teatro, arte, ferias y artes vivas.",
  keywords: [
    "eventos culturales Loja",
    "qué hacer en Loja",
    "agenda cultural Loja Ecuador",
    "cartelera Loja",
    "actividades culturales Loja",
    "eventos este fin de semana Loja",
    "música teatro arte Loja",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/eventos`,
  },
  openGraph: {
    title: "Todos los Eventos Culturales en Loja — Cartelera y Calendario",
    description:
      "Catálogo completo de eventos culturales en Loja: música, teatro, arte, ferias y artes vivas. Actualizado diariamente.",
    url: `${SITE_CONFIG.url}/eventos`,
    siteName: SITE_CONFIG.nombre,
    locale: "es_EC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventos Culturales en Loja — Agenda Cultural",
    description:
      "Cartelera completa de eventos en Loja, Ecuador. Música, teatro, arte y más.",
  },
};

export default async function EventosPage() {
  const hoyLoja = inicioDelDiaLojaUTC();

  // 1. Eventos vigentes (hoy y días siguientes), ordenados cronológicamente
  const eventosProximos = await prisma.evento.findMany({
    where: {
      estado: "APROBADO",
      OR: [
        { fechaFin: { gte: hoyLoja } },
        { fecha: { gte: hoyLoja } },
      ],
    },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
  });

  // 2. Eventos pasados / memoria histórica
  const eventosPasados = await prisma.evento.findMany({
    where: {
      estado: "APROBADO",
      AND: [
        { fecha: { lt: hoyLoja } },
        { OR: [{ fechaFin: null }, { fechaFin: { lt: hoyLoja } }] },
      ],
    },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "desc" },
    take: 50,
  });

  // Para el calendario se pasan todos
  const todosLosEventos = [...eventosProximos, ...eventosPasados];

  // JSON-LD Schema.org para la página de listado de eventos
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_CONFIG.url}/eventos/#webpage`,
        url: `${SITE_CONFIG.url}/eventos`,
        name: "Todos los Eventos Culturales en Loja",
        description:
          "Catálogo completo y actualizado de eventos culturales en Loja, Ecuador.",
        inLanguage: "es-EC",
        isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
        publisher: {
          "@type": "Person",
          name: "César Reyes Jaramillo",
          url: "https://www.cesarreyesjaramillo.com/",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: SITE_CONFIG.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Eventos",
            item: `${SITE_CONFIG.url}/eventos`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 flex-1">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
          <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">Inicio</Link>
          <span>›</span>
          <span className="text-[var(--color-dark)] font-bold">Todos los eventos</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
            Cartelera y Calendario Cultural
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {eventosProximos.length > 0
              ? `Explora los ${eventosProximos.length} eventos próximos en agenda o toca un día en el calendario interactivo.`
              : "No hay eventos próximos en este momento."}
          </p>
        </div>

        {/* Calendario Interactivo */}
        <div className="mb-12">
          <CalendarioCulturalHome eventos={todosLosEventos} />
        </div>

        {/* ── SECCIÓN 1: CARTELERA ACTIVA (HOY Y PRÓXIMOS DÍAS) ── */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--color-dark)]">
              Eventos Próximos (Hoy y siguientes fechas)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosProximos.length > 0 ? (
              eventosProximos.map((evento) => (
                <EventoListCard key={evento.id} evento={evento} />
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-3">
                <EstadoVacioEvento mensaje="No hay eventos próximos programados para hoy o los siguientes días." />
              </div>
            )}
          </div>
        </section>

        {/* ── SECCIÓN 2: EVENTOS ANTERIORES / ARCHIVO CULTURAL CON LÍMITE Y VER MÁS ── */}
        <EventosPasadosList
          eventos={eventosPasados}
          titulo="Eventos Realizados Anteriormente en Loja"
          subtitulo="Registro histórico de presentaciones, talleres y festivales concluidos en la ciudad."
          initialCount={6}
          step={6}
        />
      </main>
    </div>
    </>
  );
}
