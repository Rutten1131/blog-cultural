import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { inicioDelDiaLojaUTC } from "@/lib/fechas";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { EventosPasadosList } from "@/components/EventosPasadosList";
import { Navbar } from "@/components/Navbar";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ venue: string }>;
}

/**
 * Catálogo cerrado de los venues / recintos culturales más importantes de Loja.
 * Cada uno tiene: slug URL, nombre oficial, descripción SEO, dirección, coordenadas
 * y los términos que se usarán para buscar sus eventos en la BD (campo `lugar`).
 */
const VENUES: Record<string, {
  nombre: string;
  descripcion: string;
  direccion: string;
  barrio: string;
  lat: number;
  lng: number;
  terminos: string[]; // palabras clave para match en evento.lugar
  tipo: string;
  googleMapsUrl: string;
}> = {
  "teatro-benjamin-carrion": {
    nombre: "Teatro Nacional Benjamín Carrión",
    descripcion: "El teatro principal de Loja y uno de los más importantes del Ecuador. Sede del Festival Internacional de Artes Vivas (FIAVL), conciertos de la Orquesta Sinfónica de Loja y grandes montajes de danza, teatro y ópera.",
    direccion: "Bolívar s/n y Rocafuerte, Centro Histórico",
    barrio: "El Sagrario",
    lat: -3.99958,
    lng: -79.20421,
    terminos: ["teatro benjamín carrión", "teatro benjamin carrion", "teatro nacional", "benjamin carrion"],
    tipo: "Teatro",
    googleMapsUrl: "https://www.google.com/maps?q=-3.99958,-79.20421",
  },
  "teatro-bolivar": {
    nombre: "Teatro Simón Bolívar",
    descripcion: "Teatro histórico del centro de Loja, sede habitual de la Orquesta Sinfónica de Loja y espectáculos culturales del Municipio. Espacio emblemático de la vida cultural lojana desde el siglo XIX.",
    direccion: "10 de Agosto y Rocafuerte, Centro Histórico",
    barrio: "El Sagrario",
    lat: -3.99723,
    lng: -79.20455,
    terminos: ["teatro bolívar", "teatro bolivar", "teatro simón bolívar", "teatro simon bolivar"],
    tipo: "Teatro",
    googleMapsUrl: "https://www.google.com/maps?q=-3.99723,-79.20455",
  },
  "teatro-segundo-cueva-celi": {
    nombre: "Teatro de Artes Segundo Cueva Celi",
    descripcion: "Sala de la Casa de la Cultura Ecuatoriana Núcleo de Loja. Espacio íntimo y muy activo con teatro local, festivales de rock, encuentros literarios y artes escénicas experimentales.",
    direccion: "Rocafuerte y Sucre, Centro Histórico",
    barrio: "El Sagrario",
    lat: -3.9988,
    lng: -79.2045,
    terminos: ["segundo cueva celi", "teatro cueva celi", "casa de la cultura"],
    tipo: "Teatro",
    googleMapsUrl: "https://www.google.com/maps?q=-3.9988,-79.2045",
  },
  "casona-cultural": {
    nombre: "Casona Cultural",
    descripcion: "Centro cultural patrimonial del Ministerio de Cultura del Ecuador en Loja. Sede de exposiciones de arte, talleres, conversatorios y muestras de fotografía y plástica.",
    direccion: "Bolívar y José Antonio Eguiguren, Centro Histórico",
    barrio: "El Sagrario",
    lat: -3.99955,
    lng: -79.20325,
    terminos: ["casona cultural", "casona"],
    tipo: "Centro Cultural",
    googleMapsUrl: "https://www.google.com/maps?q=-3.99955,-79.20325",
  },
  "casa-de-la-cultura": {
    nombre: "Casa de la Cultura Ecuatoriana — Núcleo de Loja",
    descripcion: "Institución cultural referente de Loja. Organiza el Festival Loja Rock, talleres artísticos, exposiciones y publicaciones literarias. Cuenta con la galería Ángel Rubén Garrido y el Auditorio Pablo Palacio.",
    direccion: "Rocafuerte y Sucre",
    barrio: "El Sagrario",
    lat: -3.9992,
    lng: -79.2038,
    terminos: ["casa de la cultura", "casa cultura", "auditorio pablo palacio", "galería ángel rubén garrido", "galeria angel ruben garrido"],
    tipo: "Centro Cultural",
    googleMapsUrl: "https://www.google.com/maps?q=-3.9992,-79.2038",
  },
  "plaza-san-sebastian": {
    nombre: "Plaza de San Sebastián",
    descripcion: "Plaza histórica del centro de Loja, escenario habitual de retretas musicales, festivales al aire libre, ferias artesanales y actividades culturales del Municipio. Punto de encuentro de la vida ciudadana lojana.",
    direccion: "Plaza de San Sebastián, Centro Histórico",
    barrio: "San Sebastián",
    lat: -4.00412,
    lng: -79.20371,
    terminos: ["plaza san sebastián", "plaza san sebastian", "parque san sebastián", "parque san sebastian"],
    tipo: "Plaza / Espacio Público",
    googleMapsUrl: "https://www.google.com/maps?q=-4.00412,-79.20371",
  },
  "parque-jipiro": {
    nombre: "Parque Recreacional Jipiro",
    descripcion: "Parque recreacional y natural de Loja con réplicas de monumentos del mundo. Sede de festivales familiares, ferias gastronómicas y actividades culturales al aire libre.",
    direccion: "Av. Universitaria, Barrio Jipiro",
    barrio: "Sucre",
    lat: -3.97455,
    lng: -79.20785,
    terminos: ["jipiro", "parque jipiro", "parque recreacional jipiro"],
    tipo: "Parque",
    googleMapsUrl: "https://www.google.com/maps?q=-3.97455,-79.20785",
  },
  "museo-musica-loja": {
    nombre: "Museo de la Música de Loja",
    descripcion: "Museo dedicado al patrimonio musical de Loja, la ciudad musical del Ecuador. Ofrece exposiciones permanentes y temporales sobre la historia de la música lojana y sus grandes compositores.",
    direccion: "Centro Histórico de Loja",
    barrio: "El Sagrario",
    lat: -4.00045,
    lng: -79.20365,
    terminos: ["museo de la música", "museo de la musica", "museo musica loja"],
    tipo: "Museo",
    googleMapsUrl: "https://www.google.com/maps?q=-4.00045,-79.20365",
  },
};

// Genera todas las rutas estáticas en build time
export async function generateStaticParams() {
  return Object.keys(VENUES).map((venue) => ({ venue }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { venue: venueSlug } = await params;
  const venue = VENUES[venueSlug];
  if (!venue) return { title: "Venue no encontrado" };

  return {
    title: `Eventos en ${venue.nombre} — Agenda Cultural Loja`,
    description: `Cartelera de eventos culturales en ${venue.nombre}, ${venue.direccion}, Loja, Ecuador. ${venue.descripcion.slice(0, 100)}...`,
    keywords: [
      `eventos en ${venue.nombre}`,
      `qué hacer en ${venue.nombre}`,
      `agenda ${venue.nombre} Loja`,
      `${venue.tipo} Loja`,
      `actividades culturales ${venue.nombre}`,
      "qué hacer en Loja",
      "agenda cultural Loja",
    ],
    alternates: {
      canonical: `${SITE_CONFIG.url}/lugar/${venueSlug}`,
    },
    openGraph: {
      title: `Eventos en ${venue.nombre} — Cartelera Oficial`,
      description: `${venue.descripcion.slice(0, 155)}...`,
      url: `${SITE_CONFIG.url}/lugar/${venueSlug}`,
      siteName: SITE_CONFIG.nombre,
      locale: "es_EC",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Eventos en ${venue.nombre} — Agenda Cultural Loja`,
      description: `Cartelera de conciertos, teatro, arte y actividades en ${venue.nombre}, Loja.`,
    },
  };
}

export default async function VenuePage({ params }: PageProps) {
  const { venue: venueSlug } = await params;
  const venue = VENUES[venueSlug];

  if (!venue) notFound();

  const hoyLoja = inicioDelDiaLojaUTC();

  // Buscar todos los eventos que mencionan este venue en el campo `lugar`
  // Filtramos insensible a mayúsculas en memoria después de traer de BD
  const todosLosEventosAprobados = await prisma.evento.findMany({
    where: { estado: "APROBADO" },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
  });

  // Filtro por términos del venue (insensible a tildes y mayúsculas)
  function normalizar(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  const terminosNorm = venue.terminos.map(normalizar);

  const eventosDelVenue = todosLosEventosAprobados.filter((ev) => {
    const lugarNorm = normalizar(ev.lugar);
    return terminosNorm.some((t) => lugarNorm.includes(t));
  });

  const eventosProximos = eventosDelVenue.filter(
    (ev) => new Date(ev.fechaFin ?? ev.fecha) >= hoyLoja
  );
  const eventosPasados = eventosDelVenue
    .filter((ev) => new Date(ev.fechaFin ?? ev.fecha) < hoyLoja)
    .reverse()
    .slice(0, 30);

  // Schema.org: Place + CollectionPage + BreadcrumbList
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Place",
        "@id": `${SITE_CONFIG.url}/lugar/${venueSlug}#place`,
        name: venue.nombre,
        description: venue.descripcion,
        address: {
          "@type": "PostalAddress",
          streetAddress: venue.direccion,
          addressLocality: "Loja",
          addressRegion: venue.barrio,
          addressCountry: "EC",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: venue.lat,
          longitude: venue.lng,
        },
        url: `${SITE_CONFIG.url}/lugar/${venueSlug}`,
        sameAs: [venue.googleMapsUrl],
        additionalType: venue.tipo,
        // Declaramos los eventos próximos que ocurren aquí (para GEO e IA)
        event: eventosProximos.slice(0, 10).map((ev) => ({
          "@type": "Event",
          name: ev.nombre,
          startDate: new Date(ev.fecha).toISOString(),
          url: `${SITE_CONFIG.url}/eventos/${ev.slug}`,
        })),
      },
      {
        "@type": "CollectionPage",
        "@id": `${SITE_CONFIG.url}/lugar/${venueSlug}#webpage`,
        url: `${SITE_CONFIG.url}/lugar/${venueSlug}`,
        name: `Eventos en ${venue.nombre}`,
        description: `Cartelera completa de eventos culturales en ${venue.nombre}, Loja.`,
        inLanguage: "es-EC",
        isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_CONFIG.url },
          { "@type": "ListItem", position: 2, name: "Eventos", item: `${SITE_CONFIG.url}/eventos` },
          { "@type": "ListItem", position: 3, name: venue.nombre, item: `${SITE_CONFIG.url}/lugar/${venueSlug}` },
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
      <div className="flex min-h-screen flex-col font-sans" style={{ background: "var(--color-bg)" }}>
        <Navbar />

        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 flex-1">
          {/* Breadcrumb */}
          <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">Inicio</Link>
            <span>›</span>
            <Link href="/eventos" className="hover:text-[var(--color-purple-1)] transition-colors">Eventos</Link>
            <span>›</span>
            <span className="text-[var(--color-dark)] font-bold">{venue.nombre}</span>
          </nav>

          {/* Header del Venue */}
          <header className="mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-700 border border-purple-500/20 mb-3">
              🏛️ {venue.tipo}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
              Eventos en {venue.nombre}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-muted)] max-w-3xl leading-relaxed">
              {venue.descripcion}
            </p>

            {/* Info del lugar */}
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
              <span className="flex items-center gap-1.5">
                📍 <span>{venue.direccion}, Loja</span>
              </span>
              <a
                href={venue.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--color-purple-1)] font-semibold hover:underline"
              >
                🗺️ Ver en Google Maps
              </a>
            </div>

            {/* Accesos rápidos */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/eventos/esta-semana"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-dark)] bg-[var(--color-dark)] text-white px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5"
              >
                📅 Ver toda la semana
              </Link>
              <Link
                href="/eventos"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-border)] bg-white/80 text-[var(--color-dark)] px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5"
              >
                🗓️ Cartelera completa
              </Link>
            </div>
          </header>

          {/* Eventos próximos en este venue */}
          <section className="mb-14">
            <div className="mb-6 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <h2 className="font-display text-xl font-black uppercase tracking-tight text-[var(--color-dark)]">
                Próximos eventos aquí
              </h2>
            </div>

            {eventosProximos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventosProximos.map((evento) => (
                  <EventoListCard key={evento.id} evento={evento} />
                ))}
              </div>
            ) : (
              <EstadoVacioEvento
                mensaje={`No hay eventos próximos programados en ${venue.nombre} en este momento.`}
              />
            )}
          </section>

          {/* Eventos pasados en este venue */}
          <EventosPasadosList
            eventos={eventosPasados}
            titulo={`Eventos realizados en ${venue.nombre}`}
            subtitulo={`Registro histórico de presentaciones, conciertos y exposiciones en este recinto.`}
            tituloKey="eventos_page.pasados_titulo"
            subtituloKey="eventos_page.pasados_subtitulo"
            initialCount={6}
            step={6}
          />

          {/* Párrafo semántico SEO — describe el venue para buscadores e IA */}
          <section className="mt-14 p-6 rounded-2xl bg-neutral-50 border border-[var(--color-border)] text-sm text-[var(--color-muted)]">
            <h2 className="font-display text-base font-bold text-[var(--color-dark)] mb-2">
              ¿Qué pasa en {venue.nombre}?
            </h2>
            <p className="leading-relaxed mb-3">
              {venue.nombre} es uno de los principales escenarios culturales de Loja, Ecuador. En esta página recopilamos automáticamente todos los eventos artísticos, conciertos, obras de teatro, exposiciones y actividades que se desarrollan en este recinto. Consulta la cartelera actualizada para planificar tu visita a {venue.nombre} en Loja.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-[var(--color-purple-1)] pt-2 border-t border-neutral-200">
              <Link href="/eventos" className="hover:underline">← Cartelera completa de Loja</Link>
              <Link href="/eventos/esta-semana" className="hover:underline">📅 Qué hacer esta semana</Link>
              <Link href="/eventos/este-fin-de-semana" className="hover:underline">🎉 Este fin de semana</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export { VENUES };
