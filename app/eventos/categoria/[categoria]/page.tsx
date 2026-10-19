import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/types";
import { SITE_CONFIG } from "@/lib/utils";
import { inicioDelDiaLojaUTC } from "@/lib/fechas";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { EventosPasadosList } from "@/components/EventosPasadosList";
import { Navbar } from "@/components/Navbar";
import {
  CategoryHeaderClient,
  CategorySectionTitleClient,
  CategoryBackButtonClient,
} from "@/components/CategoryHeaderClient";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ categoria: string }>;
}

// Diccionarios SEO específicos por categoría
const CATEGORIA_SEO_INFO: Record<
  string,
  {
    tituloH1: string;
    preguntaH2: string;
    descripcionSeo: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  }
> = {
  "arte-y-exposiciones": {
    tituloH1: "Arte y Exposiciones en Loja: Museos, Galerías y Muestras",
    preguntaH2: "¿Qué exposiciones de arte y museos visitar en Loja?",
    descripcionSeo:
      "Explora las exposiciones de arte en Loja, galerías, museos, muestras de pintura, fotografía y escultura en la capital cultural del sur del Ecuador.",
    metaTitle: "Arte y Exposiciones en Loja — Museos, Galerías y Cartelera",
    metaDescription:
      "Descubre exposiciones de arte en Loja, galerías y muestras vigentes: pintura, fotografía y escultura con artistas, salas y fechas actualizadas.",
    keywords: [
      "Arte y exposiciones en Loja",
      "Exposiciones de arte Loja",
      "Galerías de arte en Loja",
      "Museos en Loja",
      "Muestras de pintura Loja",
      "Qué hacer en Loja",
    ],
  },
  teatro: {
    tituloH1: "Teatro en Loja: Obras, Funciones y Cartelera Escénica",
    preguntaH2: "¿Qué obras de teatro ver en Loja hoy?",
    descripcionSeo:
      "Encuentra la cartelera completa de teatro en Loja: obras teatrales, funciones de comedia, dramaturgia y artes escénicas en el Teatro Bolívar y Teatro Benjamín Carrión.",
    metaTitle: "Teatro en Loja — Cartelera de Obras y Funciones de Teatro",
    metaDescription:
      "Cartelera de teatro en Loja, funciones de comedia, obras y artes escénicas. Consulta horarios, teatros, fechas y venta de entradas en Loja, Ecuador.",
    keywords: [
      "Teatro en Loja",
      "Teatro Loja",
      "Obras de teatro Loja",
      "Funciones de teatro Loja",
      "Cartelera de teatro Loja",
      "Teatro Bolívar Loja",
      "Eventos en Loja",
    ],
  },
  musica: {
    tituloH1: "Conciertos en Loja y Eventos de Música en Vivo 2026",
    preguntaH2: "¿Qué conciertos y música en vivo hay en Loja hoy?",
    descripcionSeo:
      "Descubre los próximos conciertos en Loja 2026, eventos de música en vivo, recitales de la Orquesta Sinfónica de Loja, festivales y tocadas independientes.",
    metaTitle: "Conciertos en Loja 2026 — Música en Vivo, Recitales y Eventos",
    metaDescription:
      "Agenda de conciertos en Loja 2026: música en vivo hoy, presentaciones de la Orquesta Sinfónica de Loja, recitales y festivales musicales con fechas y lugares.",
    keywords: [
      "Conciertos en Loja",
      "Conciertos en Loja 2026",
      "Música en vivo Loja",
      "Eventos musicales Loja",
      "Orquesta Sinfónica de Loja eventos",
      "Conciertos Loja hoy",
      "Qué hacer en Loja",
    ],
  },
  ferias: {
    tituloH1: "Ferias y Artesanías en Loja: Calendario y Participantes",
    preguntaH2: "¿Qué ferias artesanales y festivales visitar en Loja?",
    descripcionSeo:
      "Directorio de ferias en Loja: ferias artesanales, agroecológicas, gastronómicas, festivales de emprendimiento cantonal y detalles de la Feria de Loja 2026.",
    metaTitle: "Ferias y Artesanías en Loja — Festivales y Emprendimiento",
    metaDescription:
      "Conoce las ferias y artesanías en Loja, ferias gastronómicas, culturales y de emprendimiento en Loja, Ecuador. Lugares, fechas y expositores destacados.",
    keywords: [
      "Ferias en Loja",
      "Ferias y artesanías Loja",
      "Feria de Loja fechas",
      "Ferias gastronómicas Loja",
      "Ferias artesanales Loja",
      "Eventos en Loja",
    ],
  },
  "artes-vivas": {
    tituloH1: "Festival de Artes Vivas Loja 2026 (FIAVL)",
    preguntaH2: "¿Cuándo es el Festival de Artes Vivas Loja 2026 y cuál es su programación?",
    descripcionSeo:
      "Vive el Festival de Artes Vivas Loja 2026 (FIAVL): programación oficial, fechas, obras en el Teatro Benjamín Carrión, danza, mimo y espectáculos de calle.",
    metaTitle: "Festival de Artes Vivas Loja 2026 — Programación y Fechas FIAVL",
    metaDescription:
      "Cartelera oficial del Festival de Artes Vivas Loja 2026 (FIAVL). Fechas, obras teatrales, programación de calle, entradas e itinerario completo.",
    keywords: [
      "Festival de artes vivas Loja",
      "Festival de artes vivas Loja 2026",
      "FIAVL",
      "FIAVL 2026",
      "Programación festival de artes vivas Loja",
      "Entradas festival de artes vivas Loja",
    ],
  },
  "eventos-gastronomicos": {
    tituloH1: "Eventos Gastronómicos en Loja: Ferias, Festivales y Rutas del Café",
    preguntaH2: "¿Qué eventos gastronómicos, ferias y festivales culinarios hay en Loja?",
    descripcionSeo:
      "Descubre los eventos gastronómicos en Loja: ferias culinarias, festivales del café, catas, rutas gastronómicas y encuentros de productores locales en la provincia de Loja.",
    metaTitle: "Eventos Gastronómicos en Loja 2026 — Ferias y Festivales Culinarios",
    metaDescription:
      "Cartelera de eventos gastronómicos en Loja: ferias culinarias, festivales de café, degustaciones y rutas gastronómicas con fechas y lugares actualizados.",
    keywords: [
      "Feria de Loja 2026",
      "Eventos gastronómicos Loja",
      "Festival gastronómico Loja",
      "Ruta del café Loja",
      "Ferias culinarias Loja",
      "Qué hacer en Loja",
    ],
  },
};

export async function generateStaticParams() {
  return CATEGORIAS.map((cat) => ({ categoria: cat.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria: categoriaSlug } = await params;
  const cat = CATEGORIAS.find((c) => c.slug === categoriaSlug);

  if (!cat) return { title: "Categoría no encontrada" };

  const seo = CATEGORIA_SEO_INFO[categoriaSlug] || {
    metaTitle: `Eventos de ${cat.nombre} en Loja`,
    metaDescription: `Eventos culturales de ${cat.nombre} en Loja, Ecuador.`,
    keywords: [`Eventos de ${cat.nombre} en Loja`],
  };

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.keywords,
    alternates: {
      canonical:
        cat.slug === "eventos-gastronomicos"
          ? `${SITE_CONFIG.url}/eventos-gastronomicos`
          : `${SITE_CONFIG.url}/eventos/categoria/${cat.slug}`,
    },
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url: `${SITE_CONFIG.url}/eventos/categoria/${cat.slug}`,
      siteName: SITE_CONFIG.nombre,
      locale: SITE_CONFIG.locale,
      type: "website",
    },
  };
}

export default async function CategoriaPage({ params }: PageProps) {
  const { categoria: categoriaSlug } = await params;

  const cat = CATEGORIAS.find((c) => c.slug === categoriaSlug);
  if (!cat) notFound();

  const seoInfo = CATEGORIA_SEO_INFO[categoriaSlug] || {
    tituloH1: `Eventos de ${cat.nombre} en Loja`,
    preguntaH2: `¿Qué eventos de ${cat.nombre} existen en Loja?`,
    descripcionSeo: `Cartelera completa y actualizada de eventos de ${cat.nombre} en Loja, Ecuador.`,
  };

  // Buscar la categoría en la BD por slug
  const categoriaDb = await prisma.categoria.findUnique({
    where: { slug: categoriaSlug },
  });

  const hoyLoja = inicioDelDiaLojaUTC();

  // 1. Eventos vigentes (hoy y días siguientes), ordenados cronológicamente
  const eventosProximos = categoriaDb
    ? await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          categoriaId: categoriaDb.id,
          OR: [
            { fechaFin: { gte: hoyLoja } },
            { fecha: { gte: hoyLoja } },
          ],
        },
        include: { categoria: true, zona: true },
        orderBy: { fecha: "asc" },
      })
    : [];

  // 2. Eventos anteriores / finalizados, ordenados del más reciente al más antiguo
  const eventosPasados = categoriaDb
    ? await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          categoriaId: categoriaDb.id,
          AND: [
            { fecha: { lt: hoyLoja } },
            { OR: [{ fechaFin: null }, { fechaFin: { lt: hoyLoja } }] },
          ],
        },
        include: { categoria: true, zona: true },
        orderBy: { fecha: "desc" },
        take: 30,
      })
    : [];

  const todosEventosCat = [...eventosProximos, ...eventosPasados];

  // JSON-LD Schema.org para CollectionPage + ItemList
  const jsonLdCategory = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_CONFIG.url}/eventos/categoria/${cat.slug}/#webpage`,
        url: `${SITE_CONFIG.url}/eventos/categoria/${cat.slug}`,
        name: seoInfo.tituloH1,
        description: seoInfo.descripcionSeo,
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
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_CONFIG.url },
          { "@type": "ListItem", position: 2, name: "Eventos", item: `${SITE_CONFIG.url}/eventos` },
          { "@type": "ListItem", position: 3, name: cat.nombre, item: `${SITE_CONFIG.url}/eventos/categoria/${cat.slug}` },
        ],
      },
      {
        "@type": "ItemList",
        name: seoInfo.tituloH1,
        numberOfItems: todosEventosCat.length,
        itemListElement: todosEventosCat.map((ev, index) => ({
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
            url: `${SITE_CONFIG.url}/eventos/${ev.slug}`,
          },
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ background: "var(--color-bg)" }}>
      {/* Marcado Estructurado Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCategory) }}
      />

      <Navbar />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 flex-1">
        {/* Header y Breadcrumbs traducibles con soporte i18n */}
        <CategoryHeaderClient
          categoriaSlug={cat.slug}
          categoriaNombreDefault={cat.nombre}
          tituloH1Default={seoInfo.tituloH1}
          preguntaH2Default={seoInfo.preguntaH2}
          descripcionSeoDefault={seoInfo.descripcionSeo}
          proximosCount={eventosProximos.length}
          totalCount={todosEventosCat.length}
        />

        {/* ── SECCIÓN 1: EVENTOS VIGENTES (HOY Y PRÓXIMOS DÍAS) ── */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <CategorySectionTitleClient defaultText="Próximos Eventos en Cartelera (Hoy y siguientes días)" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosProximos.length > 0 ? (
              eventosProximos.map((evento) => (
                <EventoListCard key={evento.id} evento={evento} />
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-3">
                <EstadoVacioEvento
                  mensaje={`No hay eventos próximos en fechas futuras para "${cat.nombre}". Consulta los eventos realizados anteriormente a continuación.`}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── SECCIÓN 2: EVENTOS ANTERIORES / HISTORIAL CULTURAL CON LÍMITE Y VER MÁS ── */}
        <EventosPasadosList
          eventos={eventosPasados}
          titulo={`Eventos Anteriores en ${cat.nombre}`}
          subtitulo={`Ediciones, exposiciones y presentaciones ya concluidas en Loja.`}
          initialCount={6}
          step={6}
        />

        {/* Link de vuelta */}
        <div className="mt-14 pt-8 border-t border-[var(--color-border)] text-center">
          <CategoryBackButtonClient />
        </div>
      </main>
    </div>
  );
}
