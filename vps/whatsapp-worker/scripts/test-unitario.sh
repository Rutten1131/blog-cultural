#!/bin/sh
# Ejecuta las pruebas unitarias del extractor SIN que el bot escanee.
#
# Desactiva temporalmente GRUPOS_SCRAPING, levanta el contenedor, corre las
# pruebas y deja instrucciones para reactivar el escaneo.
#
# Uso: sh scripts/test-unitario.sh

set -e
cd /root/whatsapp-worker

echo "=== 1. Desactivando el escaneo temporalmente ==="
sed -i 's|^GRUPOS_SCRAPING=.*|GRUPOS_SCRAPING=""|' .env
grep -E '^GRUPOS_SCRAPING=' .env

echo
echo "=== 2. Levantando el contenedor (sin escanear) ==="
docker compose up -d >/dev/null 2>&1
sleep 8

echo
echo "=== 3. Pruebas unitarias ==="
docker exec whatsapp-worker-whatsapp-worker-1 node scripts/test-extractor.js 2>&1 | tail -32

echo
echo "=== 4. ¿El bot quedó sin escanear? ==="
docker logs --tail 6 whatsapp-worker-whatsapp-worker-1 2>&1

echo
echo "Listo. El escaneo sigue DESACTIVADO."
echo "Para reactivarlo: sh scripts/reactivar-escaneo.sh"
