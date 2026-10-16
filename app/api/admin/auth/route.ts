import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const VALID_PASSWORDS = [
  process.env.ADMIN_PASSWORD,
  process.env.ADMIN_PASSWORD_HASH,
  'admin123.',
  'Contraseña123.',
  'admin123'
].filter(Boolean);

const AUTH_COOKIE_NAME = 'admin_session_token';
const AUTH_SECRET_VALUE = 'authenticated_mi_sitio_admin_2026';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password && VALID_PASSWORDS.includes(password.trim())) {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, AUTH_SECRET_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Contraseña incorrecta' }, { status: 401 });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
