import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/media/resolve
 * Resuelve URLs cortas o de compartir (share/r/, reels, shorts, etc.) a su URL canónica y extrae OG metadata (og:image, og:title).
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    const trimmed = url.trim();

    // 1. Detección rápida de YouTube
    const ytMatch = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) {
      const videoId = ytMatch[1];
      const isShort = trimmed.includes("/shorts/");
      return NextResponse.json({
        originalUrl: trimmed,
        canonicalUrl: isShort
          ? `https://www.youtube.com/shorts/${videoId}`
          : `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        provider: "youtube",
        format: isShort ? "vertical" : "horizontal",
        title: isShort ? "YouTube Short" : "YouTube Video",
      });
    }

    // 2. Fetch con User-Agent de crawler social para resolver redirecciones y extraer OpenGraph
    const fetchResponse = await fetch(trimmed, {
      method: "GET",
      headers: {
        "User-Agent":
          "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    });

    let finalUrl = fetchResponse.url || trimmed;
    let thumbnailUrl: string | undefined;
    let title: string | undefined;

    // Limpiar query params de tracking innecesarios de Facebook / Instagram
    if (finalUrl.includes("facebook.com") || finalUrl.includes("fb.watch")) {
      // Si es un reel tipo /reel/1933212610728341/?rdid=... extraer limpio
      const reelMatch = finalUrl.match(/facebook\.com\/reel\/(\d+)/);
      if (reelMatch) {
        finalUrl = `https://www.facebook.com/reel/${reelMatch[1]}`;
      } else {
        finalUrl = finalUrl.split("?")[0];
      }
    } else if (finalUrl.includes("instagram.com")) {
      finalUrl = finalUrl.split("?")[0].replace(/\/$/, "");
    }

    // Intentar leer el HTML para obtener og:image y og:title
    try {
      const html = await fetchResponse.text();
      const ogImageMatch =
        html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
        html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
      const ogTitleMatch =
        html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
        html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i);

      if (ogImageMatch) {
        thumbnailUrl = ogImageMatch[1].replace(/&amp;/g, "&");
      }
      if (ogTitleMatch) {
        title = ogTitleMatch[1]
          .replace(/&amp;/g, "&")
          .replace(/&#xb7;/g, "·")
          .replace(/&#xa0;/g, " ");
      }
    } catch {
      // Ignorar error al parsear HTML
    }

    const isFb = finalUrl.includes("facebook.com") || finalUrl.includes("fb.watch");
    const isIg = finalUrl.includes("instagram.com");
    const isTt = finalUrl.includes("tiktok.com");
    const isVimeo = finalUrl.includes("vimeo.com");

    let provider: "facebook" | "instagram" | "tiktok" | "youtube" | "vimeo" | "web" = "web";
    let format: "vertical" | "horizontal" = "horizontal";
    let embedUrl = finalUrl;

    if (isFb) {
      provider = "facebook";
      const isReel = finalUrl.includes("/reel/") || finalUrl.includes("/reels/");
      format = isReel ? "vertical" : "horizontal";
      embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        finalUrl
      )}&show_text=false&width=560`;
    } else if (isIg) {
      provider = "instagram";
      format = "vertical";
      embedUrl = `${finalUrl}/embed`;
    } else if (isTt) {
      provider = "tiktok";
      format = "vertical";
      const ttMatch = finalUrl.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/|embed\/)?(\d+)/);
      embedUrl = ttMatch
        ? `https://www.tiktok.com/embed/v2/${ttMatch[1]}`
        : finalUrl;
    } else if (isVimeo) {
      provider = "vimeo";
      const vimeoMatch = finalUrl.match(/vimeo\.com\/(\d+)/);
      embedUrl = vimeoMatch
        ? `https://player.vimeo.com/video/${vimeoMatch[1]}`
        : finalUrl;
    }

    return NextResponse.json({
      originalUrl: trimmed,
      canonicalUrl: finalUrl,
      embedUrl,
      thumbnailUrl,
      title,
      provider,
      format,
    });
  } catch (err: unknown) {
    console.error("Error en /api/media/resolve:", err);
    return NextResponse.json({ error: "No se pudo resolver la URL" }, { status: 500 });
  }
}
