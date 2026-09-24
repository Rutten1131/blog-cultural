#!/bin/sh
# Muestra el detalle de la comparación, sin las líneas de proceso.
# Uso: sh scripts/ver-comparacion.sh
cd /root/whatsapp-worker || exit 1

docker exec whatsapp-worker-whatsapp-worker-1 \
  sh -c "grep -v -E '^\[Extractor\]|^\[Visión\]' /tmp/comparar.log" \
  | cut -c1-165 \
  | head -140
