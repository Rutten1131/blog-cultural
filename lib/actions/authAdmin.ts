"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type AdminRole = "SUPERADMIN" | "INSTITUCION";

export interface AdminSession {
  role: AdminRole;
  institucionId?: number;
  nombre: string;
  slug?: string;
}

export interface LoginState {
  error?: string;
}

export async function loginAdmin(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = (formData.get("password")?.toString() ?? "").trim();

  if (!password) {
    return { error: "Por favor, ingresa tu contraseña de acceso." };
  }

  const expectedSuperPassword = (process.env.ADMIN_PASSWORD || "admin123_loja").trim();

  // 1. Si la contraseña coincide con la del Superadmin General
  if (password === expectedSuperPassword) {
    const sessionData: AdminSession = {
      role: "SUPERADMIN",
      nombre: "Superadmin General",
    };

    const cookieStore = await cookies();
    cookieStore.set("admin_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    redirect("/admin");
  }

  // 2. Si coincide directamente con la contraseña de una Institución
  const institucion = await prisma.institucion.findFirst({
    where: {
      password: password,
      activa: true,
    },
  });

  if (!institucion) {
    return { error: "Contraseña incorrecta. Verifica e intenta de nuevo." };
  }

  // Sesión institucional automática
  const sessionData: AdminSession = {
    role: "INSTITUCION",
    institucionId: institucion.id,
    nombre: institucion.nombre,
    slug: institucion.slug,
  };

  const cookieStore = await cookies();
  cookieStore.set("admin_session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  redirect("/admin");
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie || !sessionCookie.value) return null;

  // Compatibilidad con cookie antigua "authenticated"
  if (sessionCookie.value === "authenticated") {
    return {
      role: "SUPERADMIN",
      nombre: "Superadmin General",
    };
  }

  try {
    const data = JSON.parse(sessionCookie.value) as AdminSession;
    if (data.role) return data;
  } catch {
    return null;
  }

  return null;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}
