import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/utils";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { Navbar } from "@/components/Navbar";
import { CalendarioCulturalHome } from "@/components/CalendarioCulturalHome";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Todos los Eventos Culturales en Loja — Cartelera y Calendario",
  description:
    "Explorá el catálogo completo y calendario interactivo de eventos culturales en Loja, Ecuador: música, teatro, arte, ferias y artes vivas.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/eventos`,
  },
};

export default async function EventosPage() {
  const eventos = await prisma.evento.findMany({
    where: { estado: "APROBADO" },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
  });

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 flex-1">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-2">
          <Link href="/" className="hover:text-[var(--color-purple-1)] transition-colors">Inicio</Link>
          <span>›</span>
          <span className="text-[var(--color-dark)] font-bold">Todos los eventos</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-[var(--color-dark)]">
            Cartelera y Calendario Cultural
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {eventos.length > 0
              ? `Explora los ${eventos.length} eventos registrados o toca un día en el calendario para ver qué hacer en Loja.`
              : "No hay eventos próximos en este momento."}
          </p>
        </div>

        {/* Calendario Interactivo */}
        <div className="mb-12">
          <CalendarioCulturalHome eventos={eventos} />
        </div>

        {/* Separador de vista corrida */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--color-dark)]">
            Todos los eventos en lista
          </h2>
        </div>

        {/* Grid de Eventos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.length > 0 ? (
            eventos.map((evento) => (
              <EventoListCard key={evento.id} evento={evento} />
            ))
          ) : (
            <EstadoVacioEvento mensaje="No hay eventos próximos en este momento." />
          )}
        </div>
      </main>
    </div>
  );
}
