import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Agenda Cultural Loja",
    template: "%s | Agenda Cultural Loja",
  },
  description:
    "Descubre los mejores eventos culturales de Loja: arte, teatro, música, ferias y artes vivas. Publicación abierta para gestores culturales.",
  metadataBase: new URL("https://agendaculturalloja.com"),
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_EC",
    siteName: "Agenda Cultural Loja",
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
