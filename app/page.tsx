import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/types";
import { EventoListCard } from "@/components/EventoListCard";

export const revalidate = 60;

// Emojis representativos para cada categoría
const CATEGORIA_EMOJIS: Record<string, string> = {
  "arte-y-exposiciones": "🎨",
  "teatro": "🎭",
  "musica": "🎵",
  "ferias": "🏮",
  "artes-vivas": "✨",
};

export default async function Home() {
  const proximosEventos = await prisma.evento.findMany({
    where: {
      estado: "APROBADO",
      fecha: { gte: new Date() },
    },
    include: { categoria: true, zona: true },
    orderBy: { fecha: "asc" },
    take: 9,
  });

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl mx-auto flex-col gap-16 py-16 px-6">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center pt-8">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Agenda Cultural Loja
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Descubrí los mejores eventos culturales de Loja: arte, teatro,
            música, ferias y artes vivas.
          </p>
          <Link
            href="/publicar"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Publicar un evento
          </Link>
        </div>

        {/* Categorías */}
        <section className="w-full">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Explorar por categoría
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {CATEGORIAS.map((cat) => (
              <Link
                key={cat.slug}
                href={`/eventos/categoria/${cat.slug}`}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-400 hover:shadow-md hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
              >
                <span className="text-2xl">{CATEGORIA_EMOJIS[cat.slug]}</span>
                <span>{cat.nombre}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Próximos eventos */}
        <section className="w-full">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Próximos eventos
          </h2>

          {proximosEventos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {proximosEventos.map((evento) => (
                <EventoListCard key={evento.id} evento={evento} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <div className="text-4xl mb-3 opacity-40">📅</div>
              <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                Todavía no hay eventos próximos publicados
              </p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                ¿Organizás un evento cultural?{" "}
                <Link
                  href="/publicar"
                  className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Publicalo acá
                </Link>
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
