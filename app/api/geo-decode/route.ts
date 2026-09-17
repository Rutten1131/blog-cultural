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

    // Extraer los campos que nos interesan
    const ciudad =
      addr.city || addr.town || addr.village || addr.county || addr.state_district || "Loja";
    const provincia = addr.state || "Loja";
    const pais = addr.country || "Ecuador";

    // Zona más específica posible para orientar al chatbot
    const zona =
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.city_district ||
      addr.district ||
      ciudad;

    return NextResponse.json({
      ciudad,
      provincia,
      pais,
      zona,
      displayName: data.display_name || `${ciudad}, ${provincia}`,
    });
  } catch (err: any) {
    console.error("[geo-decode] Error:", err.message);
    return NextResponse.json({ error: "Timeout o error de red" }, { status: 504 });
  }
}
