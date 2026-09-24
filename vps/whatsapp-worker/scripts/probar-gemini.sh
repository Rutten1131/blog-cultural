#!/bin/sh
# Diagnóstico: probar la API de Gemini con curl para ver la respuesta cruda.
# Uso: sh scripts/probar-gemini.sh <API_KEY>

KEY="$1"

if [ -z "$KEY" ]; then
  echo "Falta la API key. Uso: sh scripts/probar-gemini.sh <API_KEY>"
  exit 1
fi

DIR=$(dirname "$0")

echo "=== 1. v1beta / gemini-3.6-flash ==="
curl -s -w "\n[HTTP %{http_code}]\n" \
  -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: $KEY" \
  -d @"$DIR/payload-gemini.json" | head -c 700
echo

echo "=== 2. v1beta / gemini-3.5-flash ==="
curl -s -w "\n[HTTP %{http_code}]\n" \
  -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: $KEY" \
  -d @"$DIR/payload-gemini.json" | head -c 700
echo

echo "=== 3. v1beta / gemini-flash-latest ==="
curl -s -w "\n[HTTP %{http_code}]\n" \
  -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: $KEY" \
  -d @"$DIR/payload-gemini.json" | head -c 700
echo
