import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { getRangoFinDeSemanaLojaUTC, formatFechaLoja } from "@/lib/fechas";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { Navbar } from "@/components/Navbar";

export const revalidate = 3600; // Se actualiza cada hora

export const metadata: Metadata = {
  title: "Qué Hacer en Loja Este Fin de Semana — Eventos y Planes",
  description:
    "Los mejores planes y eventos culturales para este fin de semana en Loja, Ecuador (viernes a domingo). Conciertos, ferias, teatro y exposiciones gratuitas.",
  keywords: [
    "qué hacer en Loja este fin de semana",
    "planes fin de semana Loja",
    "eventos fin de semana Loja",
    "conciertos Loja fin de semana",
    "actividades culturales Loja fin de semana",
    "agenda cultural Loja",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/eventos/este-fin-de-semana`,
  },
  openGraph: {
    title: "Qué Hacer en Loja Este Fin de Semana — Planes y Cartelera Cultural",
    description:
      "Planes recomendados y eventos culturales de viernes a domingo en Loja, Ecuador. Conciertos, teatro, ferias y arte.",
    url: `${SITE_CONFIG.url}/eventos/este-fin-de-semana`,
    siteName: SITE_CONFIG.nombre,
    locale: "es_EC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qué Hacer en Loja Este Fin de Semana — Agenda Cultural",
    description:
      "Cartelera cultural de fin de semana en Loja: teatro, conciertos y arte con entrada libre.",
  },
};

export default async function EsteFinDeSemanaPage() {
  const { inicio, fin } = getRangoFinDeSemanaLojaUTC();

  // Buscar eventos que ocurran en el fin de semana (viernes a domingo)
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
        "@id": `${SITE_CONFIG.url}/eventos/este-fin-de-semana/#webpage`,
        url: `${SITE_CONFIG.url}/eventos/este-fin-de-semana`,
        name: "Qué Hacer en Loja Este Fin de Semana — Agenda Cultural",
        description: `Cartelera cultural y actividades artísticas programadas para el fin de semana (${textoRango}) en Loja, Ecuador.`,
        inLanguage: "es-EC",
        isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_CONFIG.url },
          { "@type": "ListItem", position: 2, name: "Eventos", item: `${SITE_CONFIG.url}/eventos` },
          { "@type": "ListItem", position: 3, name: "Este Fin de Semana", item: `${SITE_CONFIG.url}/eventos/este-fin-de-semana` },
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
            <span className="text-[var(--color-dark)] font-bold">Este Fin de Semana</span>
          </nav>

          {/* Header Hero SEO */}
          <header className="mb-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-3">
              🎉 Planes de Fin de Semana (Viernes a Domingo)
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
              Qué hacer en Loja este fin de semana
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-muted)] max-w-3xl leading-relaxed">
              Selección de eventos, funciones de teatro, conciertos al aire libre y exposiciones en Loja para disfrutar ({textoRango}).
            </p>

            {/* Accesos rápidos */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/eventos/esta-semana"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-dark)] bg-[var(--color-dark)] text-white px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                📅 Ver toda la semana
              </Link>
              <Link
                href="/eventos"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-border)] bg-white/80 text-[var(--color-dark)] px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-dark)] hover:shadow-sm"
              >
                🗓️ Ver cartelera completa
              </Link>
            </div>
          </header>

          {/* Listado de eventos del fin de semana */}
          {eventos.length === 0 ? (
            <div className="py-12">
              <EstadoVacioEvento
                mensaje="Aún no hay eventos registrados para este fin de semana. Pronto se publicarán nuevas presentaciones artísticas y festivales."
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
              Planes de fin de semana en Loja, Ecuador
            </h2>
            <p className="leading-relaxed">
              Los fines de semana en Loja reúnen una vibrante oferta que incluye retretas musicales en la Plaza de Santo Domingo, puestas en escena en el Teatro Nacional Benjamín Carrión, ferias de emprendimiento y arte en el Valle y actividades familiares en el Parque Recreacional Jipiro. En esta sección actualizada en tiempo real encuentras la cartelera oficial para armar tu fin de semana cultural.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
