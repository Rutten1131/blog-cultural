#!/bin/sh
# Configura las keys de Gemini y los modelos en cascada en el .env del worker.
#
# Uso:
#   sh scripts/config-gemini.sh "key1,key2"
#
# Las keys deben ser de PROYECTOS DISTINTOS de Google: varias keys del mismo
# proyecto comparten el mismo cupo y no sirven como respaldo.

set -e

ENV=/root/whatsapp-worker/.env

KEYS="$1"

if [ -z "$KEYS" ]; then
  echo "Falta la lista de keys."
  echo 'Uso: sh scripts/config-gemini.sh "key1,key2"'
  exit 1
fi

cp "$ENV" "$ENV.bak.$(date +%s)"
echo "Copia de seguridad creada."

TMP=$(mktemp)
grep -vE '^(GEMINI_API_KEYS|GEMINI_MODELOS|MAX_FOTOS_AFICHE)=' "$ENV" > "$TMP"

{
  printf 'GEMINI_API_KEYS="%s"\n' "$KEYS"
  # Orden de preferencia. Verificado 2026-09-24: el flash-lite es el más
  # estable con imágenes; los "flash" daban 503 seguido.
  printf '%s\n' 'GEMINI_MODELOS="gemini-flash-lite-latest,gemini-3.6-flash,gemini-flash-latest,gemini-3.5-flash"'
  printf '%s\n' 'MAX_FOTOS_AFICHE="6"'
} >> "$TMP"

mv "$TMP" "$ENV"

echo
echo "Configurado (keys enmascaradas):"
grep -E '^(GEMINI_MODELOS|MAX_FOTOS_AFICHE)=' "$ENV"
grep -E '^GEMINI_API_KEYS=' "$ENV" | sed -E 's/(AQ\.[A-Za-z0-9]{6})[^,"]*/\1…/g'
