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

// Habilitar ISR (Incremental Static Regeneration) cada 60 segundos
export const revalidate = 60;

/**
 * Construye la URL del iframe de Google Maps.
 * 1° (Opción B): Si la URL tiene @lat,lng las extrae directamente.
 * 2° Si es un link corto (maps.app.goo.gl, goo.gl), hace un fetch
 *    siguiendo el redirect y extrae las coordenadas de la URL expandida.
 * 3° (Fallback): Busca por el texto del lugar + "Loja, Ecuador".
 */
async function buildMapEmbedUrl(mapaUrl: string | null, lugarTexto: string): Promise<string> {
  // Fallback siempre disponible
  const fallback = `https://maps.google.com/maps?q=${encodeURIComponent(`${lugarTexto}, Loja, Ecuador`)}&hl=es&z=15&output=embed`;

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

// ─── Auxiliar: Obtener evento aprobado ────────────────────────────────
async function getEventoAprobado(slug: string) {
  try {
    return await prisma.evento.findFirst({
      where: {
        slug,
        estado: "APROBADO",
      },
      include: {
        categoria: true,
        zona: true,
      },
    });
  } catch (error) {
    console.error(`Error buscando evento aprobado (${slug}):`, error);
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
  const mapaHref = hasMapa
    ? mapaUrlRaw!
    : `https://www.google.com/maps/search/${encodeURIComponent(`${evento.lugar}, Loja, Ecuador`)}`;


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
          {/* Navegación y Volver */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <BackButton />
            <nav className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <Link href="/" className="hover:text-purple-600 transition-colors">Inicio</Link>
              <span>›</span>
              <Link href="/eventos" className="hover:text-purple-600 transition-colors">Eventos</Link>
              <span>›</span>
              <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[140px] sm:max-w-[220px]">{evento.nombre}</span>
            </nav>
          </div>

          <article className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Galería / Carrusel de Imágenes y Video con fallback seguro */}
            <MediaGallery
              multimedia={evento.multimedia}
              imagenUrl={evento.imagenUrl}
              videoUrl={evento.videoUrl}
              nombre={evento.nombre}
            />

            <div className="p-8 sm:p-12">
              {/* Badges de Categoría y Zona */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {evento.categoria && (
                  <Link
                    href={`/eventos/categoria/${evento.categoria.slug}`}
                    className="inline-flex items-center rounded-full bg-zinc-100 hover:bg-purple-100 hover:text-purple-700 dark:bg-zinc-800 px-3.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    {evento.categoria.nombre}
                  </Link>
                )}
                {evento.zona && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    📍 {evento.zona.nombre} ({evento.zona.tipo})
                  </span>
                )}
                {evento.fechaFin && (
                  <span className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-3.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                    ✨ Evento de varios días
                  </span>
                )}
              </div>

              {/* Título */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 leading-tight break-words [overflow-wrap:anywhere]">
                {evento.nombre}
              </h1>

              {/* Ficha de Detalles del Evento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 mb-8 text-sm">
                <div>
                  <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                    {evento.fechaFin ? "Fecha de Inicio" : "Fecha y Hora"}
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                    {fechaInicioFormateada}
                  </span>
                </div>
                {evento.fechaFin && (
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                      Fecha de Finalización
                    </span>
                    <span className="font-semibold text-purple-700 dark:text-purple-300 capitalize">
                      {fechaFinFormateada}
                    </span>
                  </div>
                )}
                <div>
                  <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                    Lugar / Recinto
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 break-words [overflow-wrap:anywhere]">
                    {evento.lugar}
                  </span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                    Organizador / Gestor
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 break-words [overflow-wrap:anywhere]">
                    {evento.nombreGestor}
                  </span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                    Ubicación Parroquial
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {evento.zona?.nombre ?? "Loja"}
                  </span>
                </div>
              </div>

              {/* Descripción completa */}
              <div className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                  Sobre este evento
                </h2>
                <div className="whitespace-pre-line text-base break-words [overflow-wrap:anywhere]">
                  {evento.descripcion}
                </div>
              </div>

              {/* Mapa de Ubicación */}
              <div className="mt-8">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  Ubicación del evento
                </h2>
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
                  <a
                    href={mapaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200"
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Abrir en Google Maps</span>
                    <svg className="h-4 w-4 opacity-75 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </article>

          {/* Sección de Eventos Relacionados / Recomendados */}
          {masRelacionados.length > 0 && (
            <section className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-12">
              <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">
                Otros eventos que te pueden interesar
              </h2>
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
