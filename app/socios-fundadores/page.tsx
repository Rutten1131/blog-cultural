import { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { CategoryTabs } from "@/components/socios-fundadores/CategoryTabs";
import sociosData from "@/data/socios-fundadores.json";

export const revalidate = 3600; // 1 hora de revalidación

export const metadata: Metadata = {
  title: "Socios Fundadores GuIAloja | Hoteles y Restaurantes en Loja Ecuador — Agenda Cultural Loja",
  description:
    "Conoce a las empresas que forman parte de la infraestructura de inteligencia turística de Loja. Hoteles, restaurantes, operadores turísticos y más, integrados al ecosistema GuIAloja en agendaculturalloja.com.",
  keywords: [
    "socios fundadores GuIAloja",
    "hoteles en loja ecuador",
    "restaurantes en loja recomendados",
    "turismo loja ecuador",
    "que hacer en loja",
    "agenda cultural loja empresas",
    "infraestructura turística loja",
    "directorio turístico loja",
  ],
  alternates: {
    canonical: "https://www.agendaculturalloja.com/socios-fundadores",
  },
  openGraph: {
    title: "Socios Fundadores GuIAloja — Agenda Cultural Loja",
    description:
      "Las empresas que construyeron el primer canal de inteligencia turística y cultural de Loja, Ecuador.",
    url: "https://www.agendaculturalloja.com/socios-fundadores",
    siteName: "Agenda Cultural Loja",
    locale: "es_EC",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function SociosFundadoresPage({
  searchParams,
}: {
  searchParams?: Promise<{ categoria?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentCategory = resolvedSearchParams?.categoria;

  // Generación de Schema.org según especificación (CollectionPage + LocalBusiness de socios)
  const businesses = sociosData.categorias.flatMap((cat) =>
    cat.socios.map((socio: any) => ({
      "@type": "LocalBusiness",
      name: socio.nombre,
      description: socio.descripcion,
      url: socio.web,
      image: socio.logo?.startsWith("http")
        ? socio.logo
        : `https://www.agendaculturalloja.com${socio.logo}`,
      ...(socio.ubicacion?.direccion
        ? {
            address: {
              "@type": "PostalAddress",
              streetAddress: socio.ubicacion.direccion,
              addressLocality: "Loja",
              addressRegion: "Loja",
              addressCountry: "EC",
            },
          }
        : {}),
      memberOf: {
        "@type": "Organization",
        name: "GuIAloja — Infraestructura de Inteligencia Turística de Loja",
        url: "https://www.agendaculturalloja.com",
      },
    }))
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://www.agendaculturalloja.com/socios-fundadores",
        name: "Socios Fundadores GuIAloja",
        description:
          "Directorio de empresas turísticas, hoteleras y gastronómicas integradas a la infraestructura de inteligencia turística de Loja.",
        url: "https://www.agendaculturalloja.com/socios-fundadores",
        inLanguage: "es-EC",
        about: {
          "@type": "City",
          name: "Loja",
          sameAs: "https://www.wikidata.org/wiki/Q691029",
        },
      },
      ...businesses,
    ],
  };

  const whatsappPhone = sociosData.contacto.whatsapp.replace(/[^0-9]/g, "");
  const generalWaUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    sociosData.contacto.mensaje_whatsapp_base
  )}`;

  return (
    <>
      {/* Schema.org estructurado AEO / SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        className="flex min-h-screen flex-col font-sans text-zinc-900 dark:text-zinc-100"
        style={{ background: "var(--color-bg)" }}
      >
        <Navbar />

        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 flex-1">
          {/* Migas de pan */}
          <div className="mb-6 flex items-center justify-between">
            <nav className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <Link href="/" className="hover:text-purple-600 transition-colors">
                Inicio
              </Link>
              <span>›</span>
              <span className="text-zinc-800 dark:text-zinc-200">Socios Fundadores</span>
            </nav>
          </div>

          <article className="space-y-12">
            {/* ── HERO / ENCABEZADO ── */}
            <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-6 sm:p-10 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 text-center sm:text-left">
              <div className="relative z-10 max-w-3xl">
                {/* Badge sobre H1 */}
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-950/60 px-3.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 mb-4">
                  <span>🏛️ Infraestructura de Inteligencia Turística y Comercial de Loja</span>
                </div>

                {/* H1 */}
                <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white leading-[1.1]">
                  Socios Fundadores <span className="text-purple-600 dark:text-purple-400">GuIAloja</span>
                </h1>

                {/* Párrafo de introducción */}
                <p className="mt-4 text-sm sm:text-base text-zinc-700 dark:text-zinc-300 font-normal leading-relaxed">
                  Estas son las empresas que decidieron ser parte del cambio antes de que el cambio fuera obligatorio. Los Socios Fundadores de GuIAloja integran su información al Asesor IA de Agenda Cultural Loja, el nuevo canal desde el cual los visitantes y turistas buscan dónde hospedarse, dónde comer y qué hacer en Loja.
                </p>

                {/* Nota de exclusividad */}
                <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-900/40 px-4 py-2.5 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
                  <span className="text-base">🔒</span>
                  <span>
                    <strong>Exclusividad estricta:</strong> Solo 3 cupos por categoría. Una vez completos, la condición de Socio Fundador no vuelve a estar disponible.
                  </span>
                </div>
              </div>

              {/* Decoración sutil de fondo */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-purple-200/40 to-pink-200/20 blur-3xl dark:from-purple-900/20 dark:to-pink-900/10" />
            </div>

            {/* ── TABS Y GRILLA DINÁMICA ── */}
            <section aria-label="Listado de socios y cupos por categoría">
              <CategoryTabs
                categorias={sociosData.categorias}
                contacto={sociosData.contacto}
                initialCategoriaId={currentCategory}
              />
            </section>

            {/* ── SECCIÓN CTA INFERIOR ── */}
            <section className="rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-900 via-purple-950 to-zinc-950 p-8 sm:p-12 text-white shadow-xl">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-purple-200 backdrop-blur-md">
                  💼 Oportunidad de Posicionamiento Preferente
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  ¿Tu empresa todavía no es parte de esto?
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed font-normal">
                  La condición de Socio Fundador es limitada y no se repone. Cuando los tres cupos de tu categoría estén ocupados, la única forma de entrar será en condiciones estándar, sin la posición de fundador ni el reconocimiento permanente dentro del ecosistema GuIAloja.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={generalWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sheen-hover w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-xl active:scale-95"
                  >
                    <span>💬 Escríbenos por WhatsApp</span>
                  </a>
                  <a
                    href={`mailto:${sociosData.contacto.email}?subject=${encodeURIComponent(
                      "Interés en ser Socio Fundador de GuIAloja"
                    )}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
                  >
                    <span>✉️ {sociosData.contacto.email}</span>
                  </a>
                </div>
              </div>
            </section>

            {/* ── FOOTER NOTE ── */}
            <div className="text-center pt-2 pb-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                La condición de Socio Fundador es exclusiva — máximo 3 establecimientos por categoría en Loja, Ecuador.  
                Para consultas institucionales:{" "}
                <Link
                  href="/sobre-el-proyecto"
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Conoce más sobre el proyecto
                </Link>
                .
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  );
}
