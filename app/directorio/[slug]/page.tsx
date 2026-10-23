import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { EventoListCard } from "@/components/EventoListCard";
import { ORGANIZACIONES_CULTURALES } from "@/lib/organizacionesData";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(ORGANIZACIONES_CULTURALES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const org = ORGANIZACIONES_CULTURALES[slug];

  if (!org) return { title: "Organización no encontrada" };

  const title = `${org.nombre} — Clases, Cursos y Ubicación en Loja`;
  const description = `${org.descripcionCorta} Conoce su oferta formativa, disciplinas de ${org.disciplinas.join(", ")}, dirección en Loja y contacto directo.`;

  return {
    title,
    description,
    keywords: [
      org.nombre,
      `${org.nombre} Loja`,
      `Clases de ${org.disciplinas[0]} en Loja`,
      "Academias en Loja",
      "Formación cultural Loja",
    ],
    alternates: {
      canonical: `${SITE_CONFIG.url}/directorio/${org.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/directorio/${org.slug}`,
      siteName: SITE_CONFIG.nombre,
      locale: SITE_CONFIG.locale,
      type: "website",
    },
  };
}

export default async function FichaOrganizacionPage({ params }: PageProps) {
  const { slug } = await params;
  const org = ORGANIZACIONES_CULTURALES[slug];

  if (!org) {
    notFound();
  }

  // Buscar si la organización tiene eventos activos o históricos en la BD de Agenda Cultural
  const condiciones = org.terminosBusqueda.map((term) => ({
    OR: [
      { nombre: { contains: term } },
      { descripcion: { contains: term } },
      { lugar: { contains: term } },
      { nombreGestor: { contains: term } },
    ],
  }));

  let eventosRelacionados: any[] = [];
  try {
    eventosRelacionados = await prisma.evento.findMany({
      where: {
        estado: "APROBADO",
        OR: condiciones.flatMap((c) => c.OR),
      },
      include: {
        categoria: true,
        zona: true,
      },
      orderBy: { fecha: "desc" },
      take: 6,
    });
  } catch (err) {
    console.error("Error buscando eventos de la organización:", err);
  }

  // Extraer perfiles oficiales para sameAs (Google Knowledge Graph & LLM Discovery)
  const perfilesSociales = Object.values(org.redes).filter(Boolean);
  if (org.sitioWeb) perfilesSociales.push(org.sitioWeb);

  // Schema EducationalOrganization o PerformingGroup altamente enriquecido
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": org.categoria === "danza" ? "DanceGroup" : org.categoria === "musica" ? "MusicSchool" : "EducationalOrganization",
        "@id": `${SITE_CONFIG.url}/directorio/${org.slug}#organization`,
        name: org.nombre,
        description: org.biografiaTrayectoria,
        url: `${SITE_CONFIG.url}/directorio/${org.slug}`,
        sameAs: perfilesSociales,
        address: {
          "@type": "PostalAddress",
          streetAddress: org.direccion,
          addressLocality: "Loja",
          addressRegion: "Provincia de Loja",
          addressCountry: "EC",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: -3.99313,
          longitude: -79.20422,
        },
        founder: {
          "@type": "Person",
          name: org.representante,
        },
        knowsAbout: org.disciplinas,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `Programas y Clases de ${org.nombre}`,
          itemListElement: org.ofertaFormativa.map((curso, idx) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Course",
              name: curso,
              description: `Programa formativo de ${curso} dictado por ${org.nombre} en Loja, Ecuador.`,
              provider: {
                "@type": "Organization",
                name: org.nombre,
              },
            },
          })),
        },
        ...(org.telefonos.length > 0 && { telephone: org.telefonos[0] }),
        ...(org.anoFundacion && { foundingDate: String(org.anoFundacion) }),
      },
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
          {
            "@type": "ListItem",
            position: 3,
            name: org.nombre,
            item: `${SITE_CONFIG.url}/directorio/${org.slug}`,
          },
        ],
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
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* Breadcrumb visual */}
          <nav className="mb-6 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:underline">Inicio</Link>
            <span>/</span>
            <Link href="/directorio" className="hover:underline">Directorio Cultural</Link>
            <span>/</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{org.nombre}</span>
          </nav>

          {/* Header Principal de la Ficha */}
          <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-purple-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                {org.categoria === "danza" && "🩰 Academia de Danza"}
                {org.categoria === "teatro" && "🎭 Productora / Teatro"}
                {org.categoria === "musica" && "🎻 Educación Musical"}
                {org.categoria === "circo-social" && "🎪 Circo & Teatro Social"}
              </span>

              {org.anoFundacion && (
                <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  Fundado en {org.anoFundacion}
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display text-2xl font-black uppercase tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
              {org.nombre}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-300">
              {org.descripcionCorta}
            </p>

            {/* Disciplinas */}
            <div className="mt-5 flex flex-wrap gap-2">
              {org.disciplinas.map((disc) => (
                <span
                  key={disc}
                  className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  ✓ {disc}
                </span>
              ))}
            </div>

            {/* Acciones de Contacto */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
              {org.whatsappPrincipal && (
                <a
                  href={`https://wa.me/${org.whatsappPrincipal}?text=Hola,%20quisiera%20información%20sobre%20clases%20y%20talleres%20en%20${encodeURIComponent(org.nombre)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105"
                >
                  <span>💬</span> Contactar por WhatsApp
                </a>
              )}

              {org.sitioWeb && (
                <a
                  href={org.sitioWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <span>🌐</span> Sitio Web / Enlaces
                </a>
              )}

              {org.redes.instagram && (
                <a
                  href={org.redes.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 dark:border-pink-900/40 dark:bg-pink-950/40 dark:text-pink-300"
                >
                  <span>📷</span> Instagram
                </a>
              )}

              {org.redes.facebook && (
                <a
                  href={org.redes.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
                >
                  <span>📘</span> Facebook
                </a>
              )}
            </div>
          </header>

          {/* Trayectoria y Oferta Formativa */}
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Columna Izquierda: Biografía */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-zinc-900 sm:text-xl dark:text-white">
                Trayectoria y Perfil Artístico
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {org.biografiaTrayectoria}
              </p>

              <h3 className="mt-6 font-display text-base font-bold uppercase tracking-wide text-zinc-900 dark:text-white">
                Programas y Oferta Formativa:
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {org.ofertaFormativa.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-600">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna Derecha: Ficha de Contacto y Ubicación */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="font-display text-sm font-black uppercase tracking-wider text-zinc-400">
                  Ubicación & Contacto
                </h3>

                <div className="mt-4 space-y-4 text-xs text-zinc-600 dark:text-zinc-300">
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-0.5">📍 Dirección:</span>
                    <p className="leading-relaxed">{org.direccion}</p>
                  </div>

                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-0.5">👤 Dirección / Representante:</span>
                    <p>{org.representante}</p>
                  </div>

                  {org.telefonos.length > 0 && (
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-0.5">📞 Teléfonos / WhatsApp:</span>
                      <p>{org.telefonos.join(" • ")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner de Verificación */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-4 text-xs text-purple-900 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-200">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <span>✓</span> Información Verificada 2026
                </p>
                <p className="leading-relaxed">
                  Ficha corroborada con fuentes públicas, agendas cívicas y registros institucionales de Loja.
                </p>
              </div>
            </div>
          </div>

          {/* Eventos Relacionados en Agenda Cultural */}
          {eventosRelacionados.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                Eventos y Presentaciones de {org.nombre} en Loja
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Funciones, conciertos o festivales vinculados a esta organización en la cartelera de la ciudad:
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {eventosRelacionados.map((ev) => (
                  <EventoListCard
                    key={ev.id}
                    evento={ev}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
