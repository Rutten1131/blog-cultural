#!/bin/sh
# Desactiva el escaneo (el worker sigue arriba, pero no captura nada).
# Útil para correr pruebas sin que el bot ensucie la base.

set -e
cd /root/whatsapp-worker

echo "=== Desactivando escaneo ==="
if grep -q '^GRUPOS_SCRAPING=' .env; then
  sed -i "s|^GRUPOS_SCRAPING=.*|GRUPOS_SCRAPING=\"\"|" .env
else
  printf '%s\n' 'GRUPOS_SCRAPING=""' >> .env
fi
grep -E '^GRUPOS_SCRAPING=' .env

docker compose up -d --force-recreate >/dev/null 2>&1
sleep 8
docker logs --tail 3 whatsapp-worker-whatsapp-worker-1 2>&1
