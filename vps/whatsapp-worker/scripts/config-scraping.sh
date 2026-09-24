#!/bin/sh
# Configura SOLO LECTURA del worker para escanear los grupos de agenda cultural.
#
# - Copia la API key válida de Evolution (desde el bot existente).
# - Apunta el worker a la instancia "cesar-comercial".
# - Registra los grupos a escanear.
#
# NO toca el webhook de ninguna instancia.

set -e

ENV=/root/whatsapp-worker/.env

KEY=$(docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^EVOLUTION_APIKEY=' | cut -d= -f2-)

if [ -z "$KEY" ]; then
  echo "ERROR: no se pudo obtener la API key válida."
  exit 1
fi

# Copia de seguridad antes de tocar nada.
cp "$ENV" "$ENV.bak.$(date +%s)"
echo "Copia de seguridad creada."

TMP=$(mktemp)

# Quitar las variables que vamos a redefinir.
grep -vE '^(EVOLUTION_API_KEY|EVOLUTION_INSTANCE|GRUPOS_SCRAPING|SCRAPE_INTERVALO_MIN|SCRAPE_PAGINAS)=' \
  "$ENV" > "$TMP"

{
  printf 'EVOLUTION_API_KEY="%s"\n' "$KEY"
  printf '%s\n' 'EVOLUTION_INSTANCE="cesar-comercial"'
  printf '%s\n' 'GRUPOS_SCRAPING="593987579927-1629844024@g.us,120363411482334109@g.us,120363429834864128@g.us"'
  printf '%s\n' 'SCRAPE_INTERVALO_MIN="15"'
  printf '%s\n' 'SCRAPE_PAGINAS="1"'
} >> "$TMP"

mv "$TMP" "$ENV"

echo
echo "Variables aplicadas (key enmascarada):"
grep -E '^(EVOLUTION_INSTANCE|GRUPOS_SCRAPING|SCRAPE_INTERVALO_MIN|SCRAPE_PAGINAS)=' "$ENV"
grep -E '^EVOLUTION_API_KEY=' "$ENV" | sed -E 's/="(.{6}).*"/="\1..."/'
