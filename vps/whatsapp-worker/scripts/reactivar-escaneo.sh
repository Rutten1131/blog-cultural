#!/bin/sh
# Reactiva el escaneo de grupos, opcionalmente limpiando los datos previos.
#
# Uso:
#   sh scripts/reactivar-escaneo.sh            # reactiva y escanea lo nuevo
#   sh scripts/reactivar-escaneo.sh --limpio   # borra todo y escanea desde cero
#
# GRUPOS:
#   593987579927-1629844024@g.us  Agenda Cultural Participativa 2026
#   120363411482334109@g.us       Agenda Cultural (1)
#   120363429834864128@g.us       Agenda Cultural (2)

set -e
cd /root/whatsapp-worker

GRUPOS='593987579927-1629844024@g.us,120363411482334109@g.us,120363429834864128@g.us'

echo "=== 1. Reactivando escaneo ==="
if grep -q '^GRUPOS_SCRAPING=' .env; then
  sed -i "s|^GRUPOS_SCRAPING=.*|GRUPOS_SCRAPING=\"$GRUPOS\"|" .env
else
  printf 'GRUPOS_SCRAPING="%s"\n' "$GRUPOS" >> .env
fi
grep -E '^GRUPOS_SCRAPING=' .env

if [ "$1" = "--limpio" ]; then
  echo
  echo "=== 2. Borrando posts y registro de mensajes ==="
  docker exec whatsapp-worker-whatsapp-worker-1 node scripts/reset-scrapeo.js --confirmar
fi

echo
echo "=== 3. Reiniciando el worker ==="
# Sin silenciar stderr: ocultarlo ya nos escondió un .env roto antes.
docker compose up -d --force-recreate
sleep 8
docker logs --tail 12 whatsapp-worker-whatsapp-worker-1 2>&1
