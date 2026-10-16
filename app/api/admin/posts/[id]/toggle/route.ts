import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDbPool } from '@/lib/db';

const AUTH_COOKIE_NAME = 'admin_session_token';
const AUTH_SECRET_VALUE = 'authenticated_mi_sitio_admin_2026';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);
  return token?.value === AUTH_SECRET_VALUE;
}

// PATCH: Cambiar rápidamente el estado publicado (activar/desactivar)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const { publicado } = await request.json();
    const db = getDbPool();
    await db.query('UPDATE blog_posts SET publicado = ? WHERE id = ?', [publicado ? 1 : 0, id]);
    return NextResponse.json({ success: true, publicado: Boolean(publicado) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
