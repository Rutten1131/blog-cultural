#!/bin/sh
# SOLO LECTURA: probar si se pueden leer mensajes de un grupo por API.
# No envía nada ni modifica el webhook existente.

URL=http://127.0.0.1:8080
INST=cesar-comercial
JID='593987579927-1629844024@g.us'

KEY=$(docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^EVOLUTION_APIKEY=' | cut -d= -f2-)

echo "=== POST /chat/findMessages/$INST ==="
curl -s -w "\n[HTTP %{http_code}]\n" \
  -X POST "$URL/chat/findMessages/$INST" \
  -H "apikey: $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"where\":{\"key\":{\"remoteJid\":\"$JID\"}},\"page\":1,\"offset\":3}" \
  | head -c 3000
echo
