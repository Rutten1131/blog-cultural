#!/bin/sh
# Comprueba cuántas fotos del carrusel se obtienen y cuántas lee la IA.
#
# Uso: sh scripts/diagnostico-imagenes.sh <url>
#
# Nota: el resultado del extractor incluye imágenes en base64, por eso TODA
# línea se recorta con `cut` antes de mostrarla.

URL="$1"
CONT=whatsapp-worker-whatsapp-worker-1

if [ -z "$URL" ]; then
  echo "Falta la URL."
  exit 1
fi

echo "Probando imágenes de: $URL"
echo

docker exec "$CONT" sh -c "node scripts/test-extractor.js '$URL' > /tmp/d.log 2>&1"

echo "=== IMÁGENES ==="
docker exec "$CONT" sh -c "grep -E 'Extractor\] (Imágenes|Carrusel|AVISO)' /tmp/d.log | cut -c1-170"

echo
echo "=== VISIÓN ==="
docker exec "$CONT" sh -c "grep -E 'Visi.n\]' /tmp/d.log | cut -c1-170"

echo
echo "=== ERRORES ==="
docker exec "$CONT" sh -c "grep -aiE 'error|falló|exception|status 4|status 5' /tmp/d.log | cut -c1-170 | head -10"

echo
echo "=== RESULTADO ==="
docker exec "$CONT" sh -c "sed -n '/Resumen:/,\$p' /tmp/d.log | cut -c1-170 | head -14"
