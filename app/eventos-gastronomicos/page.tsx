import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { EventosGastronomicosClient } from "@/components/EventosGastronomicosClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Eventos Gastronómicos en Loja 2026 — Ferias, Festivales y Rutas del Café",
  description:
    "Descubre los mejores eventos gastronómicos en Loja 2026: ferias culinarias, festivales del café de especialidad, degustaciones, catas y mercados tradicionales en Loja, Ecuador.",
  keywords: [
    "Feria de Loja 2026",
    "Eventos gastronómicos Loja",
    "Festival gastronómico Loja",
    "Ruta del café Loja",
    "Ferias en Loja",
    "Qué hacer en Loja",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/eventos-gastronomicos`,
  },
  openGraph: {
    title: "Eventos Gastronómicos en Loja 2026 — Ferias y Festivales Culinarios",
    description:
      "Cartelera de eventos gastronómicos, ferias del café, festivales culinarios y rutas gastronómicas en Loja, Ecuador.",
    url: `${SITE_CONFIG.url}/eventos-gastronomicos`,
    siteName: SITE_CONFIG.nombre,
    locale: SITE_CONFIG.locale,
    type: "website",
  },
};

export default async function EventosGastronomicosHubPage() {
  // Purga determinista: eventos con fechaFin >= now - 2h (o fecha >= now - 2h)
  const ahoraMenosDosHoras = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const eventos = await prisma.evento.findMany({
    where: {
      estado: "APROBADO",
      categoria: { slug: "eventos-gastronomicos" },
      OR: [
        { fechaFin: { gte: ahoraMenosDosHoras } },
        { fecha: { gte: ahoraMenosDosHoras } },
      ],
    },
    include: {
      categoria: true,
      zona: true,
    },
    orderBy: { fecha: "asc" },
  });

  // Schema estructurado ItemList + BreadcrumbList
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
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
            name: "Eventos Gastronómicos",
            item: `${SITE_CONFIG.url}/eventos-gastronomicos`,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Eventos Gastronómicos en Loja 2026",
        description: "Directorio de ferias gastronómicas, festivales culinarios y rutas del café en Loja.",
        numberOfItems: eventos.length,
        itemListElement: eventos.map((ev, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: ev.nombre,
          url: `${SITE_CONFIG.url}/eventos/${ev.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 pb-16 pt-24 sm:pt-28">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent px-4 py-12 sm:px-6 sm:py-16 dark:border-zinc-800">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
              <span>🍲</span>
              <span>Hub Culinario & Cafetero</span>
            </div>

            <h1 className="mt-4 font-display text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-tight">
              Eventos Gastronómicos en Loja: Ferias, Festivales y Rutas del Café
            </h1>

            <p className="mt-4 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Explora el calendario de ferias culinarias, catas de café de especialidad de altura, festivales de platos típicos lojanos y encuentros de productores en la provincia de Loja.
            </p>

            {/* Mención contextual responsable Flywheel hacia quecomerenloja.com */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span>💡</span>
              <span>
                ¿Buscas restaurantes, huecas o cafeterías abiertas hoy? Visita el directorio permanente en{" "}
                <a
                  href="https://quecomerenloja.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-orange-600 hover:underline"
                >
                  quecomerenloja.com
                </a>
              </span>
            </div>
          </div>
        </section>

        {/* ── Contenido con Chips y Eventos ── */}
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
          <EventosGastronomicosClient eventos={eventos} />
        </section>
      </main>
    </div>
  );
}
