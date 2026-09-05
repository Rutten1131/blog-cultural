import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ZONAS } from "@/lib/constants";
import { SITE_CONFIG } from "@/lib/utils";
import { inicioDelDiaLojaUTC } from "@/lib/fechas";
import { EventoListCard, EstadoVacioEvento } from "@/components/EventoListCard";
import { EventosPasadosList } from "@/components/EventosPasadosList";
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

  const hoyLoja = inicioDelDiaLojaUTC();

  // 1. Eventos vigentes (hoy y días siguientes), ordenados cronológicamente
  const eventosProximos = zonaDb
    ? await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          zonaId: zonaDb.id,
          OR: [
            { fechaFin: { gte: hoyLoja } },
            { fecha: { gte: hoyLoja } },
          ],
        },
        include: { categoria: true, zona: true },
        orderBy: { fecha: "asc" },
      })
    : [];

  // 2. Eventos anteriores en esta zona
  const eventosPasados = zonaDb
    ? await prisma.evento.findMany({
        where: {
          estado: "APROBADO",
          zonaId: zonaDb.id,
          AND: [
            { fecha: { lt: hoyLoja } },
            { OR: [{ fechaFin: null }, { fechaFin: { lt: hoyLoja } }] },
          ],
        },
        include: { categoria: true, zona: true },
        orderBy: { fecha: "desc" },
        take: 30,
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
            {eventosProximos.length} evento{eventosProximos.length !== 1 ? "s" : ""} próximo{eventosProximos.length !== 1 ? "s" : ""} en agenda
          </p>
        </div>

        {/* ── SECCIÓN 1: EVENTOS VIGENTES (HOY Y PRÓXIMOS DÍAS) ── */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--color-dark)]">
              Próximos Eventos (Hoy y siguientes días)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosProximos.length > 0 ? (
              eventosProximos.map((evento) => (
                <EventoListCard key={evento.id} evento={evento} />
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-3">
                <EstadoVacioEvento
                  mensaje={`No hay eventos próximos agendados en ${zonaInfo.nombre}.`}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── SECCIÓN 2: EVENTOS ANTERIORES / HISTORIAL DE LA ZONA CON LÍMITE Y VER MÁS ── */}
        <EventosPasadosList
          eventos={eventosPasados}
          titulo={`Eventos Realizados Anteriormente en ${zonaInfo.nombre}`}
          subtitulo={`Actividades, fiestas y encuentros culturales que tuvieron lugar en esta parroquia.`}
          initialCount={6}
          step={6}
        />

        {/* Link de vuelta */}
        <div className="mt-14 pt-8 border-t border-[var(--color-border)] text-center">
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
