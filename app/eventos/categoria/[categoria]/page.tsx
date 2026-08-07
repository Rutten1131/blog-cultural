import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/types";
import { SITE_CONFIG } from "@/lib/utils";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { Navbar } from "@/components/Navbar";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ categoria: string }>;
}

export async function generateStaticParams() {
  return CATEGORIAS.map((cat) => ({ categoria: cat.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria: categoriaSlug } = await params;
  const cat = CATEGORIAS.find((c) => c.slug === categoriaSlug);

  if (!cat) return { title: "Categoría no encontrada" };

  return {
    title: `${cat.nombre} en Loja`,
    description: `Eventos de ${cat.nombre} en Loja, Ecuador. Descubrí la agenda cultural de Loja en ${SITE_CONFIG.nombre}.`,
    alternates: {
      canonical: `${SITE_CONFIG.url}/eventos/categoria/${cat.slug}`,
    },
    openGraph: {
      title: `${cat.nombre} en Loja`,
      description: `Eventos de ${cat.nombre} en Loja`,
      siteName: SITE_CONFIG.nombre,
      locale: SITE_CONFIG.locale,
    },
  };
}

export default async function CategoriaPage({ params }: PageProps) {
  const { categoria: categoriaSlug } = await params;

  const cat = CATEGORIAS.find((c) => c.slug === categoriaSlug);
  if (!cat) notFound();

  // Buscar la categoría en la BD por slug
  const categoriaDb = await prisma.categoria.findUnique({
    where: { slug: categoriaSlug },
  });

  const eventos = categoriaDb
    ? await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          categoriaId: categoriaDb.id,
        },
        include: { categoria: true, zona: true },
        orderBy: { fecha: "asc" },
      })
    : [];

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 flex-1">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
          <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">Inicio</Link>
          <span>›</span>
          <span className="text-[var(--color-dark)] font-bold">{cat.nombre}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
            {cat.nombre} en Loja
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
              mensaje={`No hay eventos próximos en la categoría "${cat.nombre}".`}
            />
          )}
        </div>

        {/* Link de vuelta */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-purple-1)] transition-colors"
          >
            ← Ver todas las categorías
          </Link>
        </div>
      </main>
    </div>
  );
}
