'use client';

import { useState, useEffect, useRef } from 'react';
import { renderContent } from '@/lib/markdown';
import { uploadDirectToBunny } from '@/lib/uploadDirect';

const SITE_NAME = 'Agenda Cultural Loja';
const CATEGORIAS = ['Blog', 'Cultura', 'Eventos', 'Noticias', 'Guias', 'Historia', 'Arte', 'Musica', 'Teatro'];
const AUTOR_DEFAULT = 'Agenda Cultural Loja';

export function SuperAdminBlog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<any | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoToInsert, setVideoToInsert] = useState('');
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const emptyForm = {
    titulo: '', slug: '', resumen: '', contenido: '', imagen: '',
    imagen_alt: '', video_url: '', categoria: CATEGORIAS[0],
    etiquetas: '', canton_slug: '', autor: AUTOR_DEFAULT,
    publicado: true, tiempo_lectura: 5,
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const autoSlug = (val: string) =>
    val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm(p => ({
      ...p,
      titulo: val,
      slug: editingId ? p.slug : autoSlug(val),
      imagen_alt: p.imagen_alt || val,
    }));
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) { setForm(p => ({ ...p, contenido: p.contenido + '\n\n' + text })); return; }
    const s = ta.selectionStart, e2 = ta.selectionEnd;
    const newVal = ta.value.substring(0, s) + text + ta.value.substring(e2);
    setForm(p => ({ ...p, contenido: newVal }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + text.length, s + text.length); }, 50);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert('La imagen no debe superar los 25MB.');
      return;
    }

    setIsUploadingImg(true);
    setUploadProgress(0);

    try {
      let finalUrl = '';
      try {
        // Intento 1: Directo a Bunny CDN
        finalUrl = await uploadDirectToBunny(file, (pct) => setUploadProgress(pct));
      } catch (errDirect) {
        console.warn('Subida directa falló, intentando /api/upload de respaldo:', errDirect);
        // Intento 2: Endpoint optimizador /api/upload
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || 'Error al procesar en servidor');
        finalUrl = data.url;
      }

      setForm(p => ({
        ...p,
        imagen: finalUrl,
        imagen_alt: p.imagen_alt || p.titulo || file.name.replace(/\.[^/.]+$/, ''),
      }));
      setMessage({ type: 'success', text: '¡Imagen optimizada y subida a Bunny.net exitosamente!' });
    } catch (err: any) {
      console.error('Error subiendo imagen:', err);
      setMessage({ type: 'error', text: err.message || 'Error al subir la imagen a Bunny.net' });
    } finally {
      setIsUploadingImg(false);
      setUploadProgress(0);
      e.target.value = '';
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true); setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/posts');
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
      else setErrorMsg('No se pudieron cargar los articulos.');
    } catch { setErrorMsg('Error de red.'); }
    finally { setLoadingPosts(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const startNew = () => { setEditingId(null); setForm(emptyForm); setEditorTab('edit'); setView('editor'); };
  const startEdit = (post: any) => {
    setEditingId(post.id);
    setForm({
      titulo: post.titulo || '', slug: post.slug || '', resumen: post.resumen || '',
      contenido: post.contenido || '', imagen: post.imagen || '', imagen_alt: post.imagen_alt || '',
      video_url: post.video_url || '',
      categoria: post.categoria || CATEGORIAS[0],
      etiquetas: Array.isArray(post.etiquetas) ? post.etiquetas.join(', ') : (post.etiquetas || ''),
      canton_slug: post.canton_slug || '', autor: post.autor || AUTOR_DEFAULT,
      publicado: post.publicado ?? true, tiempo_lectura: post.tiempo_lectura || 5,
    });
    setEditorTab('edit'); setView('editor');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar este articulo? No se puede deshacer.')) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) { setPosts(p => p.filter(x => x.id !== id)); setMessage({ type: 'success', text: 'Articulo eliminado.' }); }
    else setMessage({ type: 'error', text: 'Error al eliminar.' });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage(null);
    const payload = { ...form, etiquetas: form.etiquetas.split(',').map(t => t.trim()).filter(Boolean), tiempo_lectura: Number(form.tiempo_lectura) };
    try {
      const url = editingId ? `/api/admin/posts/${editingId}` : '/api/admin/posts';
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: editingId ? 'Articulo actualizado!' : 'Articulo publicado!' });
        await fetchPosts(); setView('list'); setEditingId(null);
      } else setMessage({ type: 'error', text: data.error || 'Error al guardar.' });
    } catch { setMessage({ type: 'error', text: 'Error de red.' }); }
    finally { setSaving(false); setTimeout(() => setMessage(null), 4000); }
  };

  const toolbarBtns = [
    { label: 'H1', text: '\n# ' }, { label: 'H2', text: '\n## ' }, { label: 'H3', text: '\n### ' },
    { label: 'B', text: '**texto**' }, { label: 'I', text: '*texto*' },
    { label: 'Link', text: '[texto](url)' }, { label: 'Img', text: '\n![alt](url)\n' },
    { label: '---', text: '\n---\n' }, { label: 'Lista', text: '\n- item\n- item\n' },
    { label: 'Cita', text: '\n> ' }, { label: 'Code', text: '`codigo`' },
  ];

  const FlashMsg = () => message ? (
    <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
      {message.type === 'success' ? '✅' : '❌'} {message.text}
    </div>
  ) : null;

  // ── LISTA ──────────────────────────────────────────────
  if (view === 'list') return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>📝</span> Gestion del Blog
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Crea y gestiona los articulos de {SITE_NAME}.</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-900/30 active:scale-95">
          ✏️ Nuevo articulo
        </button>
      </div>

      <FlashMsg />

      {loadingPosts && (
        <div className="text-center py-16 text-zinc-500 text-sm">
          <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Cargando articulos...</p>
        </div>
      )}
      {errorMsg && !loadingPosts && (
        <div className="rounded-2xl border border-red-800/40 bg-red-900/10 p-8 text-center">
          <p className="text-red-400 text-sm">{errorMsg}</p>
          <button onClick={fetchPosts} className="mt-3 text-xs text-purple-400 hover:text-purple-300 underline">Reintentar</button>
        </div>
      )}

      {!loadingPosts && !errorMsg && (
        posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-14 text-center">
            <p className="text-4xl mb-3">📄</p>
            <p className="text-zinc-400 text-sm font-medium">No hay articulos publicados aun.</p>
            <button onClick={startNew} className="mt-4 text-sm text-purple-400 hover:text-purple-300 underline font-semibold">Crea el primero →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(post => (
              <div key={post.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-4 hover:border-zinc-700 transition-all">
                <div className="flex items-start gap-4">
                  {post.imagen && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imagen} alt={post.imagen_alt || post.titulo} className="w-20 h-20 rounded-xl object-cover border border-zinc-800 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.publicado ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700/60 text-zinc-400'}`}>
                        {post.publicado ? '● Publicado' : '○ Borrador'}
                      </span>
                      {post.categoria && <span className="text-[10px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full font-semibold">{post.categoria}</span>}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{post.titulo}</h3>
                    {post.resumen && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{post.resumen}</p>}
                    <p className="text-[11px] text-zinc-600 mt-2">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      {post.autor ? ` · ${post.autor}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                  <button onClick={() => startEdit(post)} className="flex-1 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition">✏️ Editar</button>
                  <button onClick={() => setShowPreviewModal(post)} className="flex-1 text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-900/20 hover:bg-purple-900/30 px-3 py-2 rounded-lg transition">👁 Vista previa</button>
                  <button onClick={() => handleDelete(post.id)} className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-900/10 hover:bg-red-900/20 px-3 py-2 rounded-lg transition">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 p-4 px-6 flex items-center justify-between">
              <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-bold">Vista Previa</span>
              <button onClick={() => setShowPreviewModal(null)} className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-200">✕</button>
            </div>
            <div className="p-6 sm:p-10">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{showPreviewModal.titulo}</h1>
              {showPreviewModal.resumen && <p className="text-base text-gray-500 border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r-xl mb-6">{showPreviewModal.resumen}</p>}
              {showPreviewModal.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={showPreviewModal.imagen} alt="" className="w-full max-h-[420px] object-cover rounded-2xl mb-8 border border-gray-200" />
              )}
              <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: renderContent(showPreviewModal.contenido) || '<p class="text-gray-400">Sin contenido</p>' }} />
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 px-6 text-right">
              <button onClick={() => setShowPreviewModal(null)} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── EDITOR ─────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => setView('list')} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mb-2 transition">← Volver</button>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            {editingId ? '✏️ Editar articulo' : '✨ Nuevo articulo'}
          </h2>
        </div>
        <button onClick={() => setShowPreviewModal(form)} className="text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition">
          👁 Vista previa
        </button>
      </div>

      <FlashMsg />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Info basica */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Informacion basica</h3>
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">Titulo *</label>
            <input type="text" value={form.titulo} onChange={handleTituloChange} required placeholder="Escribe un titulo atractivo..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">Slug (URL)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-mono">/blog/</span>
              <input type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} required placeholder="mi-articulo" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">Resumen *</label>
            <textarea value={form.resumen} onChange={e => setForm(p => ({ ...p, resumen: e.target.value }))} rows={2} required placeholder="Breve descripcion que aparece en la lista..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contenido *</h3>
            <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg">
              {(['edit', 'preview'] as const).map(t => (
                <button key={t} type="button" onClick={() => setEditorTab(t)} className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${editorTab === t ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                  {t === 'edit' ? 'Editar' : 'Previsualizar'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {toolbarBtns.map(btn => (
              <button key={btn.label} type="button" onClick={() => insertAtCursor(btn.text)} className="text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-700 transition-all">
                {btn.label}
              </button>
            ))}
            <button type="button" onClick={() => setShowVideoModal(true)} className="text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-purple-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition-all">
              🎬 Video
            </button>
          </div>
          {editorTab === 'edit' ? (
            <textarea ref={textareaRef} value={form.contenido} onChange={e => setForm(p => ({ ...p, contenido: e.target.value }))} required rows={18} placeholder="Escribe en Markdown..." className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-4 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y leading-relaxed" />
          ) : (
            <div className="min-h-[300px] bg-white text-gray-900 rounded-xl p-6 prose prose-lg max-w-none border border-zinc-700" dangerouslySetInnerHTML={{ __html: renderContent(form.contenido) || '<p class="text-gray-400 italic">Sin contenido aun...</p>' }} />
          )}
        </div>

        {/* Metadatos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Imagen y metadatos</h3>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-300">Imagen principal (Banner)</label>
              {isUploadingImg && (
                <span className="text-xs text-purple-400 font-medium flex items-center gap-1.5 animate-pulse">
                  <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Subiendo a Bunny.net CDN ({uploadProgress}%)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <input type="url" value={form.imagen.startsWith('data:') ? '' : form.imagen} onChange={e => setForm(p => ({ ...p, imagen: e.target.value }))} placeholder="https://culturallojablog.b-cdn.net/... o sube tu imagen" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <label className={`cursor-pointer ${isUploadingImg ? 'bg-zinc-800/60 opacity-60 pointer-events-none' : 'bg-purple-600 hover:bg-purple-700'} text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-purple-900/20`}>
                {isUploadingImg ? '⏳ Subiendo...' : '📁 Subir a Bunny'}
                <input type="file" accept="image/*" disabled={isUploadingImg} onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            {form.imagen && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imagen} alt="preview" className="w-24 h-16 rounded-lg object-cover border border-zinc-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Texto Alternativo SEO (Alt Text para Google)</label>
                  <input
                    type="text"
                    value={form.imagen_alt}
                    onChange={e => setForm(p => ({ ...p, imagen_alt: e.target.value }))}
                    placeholder="Describe la imagen para posicionamiento en Google..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1 truncate">CDN: {form.imagen}</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, imagen: '', imagen_alt: '' }))} className="text-xs text-red-400 hover:text-red-300 font-semibold self-start sm:self-center px-2 py-1 bg-red-950/30 rounded border border-red-900/40">Eliminar</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Categoria</label>
              <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Autor</label>
              <input type="text" value={form.autor} onChange={e => setForm(p => ({ ...p, autor: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Tiempo de lectura (min)</label>
              <input type="number" min={1} max={60} value={form.tiempo_lectura} onChange={e => setForm(p => ({ ...p, tiempo_lectura: Number(e.target.value) }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Etiquetas (separadas por coma)</label>
              <input type="text" value={form.etiquetas} onChange={e => setForm(p => ({ ...p, etiquetas: e.target.value }))} placeholder="loja, cultura, arte" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setForm(p => ({ ...p, publicado: !p.publicado }))} className={`relative w-11 h-6 rounded-full transition-colors ${form.publicado ? 'bg-purple-600' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.publicado ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-semibold text-zinc-300">
                  {form.publicado ? '🟢 Publicado (visible en el blog)' : '⚪ Borrador (no visible aun)'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pb-4">
          <button type="button" onClick={() => setView('list')} className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white text-sm font-semibold transition">Cancelar</button>
          <button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-7 py-2.5 rounded-xl transition text-sm shadow-lg shadow-purple-900/30 active:scale-95">
            {saving ? 'Guardando...' : editingId ? 'Actualizar articulo' : 'Publicar articulo'}
          </button>
        </div>
      </form>

      {/* Modal Video */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full shadow-2xl p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">🎬 Insertar Video</h3>
              <button type="button" onClick={() => setShowVideoModal(false)} className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white font-bold">✕</button>
            </div>
            <input type="url" value={videoToInsert} onChange={e => setVideoToInsert(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." autoFocus className="w-full bg-zinc-800 border-2 border-purple-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowVideoModal(false)} className="text-zinc-400 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl">Cancelar</button>
              <button type="button" onClick={() => { insertAtCursor(`\n\n${videoToInsert.trim()}\n\n`); setVideoToInsert(''); setShowVideoModal(false); }} disabled={!videoToInsert.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition">
                Insertar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview desde editor */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 p-4 px-6 flex items-center justify-between">
              <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-bold">Vista Previa en Vivo</span>
              <button onClick={() => setShowPreviewModal(null)} className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-200">✕</button>
            </div>
            <div className="p-6 sm:p-10">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{form.titulo || 'Sin titulo'}</h1>
              {form.resumen && <p className="text-base text-gray-500 border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r-xl mb-6">{form.resumen}</p>}
              {form.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imagen} alt="" className="w-full max-h-[420px] object-cover rounded-2xl mb-8 border border-gray-200" />
              )}
              <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: renderContent(form.contenido) || '<p class="text-gray-400 italic">Sin contenido aun...</p>' }} />
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 px-6 text-right">
              <button onClick={() => setShowPreviewModal(null)} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
