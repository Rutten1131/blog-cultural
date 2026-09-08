import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Agenda Cultural Loja — Qué hacer en Loja | Eventos y Cultura",
    template: "%s | Agenda Cultural Loja",
  },
  description:
    "Descubre qué está pasando en Loja. ¿Qué hacer en Loja? Cartelera oficial con eventos culturales, conciertos, teatro, ferias y actividades artísticas hoy y este fin de semana.",
  metadataBase: new URL("https://www.agendaculturalloja.com"),
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_EC",
    siteName: "Agenda Cultural Loja",
    title: "Agenda Cultural Loja — Qué hacer en Loja",
    description:
      "Descubre qué está pasando en Loja. Cartelera cultural y turística actualizada: música, teatro, arte y actividades de fin de semana.",
  },
  verification: {
    google: "ilvHfsZcm1kuc1swQuoah0i94RLuK2xBvIhprtqOIo8",
  },
};

// JSON-LD global: aparece en TODAS las páginas del sitio
const globalJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.agendaculturalloja.com/#website",
      url: "https://www.agendaculturalloja.com",
      name: "Agenda Cultural Loja",
      description:
        "Cartelera oficial de eventos culturales en Loja, Ecuador: música, teatro, arte, ferias y actividades artísticas.",
      inLanguage: "es-EC",
      publisher: {
        "@id": "https://www.agendaculturalloja.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://www.agendaculturalloja.com/eventos?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://www.agendaculturalloja.com/#organization",
      name: "Agenda Cultural Loja",
      url: "https://www.agendaculturalloja.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.agendaculturalloja.com/icon.png",
      },
      founder: {
        "@type": "Person",
        name: "César Reyes Jaramillo",
        url: "https://www.cesarreyesjaramillo.com/",
        sameAs: ["https://www.cesarreyesjaramillo.com/"],
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Loja",
        addressRegion: "Loja",
        addressCountry: "EC",
      },
      areaServed: {
        "@type": "City",
        name: "Loja",
        sameAs: "https://www.wikidata.org/wiki/Q691029",
      },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Noise overlay cinematográfico */}
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
