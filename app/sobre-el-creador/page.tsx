import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { SITE_CONFIG } from "@/lib/utils";

export const revalidate = 3600; // 1 hora

export const metadata: Metadata = {
  title: "César Reyes Jaramillo — Creador de Agenda Cultural Loja",
  description:
    "Conoce a César Reyes Jaramillo, especialista en posicionamiento SEO, automatización y desarrollo web en Loja. Fundador y arquitecto tecnológico de Agenda Cultural Loja.",
  keywords: [
    "César Reyes Jaramillo",
    "Cesar Reyes",
    "Creador Agenda Cultural Loja",
    "Consultor SEO Loja",
    "Posicionamiento web Loja",
    "Automatización digital Loja",
    "Desarrollo web Loja",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/sobre-el-creador`,
  },
  openGraph: {
    title: "César Reyes Jaramillo — Creador de Agenda Cultural Loja",
    description:
      "La historia, propósito y arquitectura tecnológica detrás de Agenda Cultural Loja. Conoce a su fundador César Reyes Jaramillo.",
    url: `${SITE_CONFIG.url}/sobre-el-creador`,
    siteName: SITE_CONFIG.nombre,
    locale: "es_EC",
    type: "profile",
  },
};

export default function SobreElCreadorPage() {
  // Schema.org estructurado para entidades Google y LLMs (Person + WebSite + Initiative)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "https://www.cesarreyesjaramillo.com/#person",
        name: "César Reyes Jaramillo",
        alternateName: ["Cesar Reyes", "Cesar Reyes Jaramillo"],
        url: "https://www.cesarreyesjaramillo.com/",
        image: "https://www.cesarreyesjaramillo.com/images/portada_cesarbn.webp",
        jobTitle: "Consultor SEO y Especialista en Automatización Digital",
        description:
          "Especialista en posicionamiento en buscadores (SEO local), optimización para buscadores de IA y sistemas de automatización digital para empresas y proyectos ciudadanos en Loja, Ecuador.",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Loja",
          addressRegion: "Loja",
          addressCountry: "EC",
        },
        sameAs: [
          "https://www.cesarreyesjaramillo.com/",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_CONFIG.url}/#website`,
        url: SITE_CONFIG.url,
        name: SITE_CONFIG.nombre,
        description:
          "Plataforma centralizada de eventos, arte y cultura para la ciudad de Loja, Ecuador.",
        creator: {
          "@id": "https://www.cesarreyesjaramillo.com/#person",
        },
        inLanguage: "es-EC",
      },
    ],
  };

  return (
    <>
      {/* Marcado JSON-LD Schema.org de Entidad */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex min-h-screen flex-col font-sans text-zinc-900 dark:text-zinc-100" style={{ background: "var(--color-bg)" }}>
        <Navbar />

        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 flex-1">
          {/* Migas de pan */}
          <div className="mb-6 flex items-center justify-between">
            <nav className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <Link href="/" className="hover:text-purple-600 transition-colors">Inicio</Link>
              <span>›</span>
              <span className="text-zinc-800 dark:text-zinc-200">Sobre el Creador</span>
            </nav>
          </div>

          <article className="space-y-8">
            {/* Header Hero */}
            <div className="rounded-3xl border border-white/60 bg-white/90 p-6 sm:p-10 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                {/* Fotografía del Creador */}
                <div className="relative shrink-0">
                  <div className="relative h-32 w-32 sm:h-36 sm:w-36 overflow-hidden rounded-3xl border-2 border-purple-200/80 dark:border-purple-800/80 bg-zinc-900 shadow-2xl ring-4 ring-purple-500/20">
                    <Image
                      src="https://www.cesarreyesjaramillo.com/images/portada_cesarbn.webp"
                      alt="César Reyes Jaramillo — Creador de Agenda Cultural Loja"
                      fill
                      className="object-cover object-top filter contrast-[1.03]"
                      unoptimized
                      priority
                    />
                  </div>
                  <div
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg text-sm font-bold ring-4 ring-white dark:ring-zinc-900"
                    title="Perfil Verificado"
                  >
                    ✓
                  </div>
                </div>

                {/* Resumen del perfil */}
                <div className="text-center sm:text-left flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-950/60 px-3.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 mb-3">
                    <span>Fundador & Desarrollador</span>
                  </div>
                  <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white">
                    César Reyes Jaramillo
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-[var(--color-muted)] font-medium leading-relaxed">
                    Especialista en posicionamiento SEO, automatización de procesos y desarrollo web estratégico en Loja, Ecuador.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <a
                      href="https://www.cesarreyesjaramillo.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sheen-hover inline-flex items-center gap-2 rounded-xl bg-[var(--color-purple-1)] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--color-purple-2)] hover:shadow-lg active:scale-95"
                    >
                      <span>Sitio Oficial: cesarreyesjaramillo.com</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque: ¿Por qué nació Agenda Cultural Loja? */}
            <div className="rounded-3xl border border-white/60 bg-white/90 p-6 sm:p-10 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-purple-600 text-sm">
                  🎭
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white">
                  ¿Por qué nació Agenda Cultural Loja?
                </h2>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                Loja es reconocida históricamente como la <strong className="text-purple-700 dark:text-purple-400">Capital Musical y Cultural del Ecuador</strong>. Sin embargo, existía un problema común: la cartelera de eventos estaba dispersa en carteles en la calle, publicaciones aisladas de Facebook, PDFs institucionales y chats de WhatsApp.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                Como ciudadano y profesional de la tecnología, <strong>César Reyes Jaramillo</strong> concibió este proyecto como una <strong>iniciativa cívica y digital independiente</strong> para centralizar, organizar y dar visibilidad abierta a los artistas, colectivos, teatros y gestores culturales de Loja de forma totalmente gratuita y accesible para toda la ciudadanía.
              </p>
            </div>

            {/* Bloque: Filosofía Tecnológica y SEO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
                <span className="text-2xl">⚡</span>
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white mt-2">
                  Velocidad & Accesibilidad
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Construido sobre Next.js con arquitectura moderna, carga ultrarrápida en dispositivos móviles, calendario interactivo sin fricciones y navegación adaptada a la velocidad de la ciudad.
                </p>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
                <span className="text-2xl">🌐</span>
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white mt-2">
                  SEO & Búsqueda Semántica
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Optimizado para que cada evento lojano aparezca en Google y en los motores de búsqueda de Inteligencia Artificial (ChatGPT, Copilot, Gemini), maximizando el alcance de los creadores.
                </p>
              </div>
            </div>

            {/* Bloque: Alianzas Institucionales y Colaboración Abierta */}
            <div className="rounded-3xl border border-purple-200/60 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/50 p-6 sm:p-10 shadow-sm dark:border-purple-900/40 dark:from-purple-950/30 dark:via-zinc-900 dark:to-zinc-900 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-600 text-white text-sm">
                  🤝
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--color-dark)] dark:text-white">
                  Alianzas Institucionales y Difusión
                </h2>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                La plataforma colabora activamente con gestores locales, colectivos de arte independiente y entidades públicas como la <strong>Casa de la Cultura Ecuatoriana (Núcleo de Loja)</strong>, el <strong>Municipio de Loja</strong> y la <strong>Prefectura de Loja</strong> para facilitar la divulgación oficial y oportuna de sus cronogramas de actividades.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/publicar"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-purple-1)] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[var(--color-purple-2)] transition-all"
                >
                  + Publicar una actividad en la cartelera
                </Link>
                <Link
                  href="/eventos"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-3 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:border-purple-500 transition-all"
                >
                  Explorar cartelera completa →
                </Link>
              </div>
            </div>

            {/* Footer interno del creador */}
            <div className="text-center pt-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Para consultas tecnológicas, alianzas de difusión o proyectos de automatización en Loja, puedes visitar{" "}
                <a
                  href="https://www.cesarreyesjaramillo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  cesarreyesjaramillo.com
                </a>.
              </p>
            </div>
          </article>
        </main>
      </div>
    </>
  );
}
