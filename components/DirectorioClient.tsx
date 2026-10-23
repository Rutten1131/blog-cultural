"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { OrganizacionCultural } from "@/lib/organizacionesData";

interface Props {
  organizaciones: OrganizacionCultural[];
}

export function DirectorioClient({ organizaciones }: Props) {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState<string>("");

  const filtradas = useMemo(() => {
    return organizaciones.filter((org) => {
      const coincideCat = categoriaFiltro === "todas" || org.categoria === categoriaFiltro;
      const texto = `${org.nombre} ${org.descripcionCorta} ${org.disciplinas.join(" ")} ${org.representante}`.toLowerCase();
      const coincideBusqueda = !busqueda.trim() || texto.includes(busqueda.toLowerCase().trim());
      return coincideCat && coincideBusqueda;
    });
  }, [organizaciones, categoriaFiltro, busqueda]);

  const categoriasTabs = [
    { id: "todas", label: "Todas las entidades", emoji: "🏛️" },
    { id: "danza", label: "Academias de Danza", emoji: "🩰" },
    { id: "teatro", label: "Teatro & Productoras", emoji: "🎭" },
    { id: "musica", label: "Música & Conservatorio", emoji: "🎻" },
    { id: "circo-social", label: "Circo & Social", emoji: "🎪" },
  ];

  return (
    <div>
      {/* ── Buscador y Filtros ── */}
      <div className="mb-8 flex flex-col items-center gap-4">
        {/* Input de Búsqueda */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por academia, danza, teatro, profesor..."
            className="w-full rounded-full border border-zinc-200 bg-white px-5 py-3 pl-11 text-sm shadow-sm outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-purple-400"
          />
          <span className="absolute left-4 top-3.5 text-zinc-400">🔍</span>
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-4 top-3 text-xs text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Píldoras de Filtro */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categoriasTabs.map((tab) => {
            const isActive = categoriaFiltro === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoriaFiltro(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                    : "bg-white text-zinc-600 hover:bg-purple-50 hover:text-purple-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid de Organizaciones ── */}
      {filtradas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-4xl">🎭</span>
          <h3 className="mt-3 font-display text-lg font-bold text-zinc-900 dark:text-white">
            No encontramos resultados con esa búsqueda
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Intenta con otro término o limpia los filtros para ver todas las academias y espacios de Loja.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((org) => {
            return (
              <article
                key={org.slug}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                      {org.categoria === "danza" && "🩰 Academia de Danza"}
                      {org.categoria === "teatro" && "🎭 Productora / Teatro"}
                      {org.categoria === "musica" && "🎻 Educación Musical"}
                      {org.categoria === "circo-social" && "🎪 Circo & Teatro Social"}
                    </span>
                    {org.anoFundacion && (
                      <span className="text-[11px] font-bold text-zinc-400">
                        Desde {org.anoFundacion}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 font-display text-xl font-black leading-tight text-zinc-900 transition-colors group-hover:text-purple-600 dark:text-white">
                    <Link href={`/directorio/${org.slug}`}>
                      {org.nombre}
                    </Link>
                  </h2>

                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-3">
                    {org.descripcionCorta}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {org.disciplinas.slice(0, 3).map((disc) => (
                      <span
                        key={disc}
                        className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {disc}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
                    <p className="flex items-center gap-1.5 truncate">
                      <span>👤</span>
                      <strong className="text-zinc-700 dark:text-zinc-300">{org.representante}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <Link
                    href={`/directorio/${org.slug}`}
                    className="text-xs font-black uppercase tracking-wider text-purple-600 hover:text-purple-700 dark:text-purple-400"
                  >
                    Ver ficha y clases →
                  </Link>

                  {org.whatsappPrincipal && (
                    <a
                      href={`https://wa.me/${org.whatsappPrincipal}?text=Hola,%20vi%20su%20información%20en%20Agenda%20Cultural%20Loja`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
