import "server-only";
import crypto from "crypto";

/**
 * Genera un token HMAC criptográfico seguro para la aprobación directa con 1 clic desde WhatsApp.
 * Evita que cualquier persona no autorizada intente adivinar URLs tipo ?id=1, ?id=2.
 */
export function generarTokenAprobacion(eventoId: number, slug: string): string {
  const secret = process.env.ADMIN_PASSWORD || "agenda_cultural_loja_secure_secret_2026";
  const data = `aprobar_evento_${eventoId}_${slug}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex").slice(0, 32);
}

/**
 * Valida si el token proporcionado coincide con el token esperado para el evento dado.
 */
export function validarTokenAprobacion(eventoId: number, slug: string, token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const tokenEsperado = generarTokenAprobacion(eventoId, slug);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(tokenEsperado));
  } catch {
    return false;
  }
}
