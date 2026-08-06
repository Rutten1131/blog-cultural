import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    const storageZone = process.env.BUNNY_STORAGE_ZONE;
    const apiKey = process.env.BUNNY_API_KEY;
    const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;

    if (!storageZone || !apiKey || !pullZoneUrl) {
      return NextResponse.json(
        { error: "Configuración de Bunny.net incompleta en el servidor" },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let finalBuffer: Buffer = buffer;
    let extension = "webp";

    // Si es imagen, optimizar a WebP
    if (file.type.startsWith("image/")) {
      finalBuffer = await sharp(buffer)
        .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } else {
      // Para otros archivos (ej. videos), conservar extensión original
      const parts = file.name.split(".");
      if (parts.length > 1) {
        extension = parts.pop()!.toLowerCase();
      }
    }

    // Nombre de archivo único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `eventos/${timestamp}-${randomStr}.${extension}`;

    // Subir a BunnyStorage API
    const bunnyUrl = `https://storage.bunnycdn.com/${storageZone}/${fileName}`;

    const bunnyRes = await fetch(bunnyUrl, {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(finalBuffer),
    });

    if (!bunnyRes.ok) {
      const errorText = await bunnyRes.text();
      console.error("Error al subir a Bunny.net:", bunnyRes.status, errorText);
      return NextResponse.json(
        { error: "Error al subir el archivo al almacenamiento CDN" },
        { status: 500 }
      );
    }

    const publicUrl = `${pullZoneUrl.replace(/\/$/, "")}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Error en endpoint de upload:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el archivo" },
      { status: 500 }
    );
  }
}
