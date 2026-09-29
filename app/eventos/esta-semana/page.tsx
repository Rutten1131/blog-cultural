import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { getRangoEstaSemanaLojaUTC, formatFechaLoja } from "@/lib/fechas";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { Navbar } from "@/components/Navbar";

export const revalidate = 3600; // Se actualiza cada hora

export const metadata: Metadata = {
  title: "Qué Hacer en Loja Esta Semana — Agenda Cultural y Cartelera",
  description:
    "Descubre los eventos culturales de esta semana en Loja, Ecuador. Conciertos, teatro, exposiciones y actividades artísticas de lunes a domingo. Entrada libre.",
  keywords: [
    "qué hacer en Loja esta semana",
    "eventos de la semana en Loja",
    "cartelera semanal Loja",
    "agenda cultural Loja esta semana",
    "actividades culturales Loja",
    "conciertos Loja esta semana",
    "teatro Loja esta semana",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/eventos/esta-semana`,
  },
  openGraph: {
    title: "Qué Hacer en Loja Esta Semana — Cartelera Cultural Oficial",
    description:
      "Explora la cartelera cultural completa de esta semana en Loja. Conciertos, exposiciones y planes de lunes a domingo.",
    url: `${SITE_CONFIG.url}/eventos/esta-semana`,
    siteName: SITE_CONFIG.nombre,
    locale: "es_EC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qué Hacer en Loja Esta Semana — Agenda Cultural",
    description:
      "Cartelera cultural de esta semana en Loja, Ecuador: música, arte, teatro y ferias.",
  },
};

export default async function EstaSemanaPage() {
  const { inicio, fin } = getRangoEstaSemanaLojaUTC();

  // Buscar eventos activos en el intervalo de esta semana
  // Un evento cae esta semana si:
  // (fecha <= fin && (fechaFin >= inicio || fecha >= inicio))
  const eventos = await prisma.evento.findMany({
    where: {
      estado: "APROBADO",
      AND: [
        { fecha: { lte: fin } },
        {
          OR: [
            { fechaFin: { gte: inicio } },
            { AND: [{ fechaFin: null }, { fecha: { gte: inicio } }] },
          ],
        },
      ],
    },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
  });

  const textoRango = `del ${formatFechaLoja(inicio, "corto")} al ${formatFechaLoja(fin, "corto")}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_CONFIG.url}/eventos/esta-semana/#webpage`,
        url: `${SITE_CONFIG.url}/eventos/esta-semana`,
        name: "Qué Hacer en Loja Esta Semana — Agenda Cultural",
        description: `Cartelera cultural y actividades programadas ${textoRango} en Loja, Ecuador.`,
        inLanguage: "es-EC",
        isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_CONFIG.url },
          { "@type": "ListItem", position: 2, name: "Eventos", item: `${SITE_CONFIG.url}/eventos` },
          { "@type": "ListItem", position: 3, name: "Esta Semana", item: `${SITE_CONFIG.url}/eventos/esta-semana` },
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
          {/* Navegación migas de pan */}
          <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">
              Inicio
            </Link>
            <span>›</span>
            <Link href="/eventos" className="hover:text-[var(--color-purple-1)] transition-colors">
              Eventos
            </Link>
            <span>›</span>
            <span className="text-[var(--color-dark)] font-bold">Esta Semana</span>
          </nav>

          {/* Header Hero SEO */}
          <header className="mb-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mb-3">
              📅 Cartelera Semanal Dinámica
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
              Qué hacer en Loja esta semana
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-muted)] max-w-3xl leading-relaxed">
              Descubre los planes, conciertos, talleres y actividades culturales programados en Loja ({textoRango}).
              Actualizado dinámicamente con acceso libre.
            </p>

            {/* Accesos directos a otras vistas de fecha */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/eventos/este-fin-de-semana"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-dark)] bg-[var(--color-dark)] text-white px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                🎉 Ver este fin de semana
              </Link>
              <Link
                href="/eventos"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-border)] bg-white/80 text-[var(--color-dark)] px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-dark)] hover:shadow-sm"
              >
                🗓️ Ver cartelera completa
              </Link>
            </div>
          </header>

          {/* Listado de eventos de esta semana */}
          {eventos.length === 0 ? (
            <div className="py-12">
              <EstadoVacioEvento
                mensaje="No hay eventos registrados para los días restantes de esta semana. Los organizadores y gestores culturales de Loja están actualizando la programación."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventos.map((evento) => (
                <EventoListCard key={evento.id} evento={evento} />
              ))}
            </div>
          )}

          {/* Párrafo semántico SEO y enlaces de valor al pie */}
          <section className="mt-16 pt-8 border-t border-[var(--color-border)] text-sm text-[var(--color-muted)]">
            <h2 className="font-display text-lg font-bold text-[var(--color-dark)] mb-2">
              Sobre la agenda cultural semanal de Loja
            </h2>
            <p className="leading-relaxed">
              La ciudad de Loja, capital musical y cultural del Ecuador, ofrece durante toda la semana opciones de recreación artística en sus principales teatros y plazas: el Teatro Nacional Benjamín Carrión, el Teatro Bolívar, la Casona Cultural y la Plaza de San Sebastián. En esta página recopilamos automáticamente las actividades de lunes a domingo para que planifiques qué hacer en Loja sin perderte ningún acontecimiento artístico relevante.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
