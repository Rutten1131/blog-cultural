import type { Metadata } from "next";
import { PublicarForm } from "./publicar-form";

export const metadata: Metadata = {
  title: "Publicar evento",
  description:
    "Publicá tu evento cultural en la Agenda Cultural de Loja. Completá el formulario y será revisado antes de aparecer en la agenda pública.",
};

export default function PublicarPage() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-5xl px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <a
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Volver a la agenda
          </a>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Publicar un evento
          </h1>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
            Completá los datos de tu evento cultural. Será revisado por nuestro
            equipo antes de publicarse en la agenda.
          </p>
        </div>

        <PublicarForm />
      </main>
    </div>
  );
}
