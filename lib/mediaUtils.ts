/**
 * Utilidades para parsear y renderizar videos embebidos de redes sociales (FB, IG, TikTok, YouTube, Vimeo)
 */

export interface VideoEmbedInfo {
  provider: "facebook" | "instagram" | "tiktok" | "youtube" | "vimeo" | "unknown";
  embedUrl: string;
  originalUrl: string;
  format: "vertical" | "horizontal"; // Permite ajustar el marco/aspect ratio (reel/short/tiktok = vertical 9:16)
}

export function parseVideoUrl(url: string): VideoEmbedInfo | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // 1. YouTube (Shorts vs Normal / Share Links)
  const isYtShort = trimmed.includes("/shorts/");
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      originalUrl: trimmed,
      format: isYtShort ? "vertical" : "horizontal",
    };
  }

  // 2. TikTok (Siempre formato vertical / Reel)
  const ttMatch = trimmed.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/|embed\/)?(\d+)/);
  if (ttMatch || trimmed.includes("tiktok.com")) {
    const videoId = ttMatch ? ttMatch[1] : "";
    return {
      provider: "tiktok",
      embedUrl: videoId
        ? `https://www.tiktok.com/embed/v2/${videoId}`
        : trimmed,
      originalUrl: trimmed,
      format: "vertical",
    };
  }

  // 3. Instagram (Reels / Posts / Share)
  if (trimmed.includes("instagram.com")) {
    const isReel = trimmed.includes("/reel/") || trimmed.includes("/reels/");
    const cleanUrl = trimmed.split("?")[0].replace(/\/$/, "");
    return {
      provider: "instagram",
      embedUrl: `${cleanUrl}/embed`,
      originalUrl: trimmed,
      format: isReel ? "vertical" : "vertical", // La gran mayoría de contenido multimedia en IG es vertical/cuadrado
    };
  }

  // 4. Facebook (FB Watch, Share Links, Reels, Videos)
  if (
    trimmed.includes("facebook.com") ||
    trimmed.includes("fb.watch") ||
    trimmed.includes("fb.gg") ||
    trimmed.includes("share")
  ) {
    const isFbReel = trimmed.includes("/reel/") || trimmed.includes("/reels/");
    const encodedUrl = encodeURIComponent(trimmed);
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=560`,
      originalUrl: trimmed,
      format: isFbReel ? "vertical" : "horizontal",
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
    };
  }

  return null;
}
