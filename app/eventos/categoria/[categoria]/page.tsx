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
    tituloH1: "Eventos de Arte y Exposiciones en Loja",
    preguntaH2: "¿Qué exposiciones de arte y galerías visitar en Loja?",
    descripcionSeo:
      "Explorá la cartelera de exposiciones de pintura, fotografía, escultura y muestras de artes plásticas en galerías y museos de Loja, Ecuador.",
    metaTitle: "Eventos de Arte y Exposiciones en Loja — Agenda Cultural",
    metaDescription:
      "Descubrí exposiciones de arte, fotografía y galerías en Loja, Ecuador. Cartelera actualizada con fechas, artistas y salas de exposición.",
    keywords: [
      "Arte y exposiciones en Loja",
      "Galerías de arte Loja",
      "Exposición de pintura Loja",
      "Muestras de arte Loja Ecuador",
    ],
  },
  teatro: {
    tituloH1: "Eventos de Teatro en Loja",
    preguntaH2: "¿Qué obras de teatro y artes escénicas ver en Loja?",
    descripcionSeo:
      "Encontrá la programación completa de obras de teatro, festivales de artes escénicas, microteatro y dramaturgia en las salas teatrales de Loja.",
    metaTitle: "Eventos de Teatro en Loja — Agenda Cultural Ecuador",
    metaDescription:
      "Cartelera de obras de teatro, microteatro y artes escénicas en Loja, Ecuador. Consultá horarios, salas y boleterías actualizadas.",
    keywords: [
      "Teatro en Loja",
      "Obras de teatro Loja",
      "Microteatro Loja",
      "Artes escénicas Loja Ecuador",
      "Teatro Bolívar Loja",
    ],
  },
  musica: {
    tituloH1: "Eventos de Música y Conciertos en Loja",
    preguntaH2: "¿Qué conciertos y recitales de música hay en Loja?",
    descripcionSeo:
      "Descubrí conciertos en vivo, recitales de la orquesta sinfónica, música académica, popular e independiente en la capital musical del Ecuador.",
    metaTitle: "Conciertos y Eventos de Música en Loja — Agenda Cultural",
    metaDescription:
      "Agenda de conciertos de música en vivo, sinfónica, recitados y festivales en Loja. Enterate de las próximas presentaciones y artistas.",
    keywords: [
      "Conciertos en Loja",
      "Música en Loja",
      "Sinfónica de Loja",
      "Eventos musicales Loja Ecuador",
    ],
  },
  ferias: {
    tituloH1: "Ferias Culturales y Festivales en Loja",
    preguntaH2: "¿Qué ferias culturales y emprendimientos visitar en Loja?",
    descripcionSeo:
      "Directorio de ferias artesanales, gastronomía local, festivales de emprendimiento cultural y encuentros tradicionales en los cantones y parroquias de Loja.",
    metaTitle: "Ferias Culturales y Festivales en Loja — Agenda Cultural",
    metaDescription:
      "Conocé las ferias artesanales, culturales y gastronómicas que se realizan en Loja, Ecuador. Fechas, ubicaciones y detalles de expositores.",
    keywords: [
      "Ferias en Loja",
      "Ferias culturales Loja",
      "Festivales gastronómicos Loja",
      "Emprendimiento cultural Loja",
    ],
  },
  "artes-vivas": {
    tituloH1: "Eventos de Artes Vivas en Loja",
    preguntaH2: "¿Qué festivales y espectáculos de Artes Vivas hay en Loja?",
    descripcionSeo:
      "Viví las artes vivas en Loja: danza contemporánea, performances escénicas, mimo, teatro de calle y el Festival Internacional de Artes Vivas.",
    metaTitle: "Eventos de Artes Vivas en Loja — Agenda Cultural Ecuador",
    metaDescription:
      "Cartelera del Festival Internacional de Artes Vivas en Loja, danza, performances e intervenciones públicas en la ciudad cultural de Ecuador.",
    keywords: [
      "Artes Vivas Loja",
      "Festival Internacional de Artes Vivas Loja",
      "Danza en Loja",
      "Performance escénica Loja",
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
      canonical: `${SITE_CONFIG.url}/eventos/categoria/${cat.slug}`,
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
