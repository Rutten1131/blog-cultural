#!/bin/sh
# Espera a que el escaneo actual termine y muestra el resultado.
#
# Uso: sh scripts/esperar-escaneo.sh [minutos_maximo]
#
# El worker recorre 3 grupos; cada uno imprime una línea
#   [Scanner] <jid>: N nuevos, M con enlaces, K posts
# Cuando aparecen las 3, el escaneo terminó.

CONT=whatsapp-worker-whatsapp-worker-1
LIMITE=${1:-20}
ESPERADOS=3
vueltas=$((LIMITE * 6))   # cada vuelta son 10 segundos

echo "Esperando a que terminen los $ESPERADOS grupos (máximo $LIMITE min)..."
echo

i=0
while [ "$i" -lt "$vueltas" ]; do
  hechos=$(docker logs "$CONT" 2>&1 | grep -cE '^\[Scanner\] .*: [0-9]+ nuevos' || true)

  if [ "$hechos" -ge "$ESPERADOS" ]; then
    echo "Escaneo terminado ($hechos grupos)."
    break
  fi

  # Señal de vida: cuántos se llevan y en qué anda ahora.
  printf '\r  %2d/%d grupos listos...' "$hechos" "$ESPERADOS"

  i=$((i + 1))
  sleep 10
done

echo
echo
echo "=== RESUMEN DEL ESCANEO ==="
docker logs "$CONT" 2>&1 | grep -E '^\[Scanner\] .*: [0-9]+ nuevos|^\[Scanner\]   error:' | cut -c1-160

echo
echo "=== POSTS CREADOS ==="
docker logs "$CONT" 2>&1 | grep -cE '^\[Scanner\] .*: [0-9]+ nuevos' >/dev/null
docker exec "$CONT" node scripts/resumen-posts.js 2>&1 | cut -c1-150 | head -25
