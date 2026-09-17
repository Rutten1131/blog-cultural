import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "superadmin_token";
const COOKIE_VALUE = "sa_agenda_cultural_loja_2026";

// La página de login NO debe ser protegida por el layout,
// así que necesita su propio layout vacío para escapar del padre.
// Aquí hacemos la verificación inversa: si YA está autenticado, llevar al dashboard.
export default async function SuperAdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token === COOKIE_VALUE) {
    redirect("/superadmin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-purple-950/30 to-zinc-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Super Admin</h1>
          <p className="text-zinc-400 text-sm mt-1">Agenda Cultural Loja</p>
        </div>

        {/* Formulario */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
          <form id="superadmin-login-form" className="space-y-5">
            <div>
              <label htmlFor="sa-password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Clave de Acceso
              </label>
              <input
                id="sa-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div id="sa-login-error" className="hidden rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-sm px-4 py-3 font-medium">
              Clave incorrecta. Inténtalo de nuevo.
            </div>

            <button
              type="submit"
              id="sa-login-btn"
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md hover:shadow-purple-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              Ingresar al Super Admin
            </button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('superadmin-login-form').addEventListener('submit', async function(e) {
          e.preventDefault();
          const btn = document.getElementById('sa-login-btn');
          const errDiv = document.getElementById('sa-login-error');
          const password = this.password.value;
          btn.disabled = true;
          btn.textContent = 'Verificando...';
          errDiv.classList.add('hidden');
          try {
            const res = await fetch('/api/superadmin/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password })
            });
            if (res.ok) {
              window.location.href = '/superadmin';
            } else {
              errDiv.classList.remove('hidden');
              btn.disabled = false;
              btn.textContent = 'Ingresar al Super Admin';
            }
          } catch {
            errDiv.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'Ingresar al Super Admin';
          }
        });
      ` }} />
    </div>
  );
}
