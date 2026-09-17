// Layout raíz de /superadmin — neutro, sin verificación de cookie.
// La protección real queda en app/superadmin/(protected)/layout.tsx
// para no causar bucle de redirección en /superadmin/login.
import type { ReactNode } from "react";

export default function SuperAdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
