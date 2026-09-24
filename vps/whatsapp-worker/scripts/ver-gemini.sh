#!/bin/sh
# Comprueba si la key de Gemini (la que usa agenda-cultural-bot) sirve y
# qué modelos de VISIÓN ofrece. Solo lectura: lista modelos, no genera nada.

KEY=$(docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^GEMINI_API_KEY=' | cut -d= -f2-)

if [ -z "$KEY" ]; then
  echo "No se encontró GEMINI_API_KEY en agenda-cultural-bot."
  exit 1
fi

echo "Key encontrada: sí (${#KEY} caracteres)"
echo

echo "=== ¿RESPONDE LA API DE GEMINI? ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  "https://generativelanguage.googleapis.com/v1beta/models?key=$KEY"

echo
echo "=== MODELOS QUE ACEPTAN IMÁGENES ==="
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$KEY" \
  | tr '{' '\n' \
  | grep -E '"name":\s*"models/.*(flash|pro)' \
  | grep -oE '"name":\s*"models/[^"]*"' \
  | sed 's/"name":\s*"models\///; s/"$//' \
  | sort
