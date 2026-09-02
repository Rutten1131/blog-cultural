import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { logoutAdmin } from "@/lib/actions/authAdmin";
import { EventoCard } from "./evento-card";
import { AdminNotificaciones } from "./admin-notificaciones";

export const metadata: Metadata = {
  title: "Panel de Moderación | Admin",
  description: "Moderación de eventos pendientes para la Agenda Cultural de Loja.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const eventosPendientes = await prisma.evento.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { createdAt: "desc" },
  });

  const recomendaciones = await prisma.recomendacion.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const numerosNotificacion = await prisma.numeroNotificacion.findMany({
    orderBy: { createdAt: "asc" },
  });

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
  });

  const zonas = await prisma.zona.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Panel de Moderación
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Agenda Cultural Loja
            </p>
          </div>

          <form action={logoutAdmin}>
            <button
              type="submit"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* Sección 1: Eventos Pendientes */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Eventos Pendientes ({eventosPendientes.length})
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Revisa, corrige la sugerencia de IA si es necesario, y aprueba o rechaza los eventos.
              </p>
            </div>
          </div>

          {eventosPendientes.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                ¡Todo al día!
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                No hay eventos pendientes de revisión en este momento.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {eventosPendientes.map((evento) => (
                <EventoCard
                  key={evento.id}
                  evento={evento}
                  categorias={categorias}
                  zonas={zonas}
                />
              ))}
            </div>
          )}
        </section>

        {/* Sección 2: Buzón de Sugerencias y Recomendaciones de Usuarios */}
        <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span>📬</span> Buzón Ciudadano — Sugerencias ({recomendaciones.length})
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Aportes y recomendaciones enviadas por la comunidad durante la etapa de validación.
            </p>
          </div>

          {recomendaciones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Aún no se han recibido sugerencias desde el buzón de la web.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recomendaciones.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
                >
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed mb-4">
                    “{rec.mensaje}”
                  </p>
                  <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <span>
                      {rec.contacto ? (
                        <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                          👤 {rec.contacto}
                        </span>
                      ) : (
                        <span className="italic">Anónimo</span>
                      )}
                    </span>
                    <span>
                      {new Date(rec.createdAt).toLocaleDateString("es-EC", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sección 3: Gestión de Números de Notificación WhatsApp */}
        <AdminNotificaciones numeros={numerosNotificacion} />

      </main>
    </div>
  );
}
