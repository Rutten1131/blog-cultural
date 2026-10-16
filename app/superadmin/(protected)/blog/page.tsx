'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { renderContent, getVideoEmbedHtml } from '@/lib/markdown';

// ─────────────────────────────────────────────────────────
// ⚙️  PERSONALIZA: nombre de tu sitio y categorías del blog
// ─────────────────────────────────────────────────────────
const SITE_NAME = 'Mi Sitio';
const CATEGORIAS = ['Blog', 'Noticias', 'Guías', 'Tutoriales', 'Eventos', 'Recursos'];
const AUTOR_DEFAULT = 'Mi Sitio';
// ─────────────────────────────────────────────────────────

// Estos valores DEBEN coincidir con los de auth/route.ts y posts/route.ts
const AUTH_COOKIE_NAME = 'admin_session_token';
const AUTH_SECRET_VALUE = 'authenticated_mi_sitio_admin_2026';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados del CRUD
  const [posts, setPosts] = useState<any[]>([]);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<any | null>(null);

  // Estado para modal de insertar video en el contenido
  const [showVideoInsertModal, setShowVideoInsertModal] = useState(false);
  const [videoToInsert, setVideoToInsert] = useState('');
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Formulario de artículo
  const [form, setForm] = useState({
    titulo: '',
    slug: '',
    resumen: '',
    contenido: '',
    imagen: '',
    imagen_alt: '',
    video_url: '',
    categoria: CATEGORIAS[0],
    etiquetas: '',
    canton_slug: '',
    autor: AUTOR_DEFAULT,
    publicado: true,
    tiempo_lectura: 5,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-slug a partir del título
  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      titulo: val,
      slug: editingId
        ? prev.slug
        : val
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
    }));
  };

  // Insertar texto o video en la posición actual del cursor
  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setForm((prev) => ({ ...prev, contenido: prev.contenido + '\n\n' + textToInsert }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);
    const newVal = before + textToInsert + after;

    setForm((prev) => ({ ...prev, contenido: newVal }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 50);
  };

  const handleConfirmVideoInsert = () => {
    const url = videoToInsert.trim();
    if (!url) return;
    insertAtCursor(`\n\n${url}\n\n`);
    setVideoToInsert('');
    setShowVideoInsertModal(false);
  };

  // Convertir imagen a Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        imagen: reader.result as string,
        imagen_alt: prev.imagen_alt || prev.titulo,
      }));
    };
    reader.readAsDataURL(file);
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/posts');
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        fetchPosts();
      } else {
        setLoginError(data.error || 'Contraseña incorrecta');
      }
    } catch {
      setLoginError('Error de red al intentar iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
  };

  const startNewPost = () => {
    setEditingId(null);
    setForm({
      titulo: '',
      slug: '',
      resumen: '',
      contenido: '',
      imagen: '',
      imagen_alt: '',
      video_url: '',
      categoria: CATEGORIAS[0],
      etiquetas: '',
      canton_slug: '',
      autor: AUTOR_DEFAULT,
      publicado: true,
      tiempo_lectura: 5,
    });
    setMessage(null);
    setView('editor');
  };

  const editPost = (post: any) => {
    setEditingId(post.id);
    setForm({
      titulo: post.titulo,
      slug: post.slug,
      resumen: post.resumen,
      contenido: post.contenido || '',
      imagen: post.imagen || '',
      imagen_alt: post.imagen_alt || '',
      video_url: post.video_url || '',
      categoria: post.categoria || CATEGORIAS[0],
      etiquetas: Array.isArray(post.etiquetas) ? post.etiquetas.join(', ') : post.etiquetas || '',
      canton_slug: post.canton_slug || '',
      autor: post.autor || AUTOR_DEFAULT,
      publicado: post.publicado,
      tiempo_lectura: post.tiempo_lectura || 5,
    });
    setMessage(null);
    setView('editor');
  };

  // Activar o desactivar publicación directamente desde la tabla
  const togglePublishStatus = async (post: any) => {
    const newStatus = !post.publicado;
    // Actualización optimista en interfaz
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, publicado: newStatus } : p))
    );

    try {
      const res = await fetch(`/api/admin/posts/${post.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicado: newStatus }),
      });
      if (!res.ok) {
        // Revertir si falló
        fetchPosts();
      }
    } catch {
      fetchPosts();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar permanentemente este artículo?')) return;
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPosts();
      } else {
        alert('Error al eliminar el artículo');
      }
    } catch {
      alert('Error de red al intentar eliminar');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const endpoint = editingId ? `/api/admin/posts/${editingId}` : '/api/admin/posts';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '¡Artículo guardado exitosamente!' });
        fetchPosts();
        setTimeout(() => setView('list'), 1000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar el artículo' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setSaving(false);
    }
  };

  // ── 1. PANTALLA DE LOGIN ──────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="text-center mb-8">
            <div className="size-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm text-3xl">
              🔐
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Panel de Administración
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {SITE_NAME} • Gestión del Blog
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">
                Contraseña de Acceso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave maestra"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition duration-200 disabled:opacity-50 shadow-md text-sm tracking-wide"
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-5">
            <Link href="/" className="text-xs font-medium text-gray-500 hover:text-blue-600 transition">
              ← Volver al sitio público
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. PANEL ADMINISTRADOR ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl">
              ✍️
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-none text-base">
                Panel Blog • <span className="text-blue-600">{SITE_NAME}</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Gestión de Artículos &amp; SEO
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              target="_blank"
              className="text-xs font-medium bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3.5 py-2 rounded-xl border border-blue-200 transition flex items-center gap-1.5"
            >
              <span>Ver Blog</span>
              <span>↗</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de Título y Botón Nuevo */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {view === 'list' ? 'Artículos del Blog' : editingId ? 'Editar Artículo' : 'Crear Nuevo Artículo'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {view === 'list'
                ? 'Gestiona tus publicaciones, activa o desactiva su visibilidad, edita o previsualiza.'
                : 'Completa el título, contenido, resumen para SEO y sube imágenes.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {view === 'list' ? (
              <button
                onClick={startNewPost}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
              >
                <span>➕</span> Nuevo Artículo
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(form)}
                  className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>👁️</span> Vista Previa
                </button>
                <button
                  onClick={() => setView('list')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl transition"
                >
                  ← Volver al Listado
                </button>
              </div>
            )}
          </div>
        </div>

        {/* VISTA 1: LISTADO DE POSTS */}
        {view === 'list' && (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-5">Artículo</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        No hay artículos aún. Haz clic en &quot;Nuevo Artículo&quot; para crear el primero.
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id || post.slug} className="hover:bg-gray-50 transition">
                        <td className="py-4 px-5 max-w-xs sm:max-w-md">
                          <div className="font-bold text-gray-900 text-base break-words [overflow-wrap:anywhere]">{post.titulo}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5 break-all">/blog/{post.slug}</div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-lg border border-blue-200">
                            {post.categoria || 'Blog'}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => togglePublishStatus(post)}
                            title="Haz clic para activar o desactivar"
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition cursor-pointer ${
                              post.publicado
                                ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            <span className={`size-2 rounded-full ${post.publicado ? 'bg-green-500' : 'bg-amber-500'}`} />
                            {post.publicado ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>

                        <td className="py-4 px-4 text-xs text-gray-500">
                          {post.fecha_publicacion || 'Reciente'}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setShowPreviewModal(post)}
                              className="text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg transition"
                              title="Previsualizar artículo"
                            >
                              👁️ Vista previa
                            </button>
                            <button
                              onClick={() => editPost(post)}
                              className="text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 px-2.5 py-1.5 rounded-lg transition"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 px-2.5 py-1.5 rounded-lg transition"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA 2: FORMULARIO CREAR / EDITAR */}
        {view === 'editor' && (
          <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 space-y-7 shadow-sm">
            {message && (
              <div
                className={`p-4 rounded-2xl text-sm font-medium border ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Título */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Título del Artículo (H1 &amp; SEO Title) *
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={handleTituloChange}
                  placeholder="Ej: Los 5 Mejores Consejos para Empezar..."
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                />
              </div>

              {/* Slug URL */}
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Slug (URL amigable) *
                </label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-500 text-sm">
                  <span>/blog/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="mi-articulo-url"
                    required
                    className="w-full bg-transparent text-gray-900 focus:outline-none ml-1 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Categoría Principal *
                </label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Resumen / Meta Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Resumen / Meta Descripción (SEO) *</span>
                  <span className="text-gray-500 font-normal">{form.resumen.length} / 160 caracteres</span>
                </label>
                <textarea
                  rows={2}
                  value={form.resumen}
                  onChange={(e) => setForm((prev) => ({ ...prev, resumen: e.target.value }))}
                  placeholder="Escribe un resumen conciso que enganche al usuario en Google y redes sociales..."
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
                />
              </div>

              {/* Imagen destacada */}
              <div className="md:col-span-2 bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Imagen Destacada (Base64 o URL directa)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Subir desde tu computador (Base64 — máx. 5MB)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">O pega una URL de imagen</label>
                    <input
                      type="text"
                      value={form.imagen}
                      onChange={(e) => setForm((prev) => ({ ...prev, imagen: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {form.imagen && (
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 pt-2 bg-white p-3 rounded-2xl border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imagen}
                      alt="Vista previa"
                      className="w-32 h-20 object-cover rounded-xl border border-gray-200 shadow-sm shrink-0"
                    />
                    <div className="flex-1 w-full">
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Texto Alternativo SEO (Alt Text) *</label>
                      <input
                        type="text"
                        value={form.imagen_alt}
                        onChange={(e) => setForm((prev) => ({ ...prev, imagen_alt: e.target.value }))}
                        placeholder="Descripción visual con palabras clave para Google Imágenes"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, imagen: '', imagen_alt: '' }))}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-4 py-2.5 rounded-xl transition shrink-0"
                    >
                      🗑️ Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* VIDEO PRINCIPAL */}
              <div className="md:col-span-2 bg-blue-50 p-6 rounded-3xl border-2 border-blue-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                      🎬
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-gray-900">
                        Video Principal del Artículo (YouTube, Vimeo o MP4)
                      </h4>
                      <p className="text-xs text-gray-500">
                        Pega el link del video. Aparecerá como reproductor funcional en el blog.
                      </p>
                    </div>
                  </div>
                  {form.video_url && (
                    <span className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shrink-0 shadow-sm">
                      ✓ Video Configurado
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={form.video_url || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({ ...prev, video_url: val }));
                      }}
                      placeholder="Ejemplo: https://www.youtube.com/watch?v=... o https://.../video.mp4"
                      className="w-full bg-white border-2 border-blue-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-inner"
                    />
                  </div>
                  {form.video_url && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, video_url: '' }))}
                      className="bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-4 py-3 rounded-2xl transition shrink-0"
                    >
                      Quitar Video
                    </button>
                  )}
                </div>

                {form.video_url && (
                  <div
                    className="rounded-2xl overflow-hidden border border-blue-200 shadow-md aspect-video max-w-xl bg-black"
                    dangerouslySetInnerHTML={{ __html: getVideoEmbedHtml(form.video_url) }}
                  />
                )}
              </div>

              {/* Contenido del artículo */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Cuerpo del Artículo (Texto Normal &amp; Markdown) *
                  </label>
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setEditorTab('edit')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        editorTab === 'edit'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      ✍️ Escribir
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        editorTab === 'preview'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      👁️ Vista Previa
                    </button>
                  </div>
                </div>

                {/* Barra de herramientas */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100 rounded-2xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowVideoInsertModal(true)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition shadow-sm"
                  >
                    <span>🎬</span>
                    <span>Insertar Video Aquí</span>
                  </button>

                  <div className="h-5 w-px bg-gray-300 mx-1 hidden sm:block" />

                  <button
                    type="button"
                    onClick={() => insertAtCursor('**Texto en negrita**')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 transition"
                    title="Negrita"
                  >
                    <strong>B</strong> Negrita
                  </button>

                  <button
                    type="button"
                    onClick={() => insertAtCursor('\n\n## Título de Sección\n\n')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 transition"
                    title="Título principal de sección"
                  >
                    H2 Título
                  </button>

                  <button
                    type="button"
                    onClick={() => insertAtCursor('\n\n### Subtítulo\n\n')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 transition"
                    title="Subtítulo"
                  >
                    H3 Subtítulo
                  </button>

                  <button
                    type="button"
                    onClick={() => insertAtCursor('\n\n- Punto clave 1\n- Punto clave 2\n- Punto clave 3\n\n')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 transition"
                    title="Lista con viñetas"
                  >
                    • Lista
                  </button>

                  <button
                    type="button"
                    onClick={() => insertAtCursor('\n\n> Cita o frase destacada importante\n\n')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 transition"
                    title="Cita o texto destacado"
                  >
                    ❝ Cita
                  </button>
                </div>

                {/* Área del editor */}
                {editorTab === 'edit' ? (
                  <div>
                    <textarea
                      ref={textareaRef}
                      rows={16}
                      value={form.contenido}
                      onChange={(e) => setForm((prev) => ({ ...prev, contenido: e.target.value }))}
                      placeholder="Escribe tu artículo aquí de manera natural..."
                      required
                      className="w-full bg-white border-2 border-gray-200 focus:border-blue-500 rounded-2xl p-5 text-gray-900 focus:outline-none text-base leading-relaxed font-sans shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Para colocar un video donde quieras, pon el cursor en el texto y haz clic en <strong>&#34;🎬 Insertar Video Aquí&#34;</strong>.</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 min-h-[350px] shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                        Vista previa interactiva del artículo:
                      </span>
                    </div>
                    <div
                      className="prose prose-lg max-w-none break-words"
                      dangerouslySetInnerHTML={{ __html: renderContent(form.contenido) }}
                    />
                  </div>
                )}
              </div>

              {/* Etiquetas / Tags */}
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Etiquetas (separadas por coma)
                </label>
                <input
                  type="text"
                  value={form.etiquetas}
                  onChange={(e) => setForm((prev) => ({ ...prev, etiquetas: e.target.value }))}
                  placeholder="Tecnología, Guías, Recursos, Tutoriales"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sección / canton_slug — opcional, úsalo como categoría extra */}
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Sección o Categoría Extra (opcional)
                </label>
                <input
                  type="text"
                  value={form.canton_slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, canton_slug: e.target.value }))}
                  placeholder="Ej: productos, servicios, empresa"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Autor y Tiempo */}
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  value={form.autor}
                  onChange={(e) => setForm((prev) => ({ ...prev, autor: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Tiempo estimado de lectura (minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={form.tiempo_lectura}
                  onChange={(e) => setForm((prev) => ({ ...prev, tiempo_lectura: Number(e.target.value) }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* CHECKBOX ACTIVAR / DESACTIVAR */}
              <div className="md:col-span-2 bg-green-50/60 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 text-sm">Estado de Publicación</div>
                  <div className="text-xs text-gray-500">
                    {form.publicado
                      ? 'Activo: El artículo será público e indexable inmediatamente.'
                      : 'Inactivo: Se guardará como borrador oculto.'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.publicado}
                    onChange={(e) => setForm((prev) => ({ ...prev, publicado: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPreviewModal(form)}
                className="px-5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 font-semibold text-sm transition shadow-sm"
              >
                👁️ Vista Previa
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-5 py-3 rounded-xl text-gray-500 hover:text-gray-900 transition text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3 rounded-xl transition text-sm disabled:opacity-50 shadow-md"
              >
                {saving ? 'Guardando...' : editingId ? 'Actualizar Artículo' : 'Guardar Artículo'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MODAL DE VISTA PREVIA DEL ARTÍCULO */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 p-4 px-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold">
                  Vista Previa en Vivo
                </span>
                <span className="text-xs text-gray-500">
                  {showPreviewModal.publicado ? '● Estado: Activo' : '○ Estado: Inactivo'}
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(null)}
                className="text-gray-500 hover:text-gray-900 size-8 rounded-full bg-gray-100 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-10">
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full">
                  {showPreviewModal.categoria || 'Blog'}
                </span>
                <span>⏱️ {showPreviewModal.tiempo_lectura || 5} min de lectura</span>
                <span>•</span>
                <span>Autor: {showPreviewModal.autor || AUTOR_DEFAULT}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4 break-words [overflow-wrap:anywhere]">
                {showPreviewModal.titulo || 'Sin título'}
              </h1>

              {showPreviewModal.resumen && (
                <p className="text-base text-gray-500 leading-relaxed border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-xl mb-6 break-words [overflow-wrap:anywhere]">
                  {showPreviewModal.resumen}
                </p>
              )}

              {showPreviewModal.imagen && (
                <div className="rounded-2xl overflow-hidden mb-8 border border-gray-200 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={showPreviewModal.imagen}
                    alt={showPreviewModal.imagen_alt || 'Imagen del artículo'}
                    className="w-full max-h-[420px] object-cover"
                  />
                </div>
              )}

              <div
                className="prose prose-lg max-w-none break-words overflow-hidden [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{ __html: renderContent(showPreviewModal.contenido) || '<p class="text-gray-400">Sin contenido...</p>' }}
              />
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 px-6 text-right">
              <button
                onClick={() => setShowPreviewModal(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-sm"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA INSERTAR VIDEO EN EL CURSOR */}
      {showVideoInsertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
                  🎬
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Insertar Video en el Texto
                  </h3>
                  <p className="text-xs text-gray-500">
                    Se insertará exactamente donde dejaste el cursor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoInsertModal(false)}
                className="text-gray-500 hover:text-gray-900 size-8 rounded-full bg-gray-100 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Enlace del Video (YouTube, Vimeo o MP4 directo) *
              </label>
              <input
                type="url"
                value={videoToInsert}
                onChange={(e) => setVideoToInsert(e.target.value)}
                placeholder="Ejemplo: https://www.youtube.com/watch?v=..."
                autoFocus
                className="w-full bg-gray-50 border-2 border-blue-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-gray-500 mt-2">
                Acepta archivos directos <code>.mp4</code>, enlaces de YouTube o videos de Vimeo. El sistema lo convierte en un reproductor funcional responsivo automáticamente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowVideoInsertModal(false)}
                className="px-4 py-2.5 rounded-xl text-gray-500 hover:text-gray-900 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmVideoInsert}
                disabled={!videoToInsert.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md"
              >
                ✓ Insertar en el Artículo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
