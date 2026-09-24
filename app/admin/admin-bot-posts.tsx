"use client";

/**
 * Candidatos capturados del grupo de WhatsApp.
 *
 * Se muestran DENTRO de la pestaña "Moderar Pendientes", junto a los
 * eventos enviados por la comunidad: un solo flujo, una sola cola.
 *
 * La única diferencia es la marca 🤖 BOT, para que sepas de dónde vino.
 *
 * Estos candidatos viven en la tabla `posts_social`, que admite datos
 * incompletos (la tabla `eventos` exige fecha y lugar). Aprobar uno crea
 * el evento en la misma cola, así que todo termina en el mismo lugar.
 */

import { useState, useTransition } from "react";
import { aprobarPostBot, rechazarPostBot } from "@/lib/actions/moderarPostBot";
// OJO: NO importar de "@/lib/fechas" — ese módulo usa `import "server-only"`
// y hace que `next build` falle sin mostrar ningún error.
import { formatFechaLojaCliente } from "@/lib/fechasCliente";

export interface PostBotItem {
  id: number;
  origen: string;
  urlOriginal: string | null;
  textoOriginal: string | null;
  titulo: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  fechaPublicacion: Date | null;
  lugar: string | null;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  grupoId: string | null;
  confianzaIA: number | null;
  fechaDeteccion: Date;
  /** Fotos del carrusel (además de `imagenUrl`, que es la portada). */
  multimedia?: unknown;
}

/**
 * Fotos del carrusel guardadas en el post.
 *
 * El campo llega como JSON desde la base de datos, así que se comprueba
 * que sea un arreglo antes de usarlo. La primera es la portada.
 */
function fotosDelPost(post: PostBotItem): string[] {
  if (!Array.isArray(post.multimedia)) return [];
  return post.multimedia.filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0
  );
}

/** Nombres legibles de los grupos configurados en el worker. */
const NOMBRES_GRUPO: Record<string, string> = {
  "593987579927-1629844024@g.us": "Agenda Cultural Participativa 2026",
  "120363411482334109@g.us": "Agenda Cultural (1)",
  "120363429834864128@g.us": "Agenda Cultural (2)",
};

function fuenteDe(url: string | null): string {
  if (!url) return "Sin enlace";
  if (/facebook|fb\./i.test(url)) return "Facebook";
  if (/instagram/i.test(url)) return "Instagram";
  if (/youtube|youtu\.be/i.test(url)) return "YouTube";
  if (/tiktok/i.test(url)) return "TikTok";
  if (/drive\.google/i.test(url)) return "Google Drive";
  if (/forms\.gle|docs\.google/i.test(url)) return "Formulario";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Enlace";
  }
}

function camposFaltantes(post: PostBotItem): string[] {
  const faltan: string[] = [];
  if (!post.titulo) faltan.push("título");
  if (!post.fechaPublicacion) faltan.push("fecha");
  if (!post.lugar) faltan.push("lugar");
  return faltan;
}

function BarraConfianza({ valor }: { valor: number | null }) {
  const v = valor ?? 0;
  const porcentaje = Math.round(v * 100);
  const color = v >= 0.6 ? "bg-emerald-500" : v >= 0.35 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="flex items-center gap-2" title={`Confianza de la extracción: ${porcentaje}%`}>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className={`h-full ${color}`} style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        {porcentaje}%
      </span>
    </div>
  );
}

export function BotPendientes({ posts }: { posts: PostBotItem[] }) {
  const pendientes = posts.filter((p) => p.estado === "PENDIENTE");
  const [mensajes, setMensajes] = useState<Record<number, { ok: boolean; texto: string }>>({});
  const [enProceso, setEnProceso] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  if (pendientes.length === 0) return null;

  // Lo más confiable primero, para revisar rápido lo que ya viene completo.
  const ordenados = [...pendientes].sort(
    (a, b) => (b.confianzaIA ?? 0) - (a.confianzaIA ?? 0)
  );

  function aprobar(post: PostBotItem) {
    setEnProceso(post.id);
    startTransition(async () => {
      const res = await aprobarPostBot(post.id, "admin");
      setMensajes((m) => ({
        ...m,
        [post.id]: {
          ok: res.success,
          texto: res.success
            ? `✅ Evento #${res.eventoId} creado en esta misma cola.`
            : res.error || "Error desconocido",
        },
      }));
      setEnProceso(null);
    });
  }

  function rechazar(post: PostBotItem) {
    setEnProceso(post.id);
    startTransition(async () => {
      const res = await rechazarPostBot(post.id, "admin", "Descartado desde el panel");
      setMensajes((m) => ({
        ...m,
        [post.id]: {
          ok: res.success,
          texto: res.success ? "🗑️ Descartado." : res.error || "Error desconocido",
        },
      }));
      setEnProceso(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Separador: deja claro que lo de abajo viene del grupo */}
      <div className="flex items-center gap-3 pt-2">
        <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-black text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          🤖 CAPTURADOS DEL GRUPO DE WHATSAPP · {pendientes.length}
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {ordenados.map((post) => {
        const faltan = camposFaltantes(post);
        const puedeAprobar = faltan.length === 0;
        const msg = mensajes[post.id];
        const fotos = fotosDelPost(post);

        return (
          <div
            key={post.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Cabecera */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-black tracking-wide text-white">
                  🤖 BOT
                </span>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {fuenteDe(post.urlOriginal)}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {NOMBRES_GRUPO[post.grupoId ?? ""] ?? "Grupo de WhatsApp"}
                </span>
              </div>
              <BarraConfianza valor={post.confianzaIA} />
            </div>

            <div className="flex flex-col gap-4 p-4 sm:flex-row">
              {/* Imagen */}
              {post.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imagenUrl}
                  alt=""
                  className="h-24 w-24 flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-2xl dark:bg-zinc-800">
                  🖼️
                </div>
              )}

              {/* Datos */}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-bold text-zinc-900 dark:text-zinc-50">
                  {post.titulo || <span className="text-rose-500">(sin título)</span>}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>
                    📅{" "}
                    {post.fechaPublicacion ? (
                      formatFechaLojaCliente(post.fechaPublicacion, "largo")
                    ) : (
                      <span className="font-semibold text-rose-500">sin fecha</span>
                    )}
                  </span>
                  <span>
                    📍{" "}
                    {post.lugar || (
                      <span className="font-semibold text-rose-500">sin lugar</span>
                    )}
                  </span>
                </div>

                <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {post.descripcion || post.textoOriginal || "(sin descripción)"}
                </p>

                {/* Carrusel: si el post traía varias fotos se ven todas, y al
                    aprobar pasan al evento en lugar de perderse. */}
                {fotos.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fotos.map((foto, i) => (
                      <a
                        key={foto}
                        href={foto}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Foto ${i + 1} de ${fotos.length}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={foto}
                          alt=""
                          className="h-12 w-12 rounded-lg border border-zinc-200 object-cover transition hover:scale-105 dark:border-zinc-700"
                        />
                      </a>
                    ))}
                    <span className="self-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      {fotos.length} fotos
                    </span>
                  </div>
                )}

                {post.urlOriginal && (
                  <a
                    href={post.urlOriginal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block truncate text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Ver publicación original ↗
                  </a>
                )}

                {faltan.length > 0 && (
                  <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    ⚠️ El bot no encontró <strong>{faltan.join(", ")}</strong> en el mensaje.
                    Completalo desde{" "}
                    <a href="/publicar" className="font-bold underline">
                      Publicar evento
                    </a>{" "}
                    para no inventar datos.
                  </p>
                )}

                {msg && (
                  <p
                    className={`rounded-lg px-2.5 py-1.5 text-xs ${
                      msg.ok
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                    }`}
                  >
                    {msg.texto}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex flex-shrink-0 flex-row gap-2 sm:flex-col">
                <button
                  onClick={() => aprobar(post)}
                  disabled={!puedeAprobar || enProceso === post.id}
                  title={
                    puedeAprobar
                      ? "Crear el evento en esta cola"
                      : "Faltan datos: completalo desde Publicar evento"
                  }
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
                >
                  ✅ Aprobar
                </button>
                <button
                  onClick={() => rechazar(post)}
                  disabled={enProceso === post.id}
                  className="rounded-xl bg-zinc-200 px-3 py-1.5 text-sm font-bold text-zinc-700 transition hover:bg-rose-600 hover:text-white disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  🗑️ Rechazar
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
