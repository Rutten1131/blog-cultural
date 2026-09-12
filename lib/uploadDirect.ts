/**
 * Utilidad unificada para subir archivos DIRECTO del navegador a Bunny.net CDN
 * Esto evita al 100% el límite de 4.5MB de Vercel Serverless Functions.
 */
export async function uploadDirectToBunny(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  // 1. Obtener los parámetros de subida directa (Vercel solo devuelve un pequeño JSON con la URL de destino)
  const metaRes = await fetch("/api/upload/direct-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  });

  if (!metaRes.ok) {
    const errData = await metaRes.json().catch(() => ({}));
    throw new Error(errData.error || "No se pudo obtener autorización de subida");
  }

  const { uploadEndpoint, publicUrl, accessKey, contentType } = await metaRes.json();

  // 2. Subir directamente el binario desde el navegador a storage.bunnycdn.com vía XMLHttpRequest o Fetch
  // Usamos XMLHttpRequest para poder reportar progreso y soportar archivos pesados
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadEndpoint, true);
    xhr.setRequestHeader("AccessKey", accessKey);
    xhr.setRequestHeader("Content-Type", contentType || "application/octet-stream");

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(publicUrl);
      } else {
        reject(new Error(`Bunny.net respondió con error: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      // Fallback: Si Bunny.net da error de CORS directo desde el navegador en ciertos orígenes,
      // podemos hacer fallback inmediato al endpoint optimizador de Vercel
      reject(new Error("Error de conexión directa con Bunny.net"));
    };

    xhr.send(file);
  });
}
