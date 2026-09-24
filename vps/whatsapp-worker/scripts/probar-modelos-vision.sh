#!/bin/sh
# Prueba varios modelos de Gemini y reporta cuáles responden.
# Uso: sh scripts/probar-modelos-vision.sh <API_KEY>

KEY="$1"
DIR=$(dirname "$0")

if [ -z "$KEY" ]; then
  echo "Falta la API key."
  exit 1
fi

MODELOS="gemini-3.8-flash gemini-3.7-flash gemini-3.6-flash gemini-3.5-flash \
gemini-3.1-flash-lite gemini-2.5-flash-lite gemini-flash-lite-latest \
gemini-flash-latest gemini-3.1-pro-preview gemini-2.5-pro gemini-pro-latest"

echo "Probando cada modelo con una consulta de texto mínima."
echo "======================================================="

for M in $MODELOS; do
  RESPUESTA=$(curl -s -w "|%{http_code}" \
    -X POST "https://generativelanguage.googleapis.com/v1beta/models/$M:generateContent" \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $KEY" \
    -d @"$DIR/payload-gemini.json")

  CODIGO=$(printf '%s' "$RESPUESTA" | rev | cut -d'|' -f1 | rev)

  case "$CODIGO" in
    200) ESTADO="✅ DISPONIBLE" ;;
    503) ESTADO="⏳ saturado (reintentar)" ;;
    404) ESTADO="🚫 no disponible para esta key" ;;
    *)   ESTADO="⚠️  HTTP $CODIGO" ;;
  esac

  printf '%-32s %s\n' "$M" "$ESTADO"
done
