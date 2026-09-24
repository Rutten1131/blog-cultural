#!/bin/sh
# Prueba el extractor completo (con visión artificial) sobre una URL real.
#
# Uso: sh scripts/probar-vision-real.sh <url>

URL="$1"
CONT=whatsapp-worker-whatsapp-worker-1

if [ -z "$URL" ]; then
  echo "Falta la URL."
  exit 1
fi

echo "Probando: $URL"
echo "(puede tardar ~1 minuto: navega la página y consulta a Gemini)"

docker exec "$CONT" sh -c "node scripts/test-extractor.js '$URL' > /tmp/t.log 2>&1"

echo
echo "=== PROCESO ==="
docker exec "$CONT" grep -E "Extractor|Visi.n|AVISO" /tmp/t.log | head -12

echo
echo "=== RESULTADO ==="
docker exec "$CONT" sed -n '/Resumen:/,$p' /tmp/t.log | head -14

echo
echo "=== FUENTES DE CADA DATO ==="
docker exec "$CONT" grep -A8 '"fuentes"' /tmp/t.log | head -12
