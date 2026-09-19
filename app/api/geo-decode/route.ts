import { NextRequest, NextResponse } from "next/server";

// Reverse geocoding usando Nominatim (OpenStreetMap) — sin API key, gratuito
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es&zoom=14`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "AgendaCulturalLoja/1.0 (agendaculturalloja.com)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Error geocoding" }, { status: 502 });
    }

    const data = await res.json();
    const addr = data.address || {};

    // 1. Extraer ciudad / cantón
    const ciudad =
      addr.city || addr.town || addr.village || addr.municipality || addr.county || "Loja";
    const provincia = addr.state || "Loja";
    const pais = addr.country || "Ecuador";

    // 2. Extraer barrio, sector o parroquia (sin nombres de calles como "10 de Agosto", "Bolívar", etc.)
    // En OpenStreetMap:
    // suburb = parroquia / sector urbano grande (ej: El Sagrario, Sucre, San Sebastián)
    // neighbourhood / quarter = barrio (ej: Zamora Huayco, Las Palmas, Jipiro, Clodoveo)
    // residential = zona residencial
    let zonaLimpia =
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.city_district ||
      addr.district ||
      addr.residential ||
      "";

    // Si la zona detectada contiene términos de calle o números que OpenStreetMap a veces confunde con un barrio,
    // o si está vacía, derivamos una zona amigable
    if (!zonaLimpia || /^(calle|av|avenida|pasaje|\d+)/i.test(zonaLimpia.trim())) {
      // Intentar parroquia o sector administrativo
      if (addr.city_district && !/^(calle|av|\d+)/i.test(addr.city_district)) {
        zonaLimpia = addr.city_district;
      } else if (addr.suburb && !/^(calle|av|\d+)/i.test(addr.suburb)) {
        zonaLimpia = addr.suburb;
      } else {
        // Si no se encuentra un barrio específico, colocar la ciudad/cantón o sector céntrico
        zonaLimpia = ciudad === "Loja" ? "Loja (Sector Urbano)" : ciudad;
      }
    }

    // Limpieza cosmética: si dice "Parroquia Sucre" -> "Sucre", etc.
    zonaLimpia = zonaLimpia.replace(/^parroquia\s+/i, "").trim();

    // Dirección detallada completa para auditoría técnica en SuperAdmin (calle, numeración, etc.)
    const direccionDetallada = data.display_name || `${zonaLimpia}, ${ciudad}, ${provincia}`;

    return NextResponse.json({
      ciudad,
      provincia,
      pais,
      zona: zonaLimpia,
      direccionDetallada,
      displayName: direccionDetallada,
    });
  } catch (err: any) {
    console.error("[geo-decode] Error:", err.message);
    return NextResponse.json({ error: "Timeout o error de red" }, { status: 504 });
  }
}
