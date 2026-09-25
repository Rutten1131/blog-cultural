import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { formatFechaHoraLoja, formatFechaLoja } from "@/lib/fechas";
import { BackButton } from "@/components/BackButton";
import { EventoListCard } from "@/components/EventoListCard";
import { Navbar } from "@/components/Navbar";
import { MediaGallery } from "@/components/MediaGallery";
import { TranslatedEventContent } from "@/components/TranslatedEventContent";
import { EventPatrocinadoresSection } from "@/components/EventPatrocinadoresSection";
import {
  EventDetailHeaderClient,
  EventDetailUbicacionTitleClient,
  EventDetailMapsButtonClient,
  EventDetailRelatedTitleClient,
} from "@/components/EventDetailHeaderClient";

// Habilitar ISR (Incremental Static Regeneration) cada 60 segundos
export const revalidate = 60;

/**
 * Construye la URL del iframe de Google Maps.
 * 1° (Opción B): Si la URL tiene @lat,lng las extrae directamente.
 * 2° Si es un link corto (maps.app.goo.gl, goo.gl), hace un fetch
 *    siguiendo el redirect y extrae las coordenadas de la URL expandida.
 * 3° (Fallback): Busca por el texto del lugar + "Loja, Ecuador".
 */
// Catálogo de coordenadas exactas para los recintos culturales y plazas más frecuentes de Loja
const COORDENADAS_LOJA_RECINTOS: Record<string, { lat: number; lng: number }> = {
  // Teatros
  "teatro bolivar": { lat: -3.9972300, lng: -79.2045500 },
  "teatro benjamin carrion": { lat: -3.9995800, lng: -79.2042100 },
  "teatro nacional benjamin carrion": { lat: -3.9995800, lng: -79.2042100 },
  "teatro universitario": { lat: -3.9988000, lng: -79.2045000 },
  // Plazas y parques
  "plaza san sebastian": { lat: -4.0041200, lng: -79.2037100 },
  "plaza de san sebastian": { lat: -4.0041200, lng: -79.2037100 },
  "parque san sebastian": { lat: -4.0041200, lng: -79.2037100 },
  "plaza de la independencia": { lat: -3.9984800, lng: -79.2041300 },
  "parque central": { lat: -3.9984800, lng: -79.2041300 },
  "plaza central": { lat: -3.9984800, lng: -79.2041300 },
  "parque jipiro": { lat: -3.9745500, lng: -79.2078500 },
  "parque de la madre": { lat: -4.0018500, lng: -79.2019500 },
  "parque pucara": { lat: -3.9916000, lng: -79.2052000 },
  // Cultura y museos
  "casa de la cultura": { lat: -3.9992000, lng: -79.2038000 },
  "casa de la cultura ecuatoriana": { lat: -3.9992000, lng: -79.2038000 },
  "auditorio pablo palacio": { lat: -3.9992000, lng: -79.2038000 },
  "casona cultural": { lat: -3.9995500, lng: -79.2032500 },
  "museo de la musica": { lat: -4.0004500, lng: -79.2036500 },
  "museo de arte colonial": { lat: -3.9989000, lng: -79.2036000 },
  "museo de la ciudad": { lat: -3.9989500, lng: -79.2033500 },
  "centro cultural": { lat: -3.9992000, lng: -79.2038000 },
  "salon del centro cultural": { lat: -3.9992000, lng: -79.2038000 },
  // Iglesias y sitios religiosos
  "catedral": { lat: -3.9980800, lng: -79.2039200 },
  "iglesia catedral": { lat: -3.9980800, lng: -79.2039200 },
  "catedral de loja": { lat: -3.9980800, lng: -79.2039200 },
  "iglesia el valle": { lat: -4.0041200, lng: -79.2037100 },
  // Universidades y colegios
  "universidad tecnica particular de loja": { lat: -4.0019500, lng: -79.1969500 },
  "utpl": { lat: -4.0019500, lng: -79.1969500 },
  "universidad nacional de loja": { lat: -3.9928500, lng: -79.2073500 },
  "unl": { lat: -3.9928500, lng: -79.2073500 },
  // Referencia de calles
  "calle rocafuerte": { lat: -3.9988500, lng: -79.2023500 },
  "paseo cultural calle rocafuerte": { lat: -3.9988500, lng: -79.2023500 },
  "calle lourdes": { lat: -3.9981000, lng: -79.2037000 },
  // Otros recintos
  "puerta de la ciudad": { lat: -3.9875500, lng: -79.2039800 },
  "complejo ferial": { lat: -3.9782500, lng: -79.2104500 },
  "salon de la ciudad": { lat: -3.9992000, lng: -79.2038000 },
};

function buscarCoordenadasRecinto(lugarTexto: string): { lat: number; lng: number } | null {
  if (!lugarTexto) return null;
  const norm = lugarTexto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  for (const [clave, coords] of Object.entries(COORDENADAS_LOJA_RECINTOS)) {
    if (norm.includes(clave)) {
      return coords;
    }
  }
  return null;
}

async function buildMapEmbedUrl(mapaUrl: string | null, lugarTexto: string): Promise<string> {
  // 1. Si no hay URL directa de mapa, comprobar si es un recinto o plaza conocida de Loja
  const recintoCoords = buscarCoordenadasRecinto(lugarTexto);
  if (!mapaUrl && recintoCoords) {
    return `https://maps.google.com/maps?q=${recintoCoords.lat},${recintoCoords.lng}&hl=es&z=17&output=embed`;
  }

  // Fallback con búsqueda específica en Loja, Ecuador
  const fallback = recintoCoords
    ? `https://maps.google.com/maps?q=${recintoCoords.lat},${recintoCoords.lng}&hl=es&z=17&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(`${lugarTexto}, Loja, Ecuador`)}&hl=es&z=16&output=embed`;

  if (!mapaUrl) return fallback;

  // Intentar extraer @lat,lng directamente (URLs largas ya resueltas)
  const tryExtractCoords = (url: string): string | null => {
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&hl=es&z=17&output=embed`;
    }
    // Intentar ?q=lat,lng
    try {
      const parsed = new URL(url);
      const q = parsed.searchParams.get("q");
      if (q) {
        const qCoord = q.match(/^(-?\d+\.\d+),(-?\d+\.\d+)$/);
        if (qCoord) {
          return `https://maps.google.com/maps?q=${qCoord[1]},${qCoord[2]}&hl=es&z=17&output=embed`;
        }
      }
    } catch { /* ignorar */ }
    return null;
  };

  // Paso 1: intentar en la URL original (puede ser URL larga con coordenadas)
  const directResult = tryExtractCoords(mapaUrl);
  if (directResult) return directResult;

  // Paso 2: si es link corto, seguir el redirect en el servidor para obtener la URL real
  try {
    const parsed = new URL(mapaUrl);
    const isShort = ["maps.app.goo.gl", "goo.gl", "maps.google.com"].includes(parsed.hostname);

    if (isShort) {
      // Seguir el redirect manualmente (sin ejecutar JS) para obtener la Location header
      const res = await fetch(mapaUrl, {
        method: "HEAD",
        redirect: "manual",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AgendaCultural/1.0)" },
        // 3 segundos máximo para no bloquear el render
        signal: AbortSignal.timeout(3000),
      });

      const location = res.headers.get("location");
      if (location) {
        const fromExpanded = tryExtractCoords(location);
        if (fromExpanded) return fromExpanded;
      }

      // A veces el redirect es a otra URL corta — hacer un segundo intento con GET
      const res2 = await fetch(mapaUrl, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AgendaCultural/1.0)" },
        signal: AbortSignal.timeout(4000),
      });
      const fromFinal = tryExtractCoords(res2.url);
      if (fromFinal) return fromFinal;
    }
  } catch {
    // Si falla el fetch (red, timeout, etc.), ir al fallback
  }

  return fallback;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ─── 1. Pre-generación estática (build time) ──────────────────────────
export async function generateStaticParams() {
  try {
    const eventos = await prisma.evento.findMany({
      where: { estado: "APROBADO" },
      select: { slug: true },
    });

    return eventos.map((evento) => ({
      slug: evento.slug,
    }));
  } catch (error) {
    console.error("Error obteniendo static params de eventos:", error);
    return [];
  }
}

import { getAdminSession } from "@/lib/actions/authAdmin";

// ─── Auxiliar: Obtener evento (aprobado o en preview para admin) ────────
async function getEventoAprobado(slug: string) {
  try {
    const session = await getAdminSession();
    const esAdmin = !!session;

    return await prisma.evento.findFirst({
      where: {
        slug,
        ...(esAdmin ? {} : { estado: "APROBADO" }),
      },
      include: {
        categoria: true,
        zona: true,
      },
    });
  } catch (error) {
    console.error(`Error buscando evento (${slug}):`, error);
    return null;
  }
}

// ─── 2. Metadata Dinámica SEO ──────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const evento = await getEventoAprobado(slug);

  if (!evento) {
    return {
      title: "Evento no encontrado",
    };
  }

  const categoriaNombre = evento.categoria?.nombre || "Cultural";
  const zonaNombre = evento.zona?.nombre || "Loja";

  // Formatear fechas para SEO ("Qué hacer en Loja...")
  const fechaInicioStr = formatFechaLoja(evento.fecha, "largo");
  const fechaInicioCorta = formatFechaLoja(evento.fecha, "corto");
  let rangoTexto = fechaInicioStr;
  let fechaKeyword = `que hacer en Loja el ${fechaInicioCorta}`;

  if (evento.fechaFin) {
    const mismaFecha =
      new Date(evento.fecha).toDateString() === new Date(evento.fechaFin).toDateString();
    if (!mismaFecha) {
      const fechaFinStr = formatFechaLoja(evento.fechaFin, "largo");
      const fechaFinCorta = formatFechaLoja(evento.fechaFin, "corto");
      rangoTexto = `del ${fechaInicioCorta} al ${fechaFinCorta}`;
      fechaKeyword = `que hacer en Loja del ${fechaInicioCorta} al ${fechaFinCorta}`;
    }
  }

  // Título enfocado en intención de búsqueda directa
  const title = `${evento.nombre} (${rangoTexto}) — Qué hacer en Loja`;

  // Descripción optimizada para CTR en buscadores
  const baseDesc = evento.descripcion ? `${evento.descripcion.trim().slice(0, 100)}...` : "";
  const description = `¿Qué hacer en Loja? Descubre ${evento.nombre} (${rangoTexto}) en ${evento.lugar}. ${baseDesc}`.slice(0, 160);

  const url = `${SITE_CONFIG.url}/eventos/${evento.slug}`;

  const keywords = [
    evento.nombre,
    fechaKeyword,
    `que hacer en Loja ${fechaInicioStr}`,
    `que hacer en Loja ${zonaNombre}`,
    `evento ${categoriaNombre} Loja`,
    `agenda cultural Loja`,
    `cultura Loja`,
    evento.lugar,
    evento.nombreGestor,
  ].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.nombre,
      locale: SITE_CONFIG.locale,
      type: "article",
      images: evento.imagenUrl
        ? [
            {
              url: evento.imagenUrl,
              alt: evento.nombre,
              width: 1200,
              height: 630,
            },
          ]
        : [],
    },
    twitter: {
      card: evento.imagenUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: evento.imagenUrl ? [evento.imagenUrl] : [],
    },
  };
}

// ─── 3. Componente de Página ─────────────────────────────────────────
export default async function EventoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const evento = await getEventoAprobado(slug);

  if (!evento) {
    notFound();
  }

  // Buscar eventos relacionados (misma categoría o fecha más cercana, excluyendo el actual)
  let masRelacionados: any[] = [];
  try {
    const eventosRelacionados = await prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        id: { not: evento.id },
        ...(evento.categoriaId ? { categoriaId: evento.categoriaId } : {}),
      },
      include: { categoria: true, zona: true },
      orderBy: { fecha: "asc" },
      take: 3,
    });

    masRelacionados = eventosRelacionados;

    // Si no hay suficientes de la misma categoría, traer los más próximos en fecha general
    if (masRelacionados.length < 3) {
      const idsExistentes = [evento.id, ...masRelacionados.map((r) => r.id)];
      const extra = await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          id: { notIn: idsExistentes },
        },
        include: { categoria: true, zona: true },
        orderBy: { fecha: "asc" },
        take: 3 - masRelacionados.length,
      });
      masRelacionados = [...masRelacionados, ...extra];
    }
  } catch (error) {
    console.error("Error buscando eventos relacionados:", error);
  }

  // Validar y serializar fecha de manera segura para JSON-LD
  const parsedDate = new Date(evento.fecha);
  const isoStartDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();
  const parsedEndDate = evento.fechaFin ? new Date(evento.fechaFin) : null;
  const isoEndDate = parsedEndDate && !isNaN(parsedEndDate.getTime()) ? parsedEndDate.toISOString() : undefined;

  const fechaInicioFormateada = formatFechaHoraLoja(evento.fecha, "largo");
  const fechaFinFormateada = evento.fechaFin ? formatFechaHoraLoja(evento.fechaFin, "largo") : null;
  const fechaRangoTexto = fechaFinFormateada
    ? `${fechaInicioFormateada} hasta ${fechaFinFormateada}`
    : fechaInicioFormateada;

  // Resolver URL del mapa (async: sigue redirects de links cortos)
  const mapaUrlRaw = (evento as any).mapaUrl as string | null ?? null;
  const hasMapa = !!mapaUrlRaw;
  const embedUrl = await buildMapEmbedUrl(mapaUrlRaw, evento.lugar);

  // Botón "Ver en Google Maps": usar coordenadas exactas si están disponibles
  const recintoParaBoton = buscarCoordenadasRecinto(evento.lugar);
  const mapaHref = hasMapa && mapaUrlRaw
    ? mapaUrlRaw
    : recintoParaBoton
      ? `https://www.google.com/maps?q=${recintoParaBoton.lat},${recintoParaBoton.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${evento.lugar}, Loja, Ecuador`)}&query_place_id=`;


  // Schema múltiple (@graph) con Event, BreadcrumbList y FAQPage
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Event",
        "@id": `${SITE_CONFIG.url}/eventos/${evento.slug}#event`,
        name: evento.nombre,
        startDate: isoStartDate,
        ...(isoEndDate && { endDate: isoEndDate }),
        description: evento.descripcion || `Evento ${evento.nombre} en Loja, Ecuador`,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        inLanguage: "es-EC",
        category: evento.categoria?.nombre || "Cultura",
        location: {
          "@type": "Place",
          name: evento.lugar,
          address: {
            "@type": "PostalAddress",
            addressLocality: "Loja",
            addressRegion: evento.zona?.nombre ?? "Loja",
            addressCountry: "EC",
          },
        },
        ...(evento.imagenUrl && { image: [evento.imagenUrl] }),
        organizer: {
          "@type": "Organization",
          name: evento.nombreGestor,
        },
        performer: {
          "@type": "PerformingGroup",
          name: evento.nombreGestor,
        },
        publisher: {
          "@type": "Person",
          name: "César Reyes Jaramillo",
          url: `${SITE_CONFIG.url}/sobre-el-proyecto`,
        },
        creator: {
          "@type": "Person",
          name: "César Reyes Jaramillo",
          url: `${SITE_CONFIG.url}/sobre-el-proyecto`,
        },
        author: {
          "@type": "Person",
          name: "César Reyes Jaramillo",
          url: `${SITE_CONFIG.url}/sobre-el-proyecto`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_CONFIG.url}/eventos/${evento.slug}#breadcrumb`,
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
          ...(evento.categoria
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: evento.categoria.nombre,
                  item: `${SITE_CONFIG.url}/eventos/categoria/${evento.categoria.slug}`,
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: evento.nombre,
                  item: `${SITE_CONFIG.url}/eventos/${evento.slug}`,
                },
              ]
            : [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: evento.nombre,
                  item: `${SITE_CONFIG.url}/eventos/${evento.slug}`,
                },
              ]),
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_CONFIG.url}/eventos/${evento.slug}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: `¿Qué se puede hacer en Loja el día de este evento?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `En esta fecha puedes asistir a "${evento.nombre}", un evento cultural de categoría ${evento.categoria?.nombre || "Cultura"} en ${evento.lugar}, Loja.`,
            },
          },
          {
            "@type": "Question",
            name: `¿Cuándo y a qué hora es ${evento.nombre}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `El evento inicia el ${fechaRangoTexto} en horario de Loja, Ecuador.`,
            },
          },
          {
            "@type": "Question",
            name: `¿Dónde se realizará ${evento.nombre}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Se llevará a cabo en ${evento.lugar}, sector ${evento.zona?.nombre ?? "Loja"}, Loja, Ecuador. Organizado por ${evento.nombreGestor}.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      {/* Marcado Estructurado JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex min-h-screen flex-col font-sans text-zinc-900 dark:text-zinc-100" style={{ background: "var(--color-bg)" }}>
        {/* Navbar Flotante */}
        <Navbar />

        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 flex-1">
          {evento.estado !== "APROBADO" && (
            <div className="mb-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-4 text-amber-800 dark:text-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👁️</span>
                <div>
                  <p className="font-bold text-sm">Modo Vista Previa de Administrador</p>
                  <p className="text-xs opacity-90">Este evento aún está en estado <strong>{evento.estado}</strong> y no es visible para el público general.</p>
                </div>
              </div>
              <Link
                href="/admin"
                className="shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl transition shadow-sm"
              >
                Volver al Panel
              </Link>
            </div>
          )}

          {/* Encabezado dinámico: Back, Breadcrumb y Badges de Categoría y Zona */}
          <EventDetailHeaderClient
            categoria={evento.categoria}
            zona={evento.zona}
            fechaFin={!!evento.fechaFin}
            nombreOriginal={evento.nombre}
          />

          <article className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Galería / Carrusel de Imágenes y Video con fallback seguro */}
            <MediaGallery
              multimedia={evento.multimedia}
              imagenUrl={evento.imagenUrl}
              videoUrl={evento.videoUrl}
              nombre={evento.nombre}
            />

            <div className="p-8 sm:p-12">
              {/* Contenido Traducible con IA Dinámica (Título, Ficha y Descripción) */}
              <TranslatedEventContent
                initialTitle={evento.nombre}
                initialDescription={evento.descripcion}
                initialLocation={evento.lugar}
                initialZona={evento.zona?.nombre ?? "Loja"}
                fechaOriginal={evento.fecha}
                fechaFinOriginal={evento.fechaFin}
                fechaInicioFormateada={fechaInicioFormateada}
                fechaFinFormateada={fechaFinFormateada ?? undefined}
                nombreGestor={evento.nombreGestor}
                hasFechaFin={!!evento.fechaFin}
              />

              {/* Sección de Patrocinadores y Auspiciantes (Opcional) */}
              <EventPatrocinadoresSection patrocinadores={evento.patrocinadores} />

              {/* Mapa de Ubicación */}
              <div className="mt-8">
                <EventDetailUbicacionTitleClient />
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                  {evento.lugar}
                  {!hasMapa && (
                    <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                      (ubicación aproximada basada en el nombre del lugar)
                    </span>
                  )}
                </p>
                <div
                  className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
                  style={{ paddingBottom: "56.25%", height: 0 }}
                >
                  <iframe
                    src={embedUrl}
                    title={`Ubicación de ${evento.nombre}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full"
                    style={{ border: 0 }}
                    allowFullScreen
                  />
                </div>
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <EventDetailMapsButtonClient mapaHref={mapaHref} />
                </div>
              </div>
            </div>
          </article>

          {/* Sección de Eventos Relacionados / Recomendados */}
          {masRelacionados.length > 0 && (
            <section className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-12">
              <EventDetailRelatedTitleClient />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {masRelacionados.map((item) => (
                  <EventoListCard key={item.id} evento={item} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
