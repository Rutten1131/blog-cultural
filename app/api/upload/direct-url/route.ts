import { NextRequest, NextResponse } from "next/server";

// Generar una URL de subida y nombre de archivo para subir directamente a Bunny.net
export async function POST(request: NextRequest) {
  try {
    const { filename, contentType } = await request.json();

    const storageZone = process.env.BUNNY_STORAGE_ZONE;
    const apiKey = process.env.BUNNY_API_KEY;
    const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;

    if (!storageZone || !apiKey || !pullZoneUrl) {
      return NextResponse.json(
        { error: "Configuración de Bunny.net incompleta en el servidor" },
        { status: 500 }
      );
    }

    const safeFilename = typeof filename === "string" ? filename : "archivo";
    const extension = safeFilename.split(".").pop()?.toLowerCase() || "webp";

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const path = `eventos/${timestamp}-${randomStr}.${extension}`;

    const uploadEndpoint = `https://storage.bunnycdn.com/${storageZone}/${path}`;
    const publicUrl = `${pullZoneUrl.replace(/\/$/, "")}/${path}`;

    return NextResponse.json({
      uploadEndpoint,
      publicUrl,
      accessKey: apiKey,
      contentType: contentType || "application/octet-stream",
    });
  } catch (err: unknown) {
    console.error("Error en presign de subida:", err);
    return NextResponse.json(
      { error: "Error al preparar la subida directa" },
      { status: 500 }
    );
  }
}
