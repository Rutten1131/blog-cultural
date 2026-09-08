/**
 * Utilidades para parsear y renderizar videos embebidos de redes sociales (FB, IG, TikTok, YouTube, Vimeo)
 * y páginas web.
 */

export interface VideoEmbedInfo {
  provider: "facebook" | "instagram" | "tiktok" | "youtube" | "vimeo" | "web";
  embedUrl: string;
  originalUrl: string;
  format: "vertical" | "horizontal"; // Reel/TikTok/Short = vertical (9:16)
  thumbnailUrl?: string; // Miniatura directa si es posible extraerla
  title?: string;
}

/**
 * Normaliza y analiza cualquier URL de video o red social:
 * - Facebook: soporta enlaces de compartir (share/r/, share/v/, share/p/), reels directos, watch y videos de páginas.
 * - Instagram: reels, posts, tv, share links.
 * - TikTok: videos directos, links cortos (vm.tiktok.com, vt.tiktok.com).
 * - YouTube: videos normales, shorts, youtu.be, embeds.
 * - Vimeo.
 * - Web general: enlaces normales o páginas externas.
 */
export function parseVideoUrl(url: string): VideoEmbedInfo | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. YouTube (Shorts vs Normal / Share Links)
  const isYtShort = trimmed.includes("/shorts/");
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      originalUrl: trimmed,
      format: isYtShort ? "vertical" : "horizontal",
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      title: isYtShort ? "YouTube Short" : "YouTube Video",
    };
  }

  // 2. TikTok (Formato vertical / Reel)
  const isTikTok = trimmed.includes("tiktok.com");
  if (isTikTok) {
    const ttMatch = trimmed.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/|embed\/)?(\d+)/);
    const videoId = ttMatch ? ttMatch[1] : "";
    return {
      provider: "tiktok",
      embedUrl: videoId
        ? `https://www.tiktok.com/embed/v2/${videoId}`
        : trimmed,
      originalUrl: trimmed,
      format: "vertical",
      title: "TikTok Video",
    };
  }

  // 3. Instagram (Reels / Posts / Share)
  if (trimmed.includes("instagram.com")) {
    const isReel = trimmed.includes("/reel/") || trimmed.includes("/reels/");
    // Extraer código base del reel/post para embed limpio
    const cleanUrl = trimmed.split("?")[0].replace(/\/$/, "");
    return {
      provider: "instagram",
      embedUrl: `${cleanUrl}/embed`,
      originalUrl: trimmed,
      format: "vertical",
      title: isReel ? "Instagram Reel" : "Instagram Post",
    };
  }

  // 4. Facebook (FB Watch, Share Links 'share/r/', Reels, Videos, etc.)
  if (
    trimmed.includes("facebook.com") ||
    trimmed.includes("fb.watch") ||
    trimmed.includes("fb.gg")
  ) {
    const isFbReel =
      trimmed.includes("/reel/") ||
      trimmed.includes("/reels/") ||
      trimmed.includes("/share/r/");

    // Extraer enlace canónico de Facebook para el plugin oficial de iframe
    const encodedUrl = encodeURIComponent(trimmed);
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=560`,
      originalUrl: trimmed,
      format: isFbReel ? "vertical" : "horizontal",
      title: isFbReel ? "Facebook Reel" : "Facebook Video",
    };
  }

  // 5. Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      originalUrl: trimmed,
      format: "horizontal",
      title: "Vimeo Video",
    };
  }

  // 6. Enlace web genérico válido
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return {
        provider: "web",
        embedUrl: trimmed,
        originalUrl: trimmed,
        format: "horizontal",
        title: parsed.hostname.replace(/^www\./, ""),
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Parsea un campo videoUrl que puede contener una única URL, una lista separada por comas
 * o un JSON stringified array de URLs. Devuelve siempre un string[].
 */
export function extractVideoUrls(input: string | string[] | null | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter((u) => typeof u === "string" && u.trim().length > 0);
  }

  const trimmed = input.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((u) => typeof u === "string" && u.trim().length > 0);
      }
    } catch {
      // Si falla JSON.parse continúa con split
    }
  }

  // Dividir por saltos de línea o comas
  return trimmed
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0);
}
