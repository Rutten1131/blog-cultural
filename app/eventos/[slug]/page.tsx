import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";

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

  const title = `${evento.nombre} — ${SITE_CONFIG.nombre}`;
  const description =
    evento.descripcion.length > 155
      ? `${evento.descripcion.slice(0, 152)}...`
      : evento.descripcion;

  const url = `${SITE_CONFIG.url}/eventos/${evento.slug}`;

  return {
    title,
    description,
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

  // Schema.org Event (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evento.nombre,
    startDate: new Date(evento.fecha).toISOString(),
    description: evento.descripcion,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
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
  };

  const fechaFormateada = new Date(evento.fecha).toLocaleDateString("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Marcado Estructurado JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black text-zinc-900 dark:text-zinc-100">
        <main className="w-full max-w-4xl mx-auto px-6 py-12">
          {/* Miga de pan / Botón volver */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-8 transition-colors"
          >
            ← Volver a la agenda
          </Link>

          <article className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Imagen Destacada */}
            {evento.imagenUrl && (
              <div className="relative w-full h-72 sm:h-96 bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={evento.imagenUrl}
                  alt={evento.nombre}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            )}

            <div className="p-8 sm:p-12">
              {/* Badges de Categoría y Zona */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {evento.categoria && (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-3.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {evento.categoria.nombre}
                  </span>
                )}
                {evento.zona && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    📍 {evento.zona.nombre} ({evento.zona.tipo})
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
                    Fecha y Hora
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                    {fechaFormateada}
                  </span>
                </div>
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
        </main>
      </div>
    </>
  );
}
