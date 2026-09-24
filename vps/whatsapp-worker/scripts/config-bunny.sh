#!/bin/sh
# Añade las credenciales de Bunny CDN al .env del worker.
#
# Son las MISMAS que ya usa el proyecto Next.js (están en su .env),
# necesarias para re-alojar las imágenes de Facebook/Instagram que caducan.
#
# Uso:  sh scripts/config-bunny.sh "zona" "api_key" "pull_zone_url"

set -e

ENV=/root/whatsapp-worker/.env

ZONA="$1"
CLAVE="$2"
PULL="$3"

if [ -z "$ZONA" ] || [ -z "$CLAVE" ] || [ -z "$PULL" ]; then
  echo "Uso: sh scripts/config-bunny.sh \"zona\" \"api_key\" \"pull_zone_url\""
  exit 1
fi

cp "$ENV" "$ENV.bak.$(date +%s)"
echo "Copia de seguridad creada."

TMP=$(mktemp)
grep -vE '^(BUNNY_STORAGE_ZONE|BUNNY_API_KEY|BUNNY_PULL_ZONE_URL|REHOSPEDAR_IMAGENES)=' "$ENV" > "$TMP"

{
  printf 'BUNNY_STORAGE_ZONE="%s"\n' "$ZONA"
  printf 'BUNNY_API_KEY="%s"\n' "$CLAVE"
  printf 'BUNNY_PULL_ZONE_URL="%s"\n' "$PULL"
  printf '%s\n' 'REHOSPEDAR_IMAGENES="true"'
} >> "$TMP"

mv "$TMP" "$ENV"

echo
echo "Aplicado (key enmascarada):"
grep -E '^(BUNNY_STORAGE_ZONE|BUNNY_PULL_ZONE_URL|REHOSPEDAR_IMAGENES)=' "$ENV"
grep -E '^BUNNY_API_KEY=' "$ENV" | sed -E 's/="(.{8}).*"/="\1..."/'
