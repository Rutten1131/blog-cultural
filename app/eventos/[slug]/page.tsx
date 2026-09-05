import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { formatFechaHoraLoja } from "@/lib/fechas";
import { BackButton } from "@/components/BackButton";
import { EventoListCard } from "@/components/EventoListCard";
import { Navbar } from "@/components/Navbar";
import { MediaGallery } from "@/components/MediaGallery";

// Habilitar ISR (Incremental Static Regeneration) cada 60 segundos
export const revalidate = 60;

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

  const title = `${evento.nombre} — Evento Cultural en Loja`;
  const desc = evento.descripcion || "";
  const description =
    desc.length > 155
      ? `${desc.slice(0, 152)}...`
      : desc;

  const url = `${SITE_CONFIG.url}/eventos/${evento.slug}`;
  const categoriaNombre = evento.categoria?.nombre || "Cultural";
  const zonaNombre = evento.zona?.nombre || "Loja";

  const keywords = [
    evento.nombre,
    `evento ${categoriaNombre}`,
    `que hacer en Loja ${zonaNombre}`,
    `cultura Loja`,
    `agenda cultural Loja`,
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

  // Schema.org Event (JSON-LD) totalmente enriquecido para Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evento.nombre,
    startDate: isoStartDate,
    ...(isoEndDate && { endDate: isoEndDate }),
    description: evento.descripcion || "",
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
  };

  const fechaInicioFormateada = formatFechaHoraLoja(evento.fecha, "largo");
  const fechaFinFormateada = evento.fechaFin ? formatFechaHoraLoja(evento.fechaFin, "largo") : null;

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
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 leading-tight">
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
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {evento.lugar}
                  </span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                    Organizador / Gestor
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
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
                <div className="whitespace-pre-line text-base">
                  {evento.descripcion}
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
