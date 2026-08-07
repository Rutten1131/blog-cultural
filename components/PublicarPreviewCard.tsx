import Link from "next/link";
import Image from "next/image";

interface PublicarPreviewCardProps {
  nombre: string;
  fecha: string;
  lugar: string;
  descripcion: string;
  imagenUrl: string;
  nombreGestor: string;
}

function formatFecha(fechaStr: string) {
  if (!fechaStr) return "Fecha del evento";
  const date = new Date(fechaStr + "T00:00:00");
  if (isNaN(date.getTime())) return "Fecha del evento";

  return date.toLocaleDateString("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function PublicarPreviewCard({
  nombre,
  fecha,
  lugar,
  descripcion,
  imagenUrl,
  nombreGestor,
}: PublicarPreviewCardProps) {
  const fechaFormateada = formatFecha(fecha);
  const descripcionCorta =
    descripcion.length > 140
      ? `${descripcion.slice(0, 137)}...`
      : descripcion || "Aquí aparecerá la descripción de tu evento cultural...";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-purple-1)] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-purple-1)]" />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Vista Previa en Tiempo Real
        </h3>
      </div>

      <div className="card-surface relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-md">
        {/* Imagen */}
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-purple-100 to-violet-200">
          {imagenUrl ? (
            <Image
              src={imagenUrl}
              alt={nombre || "Vista previa del evento"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--color-muted)]">
              <span className="text-5xl opacity-30">🖼️</span>
              <span className="text-xs font-semibold">Subí una imagen o afiche</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            📅 {fechaFormateada}
          </span>
        </div>

        {/* Contenido */}
        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold uppercase text-purple-700">
              Categoría (Auto IA)
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted)]">
              📍 {lugar || "Lugar del evento"}
            </span>
          </div>

          <h4 className="font-display text-xl font-black uppercase leading-tight tracking-tight text-[var(--color-dark)]">
            {nombre || "Título de tu evento cultural"}
          </h4>

          <p className="text-sm leading-relaxed text-[var(--color-muted)]">
            {descripcionCorta}
          </p>

          {nombreGestor && (
            <div className="mt-2 border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-muted)]">
              Organizado por: <span className="font-bold text-[var(--color-dark)]">{nombreGestor}</span>
            </div>
          )}
        </div>
      </div>
      <p className="text-center text-[11px] text-[var(--color-muted)]">
        * Al publicar, la IA clasificará automáticamente la categoría exacta y la parroquia de Loja.
      </p>
    </div>
  );
}
