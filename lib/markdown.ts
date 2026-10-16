import { marked } from 'marked';

// Configuración de marked para que genere HTML semántico y limpio
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Helper para generar el HTML del iframe o reproductor responsivo a partir de una URL
export function getVideoEmbedHtml(videoUrl: string): string {
  if (!videoUrl) return '';

  // YouTube
  const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `
      <div class="my-8 rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-black aspect-video relative w-full">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0"
          title="Video de YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          class="absolute inset-0 w-full h-full border-0"
        ></iframe>
      </div>
    `;
  }

  // Vimeo
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `
      <div class="my-8 rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-black aspect-video relative w-full">
        <iframe
          src="https://player.vimeo.com/video/${vimeoMatch[1]}"
          title="Video de Vimeo"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          class="absolute inset-0 w-full h-full border-0"
        ></iframe>
      </div>
    `;
  }

  // MP4 directo
  if (videoUrl.match(/\.(mp4|webm)($|\?)/i)) {
    return `
      <div class="my-8 rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-black w-full">
        <video controls playsinline preload="metadata" class="w-full h-auto max-h-[500px]">
          <source src="${videoUrl}" type="video/mp4" />
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    `;
  }

  return '';
}

// Helper para transformar enlaces de video sueltos en reproductores responsivos
function parseVideos(content: string): string {
  // 1. YouTube
  const ytRegex = /(?:<p>\s*)?(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s<>"']*)?(?:\s*<\/p>)?/gi;
  let processed = content.replace(ytRegex, (match, videoId) => {
    if (match.includes('src=') || match.includes('href=')) return match;
    return `<div class="my-8 rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-black aspect-video relative w-full max-w-3xl mx-auto"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0" title="Video de YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="absolute inset-0 w-full h-full border-0"></iframe></div>`;
  });

  // 2. Vimeo
  const vimeoRegex = /(?:<p>\s*)?(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)(?:[^\s<>"']*)?(?:\s*<\/p>)?/gi;
  processed = processed.replace(vimeoRegex, (match, videoId) => {
    if (match.includes('src=') || match.includes('href=')) return match;
    return `<div class="my-8 rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-black aspect-video relative w-full max-w-3xl mx-auto"><iframe src="https://player.vimeo.com/video/${videoId}" title="Video de Vimeo" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full border-0"></iframe></div>`;
  });

  // 3. MP4 / WebM directo
  const mp4Regex = /(?:<p>\s*)?(https?:\/\/[^\s<>"']+\.(?:mp4|webm)(?:\?[^\s<>"']*)?)(?:\s*<\/p>)?/gi;
  processed = processed.replace(mp4Regex, (match, videoUrl) => {
    if (match.includes('src=') || match.includes('href=')) return match;
    return `<div class="my-8 rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-black w-full max-w-3xl mx-auto"><video controls playsinline preload="metadata" class="w-full h-auto max-h-[540px] block"><source src="${videoUrl}" type="video/mp4" />Tu navegador no soporta la reproducción de video.</video></div>`;
  });

  return processed;
}

/**
 * Convierte texto (Markdown o HTML existente) en HTML limpio y semántico.
 * Detecta e inserta reproductores de video responsivos (YouTube, Vimeo, MP4 directos).
 */
export function renderContent(content: string): string {
  if (!content) return '';

  try {
    const withVideos = parseVideos(content);
    const rawHtml = marked.parse(withVideos);
    return typeof rawHtml === 'string' ? rawHtml : String(rawHtml);
  } catch (err) {
    console.error('Error renderizando markdown:', err);
    return content;
  }
}
