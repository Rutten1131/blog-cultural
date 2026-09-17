import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

const COOKIE_NAME = "superadmin_token";
const COOKIE_VALUE = "sa_agenda_cultural_loja_2026";

export default async function SuperAdminProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token !== COOKIE_VALUE) {
    redirect("/superadmin/login");
  }

  return <>{children}</>;
}
