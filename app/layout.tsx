import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Agenda Cultural Loja — Qué hacer en Loja | Eventos y Cultura",
    template: "%s | Agenda Cultural Loja",
  },
  description:
    "Descubre qué está pasando en Loja. ¿Qué hacer en Loja? Cartelera oficial con eventos culturales, conciertos, teatro, ferias y actividades artísticas hoy y este fin de semana.",
  metadataBase: new URL("https://agendacultural-loja.com"),
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Noise overlay cinematográfico */}
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
