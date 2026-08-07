import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ZONAS } from "@/lib/constants";
import { SITE_CONFIG } from "@/lib/utils";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { Navbar } from "@/components/Navbar";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ zona: string }>;
}

// Normalizar nombre de zona para URL: quitar tildes, minúsculas, guiones
function zonaToSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function generateStaticParams() {
  return ZONAS.map((zona) => ({ zona: zonaToSlug(zona.nombre) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { zona: zonaSlug } = await params;
  const zonaInfo = ZONAS.find((z) => zonaToSlug(z.nombre) === zonaSlug);

  if (!zonaInfo) return { title: "Zona no encontrada" };

  return {
    title: `Eventos en ${zonaInfo.nombre}`,
    description: `Eventos culturales en ${zonaInfo.nombre}, Loja, Ecuador. ${SITE_CONFIG.nombre}.`,
    alternates: {
      canonical: `${SITE_CONFIG.url}/eventos/zona/${zonaSlug}`,
    },
    openGraph: {
      title: `Eventos en ${zonaInfo.nombre}, Loja`,
      description: `Eventos culturales en la parroquia ${zonaInfo.nombre}`,
      siteName: SITE_CONFIG.nombre,
      locale: SITE_CONFIG.locale,
    },
  };
}

export default async function ZonaPage({ params }: PageProps) {
  const { zona: zonaSlug } = await params;

  const zonaInfo = ZONAS.find((z) => zonaToSlug(z.nombre) === zonaSlug);
  if (!zonaInfo) notFound();

  // Buscar zona en la BD por nombre exacto
  const zonaDb = await prisma.zona.findUnique({
    where: { nombre: zonaInfo.nombre },
  });

  const eventos = zonaDb
    ? await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          zonaId: zonaDb.id,
        },
        include: { categoria: true, zona: true },
        orderBy: { fecha: "asc" },
      })
    : [];

  const tipoLabel = zonaInfo.tipo === "URBANA" ? "Parroquia Urbana" : "Parroquia Rural";

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 flex-1">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
          <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">Inicio</Link>
          <span>›</span>
          <span className="text-[var(--color-dark)] font-bold">{zonaInfo.nombre}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
              {tipoLabel}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
            Eventos en {zonaInfo.nombre}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {eventos.length > 0
              ? `${eventos.length} evento${eventos.length !== 1 ? "s" : ""} próximo${eventos.length !== 1 ? "s" : ""}`
              : ""}
          </p>
        </div>

        {/* Grid de eventos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.length > 0 ? (
            eventos.map((evento) => (
              <EventoListCard key={evento.id} evento={evento} />
            ))
          ) : (
            <EstadoVacioEvento
              mensaje={`Todavía no hay eventos en ${zonaInfo.nombre}`}
            />
          )}
        </div>

        {/* Link de vuelta */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-purple-1)] transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
