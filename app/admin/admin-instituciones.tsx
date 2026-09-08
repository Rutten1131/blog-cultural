"use client";

import { useActionState, useState } from "react";
import {
  crearInstitucion,
  actualizarPasswordInstitucion,
  toggleInstitucionActiva,
  type InstitucionActionState,
} from "@/lib/actions/gestionarInstituciones";

interface InstitucionItem {
  id: number;
  nombre: string;
  slug: string;
  password: string;
  activa: boolean;
  createdAt: Date;
  _count?: {
    numerosNotificacion: number;
  };
}

const initialState: InstitucionActionState = { success: false };

export function AdminInstituciones({
  instituciones,
}: {
  instituciones: InstitucionItem[];
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [state, formAction, isPending] = useActionState(crearInstitucion, initialState);
  const [passwordsVisibles, setPasswordsVisibles] = useState<Record<number, boolean>>({});
  const [editandoPasswordId, setEditandoPasswordId] = useState<number | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [guardandoPass, setGuardandoPass] = useState(false);

  // Cerrar form si tuvo éxito
  if (state.success && mostrarForm) {
    setMostrarForm(false);
  }

  const togglePasswordVisible = (id: number) => {
    setPasswordsVisibles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGuardarPassword = async (id: number) => {
    if (!nuevaPassword.trim()) return;
    setGuardandoPass(true);
    const res = await actualizarPasswordInstitucion(id, nuevaPassword);
    setGuardandoPass(false);
    if (res.success) {
      setEditandoPasswordId(null);
      setNuevaPassword("");
    } else {
      alert(res.error || "Error al actualizar contraseña");
    }
  };

  return (
    <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>🏛️</span> Cuentas e Instituciones
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Administra las entidades asociadas, sus usuarios, contraseñas de acceso al panel y añade nuevas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarForm((v) => !v)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 shadow-md shadow-purple-500/20 transition-all"
        >
          {mostrarForm ? "✕ Cancelar" : "+ Nueva Institución"}
        </button>
      </div>

      {/* Formulario para añadir nueva institución */}
      {mostrarForm && (
        <form
          action={formAction}
          className="mb-8 rounded-2xl border border-purple-200 bg-purple-50/50 dark:border-purple-900/40 dark:bg-purple-950/20 p-6 space-y-4"
        >
          <h3 className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
            <span>✨</span> Registrar Nueva Institución o Sector
          </h3>

          {state.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="nombre"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Nombre Oficial *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                placeholder="Ej: Ministerio de Cultura Loja"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-purple-500"
              />
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Usuario de Acceso (Slug)
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                placeholder="Ej: min-cultura (opcional)"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-purple-500"
              />
              <span className="text-[10px] text-zinc-400">Si se deja vacío se generará automáticamente</span>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Contraseña de Acceso *
              </label>
              <input
                id="password"
                name="password"
                type="text"
                required
                placeholder="Ej: clave_segura2026"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isPending ? "Registrando..." : "Guardar Institución"}
            </button>
          </div>
        </form>
      )}

      {/* Lista / Tabla de Instituciones */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
          <thead className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-900/50 text-xs uppercase font-bold text-zinc-500 dark:text-zinc-400">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Institución
              </th>
              <th scope="col" className="px-5 py-3.5">
                Contraseña
              </th>
              <th scope="col" className="px-5 py-3.5">
                Estado
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {instituciones.map((inst) => {
              const esVisible = passwordsVisibles[inst.id];
              const estaEditando = editandoPasswordId === inst.id;

              return (
                <tr key={inst.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏛️</span>
                      <span>{inst.nombre}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {estaEditando ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={nuevaPassword}
                          onChange={(e) => setNuevaPassword(e.target.value)}
                          placeholder="Nueva contraseña"
                          className="rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleGuardarPassword(inst.id)}
                          disabled={guardandoPass}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoPasswordId(null)}
                          className="rounded-lg bg-zinc-200 dark:bg-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-zinc-800 dark:text-zinc-200">
                          {esVisible ? inst.password : "••••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisible(inst.id)}
                          title={esVisible ? "Ocultar contraseña" : "Ver contraseña"}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                        >
                          {esVisible ? "👁️ Ocultar" : "👁️ Ver"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoPasswordId(inst.id);
                            setNuevaPassword(inst.password);
                          }}
                          title="Cambiar contraseña"
                          className="p-1 rounded text-purple-600 hover:text-purple-700 text-xs"
                        >
                          ✏️ Cambiar
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        inst.activa
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          inst.activa ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                      />
                      {inst.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleInstitucionActiva(inst.id, !inst.activa);
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                    >
                      {inst.activa ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
