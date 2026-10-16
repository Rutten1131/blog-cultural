import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDbPool } from '@/lib/db';

const AUTH_COOKIE_NAME = 'admin_session_token';
const AUTH_SECRET_VALUE = 'authenticated_mi_sitio_admin_2026';
const SUPERADMIN_COOKIE_NAME = 'superadmin_token';
const SUPERADMIN_COOKIE_VALUE = 'sa_agenda_cultural_loja_2026';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(AUTH_COOKIE_NAME);
  const superadminToken = cookieStore.get(SUPERADMIN_COOKIE_NAME);
  return (
    adminToken?.value === AUTH_SECRET_VALUE ||
    superadminToken?.value === SUPERADMIN_COOKIE_VALUE
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const db = getDbPool();
    const [rows]: any = await db.query('SELECT * FROM blog_posts WHERE id = ? LIMIT 1', [id]);
    if (rows && rows.length > 0) {
      const p = rows[0];
      return NextResponse.json({
        success: true,
        post: { ...p, publicado: Boolean(p.publicado), etiquetas: typeof p.etiquetas === 'string' ? JSON.parse(p.etiquetas) : p.etiquetas },
      });
    }
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await request.json();
    const {
      titulo, slug, resumen, contenido, imagen, imagen_alt, video_url,
      categoria, etiquetas, canton_slug, autor, publicado, tiempo_lectura,
    } = data;
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const tagsJson = JSON.stringify(
      Array.isArray(etiquetas) ? etiquetas : (etiquetas || '').split(',').map((s: string) => s.trim()).filter(Boolean)
    );
    const db = getDbPool();
    const updateQuery = `
      UPDATE blog_posts SET
        slug = ?, titulo = ?, resumen = ?, contenido = ?, imagen = ?,
        imagen_alt = ?, video_url = ?, categoria = ?, etiquetas = ?,
        canton_slug = ?, autor = ?, publicado = ?, tiempo_lectura = ?,
        fecha_modificacion = NOW()
      WHERE id = ?
    `;
    await db.query(updateQuery, [
      cleanSlug, titulo, resumen, contenido, imagen, imagen_alt,
      video_url || null, categoria, tagsJson, canton_slug || null,
      autor, publicado ? 1 : 0, Number(tiempo_lectura) || 5, id,
    ]);
    return NextResponse.json({ success: true, slug: cleanSlug });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const db = getDbPool();
    await db.query('DELETE FROM blog_posts WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
