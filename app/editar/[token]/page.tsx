import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditarEventoClient from "./EditarEventoClient";

export const metadata: Metadata = {
  title: "Editar Evento | Agenda Cultural Loja",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const evento = await prisma.evento.findUnique({
    where: { editToken: token },
    select: {
      id: true,
      nombre: true,
      slug: true,
      fecha: true,
      fechaFin: true,
      lugar: true,
      descripcion: true,
      imagenUrl: true,
      estado: true,
      editToken: true,
      editTokenExpiresAt: true,
    },
  });

  if (!evento) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✕
          </div>
          <h1 className="text-xl font-bold text-neutral-100 mb-2">Enlace no encontrado</h1>
          <p className="text-neutral-400 text-sm mb-6">
            El enlace de edición es inválido o el evento ha sido reubicado.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition"
          >
            Volver a la Agenda
          </a>
        </div>
      </main>
    );
  }

  // Verificar si expiró
  const ahora = new Date();
  const expirado = evento.editTokenExpiresAt ? evento.editTokenExpiresAt < ahora : false;

  if (expirado) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ⏳
          </div>
          <h1 className="text-xl font-bold text-neutral-100 mb-2">Enlace de edición expirado</h1>
          <p className="text-neutral-400 text-sm mb-6">
            La fecha límite para editar este evento ha concluido ya que el evento se llevó a cabo o expiró su ventana de cambios.
          </p>
          <a
            href={`/eventos/${evento.slug}`}
            className="inline-block px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition"
          >
            Ver publicación en la web
          </a>
        </div>
      </main>
    );
  }

  return (
    <EditarEventoClient
      token={token}
      evento={{
        id: evento.id,
        nombre: evento.nombre,
        slug: evento.slug,
        fecha: evento.fecha.toISOString(),
        fechaFin: evento.fechaFin ? evento.fechaFin.toISOString() : null,
        lugar: evento.lugar,
        descripcion: evento.descripcion,
        imagenUrl: evento.imagenUrl,
        expiresAt: evento.editTokenExpiresAt ? evento.editTokenExpiresAt.toISOString() : null,
      }}
    />
  );
}
