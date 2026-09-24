#!/bin/sh
# Lista los modelos de Groq disponibles, marcando los que aceptan IMÁGENES.
# Solo lectura: no genera nada ni gasta tokens.

ENV_FILE=/root/whatsapp-worker/.env

KEY=$(grep -E '^GROQ_API_KEY' "$ENV_FILE" | cut -d= -f2- | tr -d '"')

if [ -z "$KEY" ]; then
  echo "No se encontró GROQ_API_KEY en $ENV_FILE"
  exit 1
fi

echo "=== MODELOS DISPONIBLES EN GROQ ==="
curl -s -H "Authorization: Bearer $KEY" https://api.groq.com/openai/v1/models \
  | tr ',' '\n' \
  | grep -oE '"id":"[^"]*"' \
  | sed 's/"id"://' \
  | tr -d '"' \
  | sort
