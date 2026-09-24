#!/bin/sh
# Arregla la línea rota de DEBUG_IMAGENES en .env y recrea el contenedor.
set -e
cd /root/whatsapp-worker

cp .env ".env.bak.$(date +%s)"

# Dejar la variable limpia (una barra invertida suelta rompía el archivo).
sed -i 's/^DEBUG_IMAGENES=.*/DEBUG_IMAGENES="false"/' .env

echo "--- .env ---"
grep -n 'DEBUG_IMAGENES\|MAX_FOTOS' .env

echo
echo "--- compose ---"
docker compose config >/dev/null && echo "docker-compose.yml: OK"

echo
docker compose up -d

echo
sleep 5
docker exec whatsapp-worker-whatsapp-worker-1 env | grep -i MAX_FOTOS
