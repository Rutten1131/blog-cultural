import Link from "next/link";
import Image from "next/image";

interface EventoCardProps {
  id: number;
  nombre: string;
  slug: string;
  fecha: Date;
  lugar: string;
  descripcion: string;
  imagenUrl: string | null;
  categoria: { nombre: string; slug: string } | null;
  zona: { nombre: string } | null;
}

export function EventoListCard({ evento }: { evento: EventoCardProps }) {
  const fechaFormateada = new Date(evento.fecha).toLocaleDateString("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const descripcionCorta =
    evento.descripcion.length > 120
      ? `${evento.descripcion.slice(0, 117)}...`
      : evento.descripcion;

  return (
    <Link
      href={`/eventos/${evento.slug}`}
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:border-zinc-400 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      {/* Imagen */}
      {evento.imagenUrl ? (
        <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <Image
            src={evento.imagenUrl}
            alt={evento.nombre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </div>
      ) : (
        <div className="h-44 w-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
          <span className="text-4xl opacity-30">🎭</span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {evento.categoria && (
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {evento.categoria.nombre}
            </span>
          )}
          {evento.zona && (
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {evento.zona.nombre}
            </span>
          )}
        </div>

        {/* Título */}
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-snug group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
          {evento.nombre}
        </h3>

        {/* Descripción corta */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
          {descripcionCorta}
        </p>

        {/* Fecha y Lugar */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 text-xs text-zinc-400 dark:text-zinc-500">
          <span>📅 <span className="capitalize">{fechaFormateada}</span></span>
          <span>📍 {evento.lugar}</span>
        </div>
      </div>
    </Link>
  );
}

export function EstadoVacioEvento({ mensaje }: { mensaje: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <div className="text-4xl mb-4 opacity-40">📭</div>
      <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">
        {mensaje}
      </p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
        ¿Tenés un evento para publicar?{" "}
        <Link
          href="/publicar"
          className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Publicalo acá
        </Link>
      </p>
    </div>
  );
}
