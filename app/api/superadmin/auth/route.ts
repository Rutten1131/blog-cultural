import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SUPERADMIN_PASSWORD = "Contraseña123.";
const COOKIE_NAME = "superadmin_token";
const COOKIE_VALUE = "sa_agenda_cultural_loja_2026";
const MAX_AGE = 60 * 60 * 8; // 8 horas

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== SUPERADMIN_PASSWORD) {
      return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
