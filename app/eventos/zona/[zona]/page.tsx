import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ZONAS } from "@/lib/constants";
import { SITE_CONFIG } from "@/lib/utils";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";

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
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-5xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">Inicio</Link>
          <span>›</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-medium">{zonaInfo.nombre}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {tipoLabel}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Eventos en {zonaInfo.nombre}
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
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
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
