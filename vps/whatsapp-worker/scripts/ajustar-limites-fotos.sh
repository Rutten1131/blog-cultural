#!/bin/sh
# Ajusta los límites de fotos en .env y docker-compose.yml.
set -e
cd /root/whatsapp-worker

cp .env ".env.bak.$(date +%s)"
cp docker-compose.yml "docker-compose.yml.bak.$(date +%s)"

# Límite de fotos que se mandan a la IA.
sed -i 's/^MAX_FOTOS_AFICHE=.*/MAX_FOTOS_AFICHE="10"/' .env

# Quitar la línea rota que quedó de un intento anterior.
sed -i '/MAX_FOTOS_CARRUSEL=/d' docker-compose.yml

# Insertar la variable nueva justo después de MAX_FOTOS_AFICHE.
awk '
  /- MAX_FOTOS_AFICHE=/ {
    print
    match($0, /^ */)
    print substr($0, 1, RLENGTH) "- MAX_FOTOS_CARRUSEL=${MAX_FOTOS_CARRUSEL:-10}"
    next
  }
  { print }
' docker-compose.yml > docker-compose.yml.tmp
mv docker-compose.yml.tmp docker-compose.yml

echo "--- .env ---"
grep -n 'MAX_FOTOS' .env
echo "--- docker-compose.yml ---"
grep -n -B1 -A2 'MAX_FOTOS' docker-compose.yml
