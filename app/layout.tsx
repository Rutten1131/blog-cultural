import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Agenda Cultural Loja",
    template: "%s | Agenda Cultural Loja",
  },
  description:
    "Descubre los mejores eventos culturales de Loja: arte, teatro, música, ferias y artes vivas. Publicación abierta para gestores culturales.",
  metadataBase: new URL("https://agendaculturalloja.com"),
  openGraph: {
    type: "website",
    locale: "es_EC",
    siteName: "Agenda Cultural Loja",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
