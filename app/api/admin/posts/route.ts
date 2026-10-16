import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDbPool, initDb } from '@/lib/db';
import { getAllPostsAdmin } from '@/lib/blog';

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

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const posts = await getAllPostsAdmin();
    return NextResponse.json({ success: true, posts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const data = await request.json();
    const {
      titulo, slug, resumen, contenido, imagen, imagen_alt, video_url,
      categoria, etiquetas, canton_slug, autor, publicado, tiempo_lectura,
    } = data;

    if (!titulo || !slug || !resumen || !contenido) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const tagsJson = JSON.stringify(
      Array.isArray(etiquetas) ? etiquetas : (etiquetas || '').split(',').map((s: string) => s.trim()).filter(Boolean)
    );

    const db = getDbPool();
    await initDb();

    const insertQuery = `
      INSERT INTO blog_posts
      (slug, titulo, resumen, contenido, imagen, imagen_alt, video_url, categoria, etiquetas, canton_slug, autor, publicado, tiempo_lectura)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result]: any = await db.query(insertQuery, [
      cleanSlug, titulo, resumen, contenido,
      imagen || '', imagen_alt || titulo, video_url || null,
      categoria || 'Blog', tagsJson, canton_slug || null,
      autor || 'Agenda Cultural Loja', publicado ? 1 : 0, Number(tiempo_lectura) || 5,
    ]);

    return NextResponse.json({ success: true, id: result.insertId, slug: cleanSlug });
  } catch (err: any) {
    console.error('Error insertando post:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
