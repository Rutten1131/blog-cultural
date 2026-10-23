import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { DirectorioClient } from "@/components/DirectorioClient";
import { ORGANIZACIONES_CULTURALES } from "@/lib/organizacionesData";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Directorio Cultural de Loja — Academias de Danza, Teatros y Escuelas de Arte",
  description:
    "Directorio oficial de entidades y espacios culturales de Loja, Ecuador: academias de ballet, escuelas de danza urbana, productoras de teatro, conservatorios y compañías artísticas verificadas.",
  keywords: [
    "Directorio cultural Loja",
    "Academias de danza en Loja",
    "Escuelas de ballet Loja",
    "Clases de danza Loja",
    "Productoras de teatro Loja",
    "Conservatorio de música Loja",
    "Espacios culturales Loja",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/directorio`,
  },
  openGraph: {
    title: "Directorio Cultural de Loja — Espacios, Academias y Elencos",
    description:
      "Conoce las academias de danza, compañías teatrales, elencos y espacios culturales de Loja con contactos directos y oferta formativa verificada.",
    url: `${SITE_CONFIG.url}/directorio`,
    siteName: SITE_CONFIG.nombre,
    locale: SITE_CONFIG.locale,
    type: "website",
  },
};

export default function DirectorioHubPage() {
  const organizaciones = Object.values(ORGANIZACIONES_CULTURALES);

  // Schema ItemList
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
            name: "Directorio Cultural",
            item: `${SITE_CONFIG.url}/directorio`,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Directorio de Entidades y Espacios Culturales de Loja",
        description: "Catálogo verificado de academias de danza, productoras escénicas y formación artística en Loja.",
        numberOfItems: organizaciones.length,
        itemListElement: organizaciones.map((org, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: org.nombre,
          url: `${SITE_CONFIG.url}/directorio/${org.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 pb-16 pt-24 sm:pt-28">
        {/* ── Hero del Directorio ── */}
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-purple-500/10 via-pink-500/5 to-transparent px-4 py-12 text-center sm:px-6 sm:py-16 dark:border-zinc-800">
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
              <span>🏛️</span> Directorio Cultural Verificado
            </span>

            <h1 className="mt-4 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
              Espacios, Academias y Entidades Culturales de Loja
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
              Encuentra escuelas de danza, formación actoral, productoras escénicas, música y espacios artísticos activos en la Capital Cultural del Ecuador con contactos directos y trayectorias verificadas.
            </p>
          </div>
        </section>

        {/* ── Contenedor Interactivo con Filtros y Tarjetas ── */}
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
          <DirectorioClient organizaciones={organizaciones} />
        </section>
      </main>
    </div>
  );
}
