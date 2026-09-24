#!/bin/sh
# SOLO LECTURA: estado actual de la instancia cesar-comercial.

URL=http://127.0.0.1:8080
INST=cesar-comercial

KEY=$(docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^EVOLUTION_APIKEY=' | cut -d= -f2-)

echo "=== ESTADO DE $INST ==="
curl -s -w "\n[HTTP %{http_code}]\n" -H "apikey: $KEY" "$URL/instance/connectionState/$INST"
echo

echo "=== WEBHOOK ACTUAL DE $INST ==="
curl -s -w "\n[HTTP %{http_code}]\n" -H "apikey: $KEY" "$URL/webhook/find/$INST" | head -c 900
echo

echo "=== CONFIG DE $INST (grupos / ignores) ==="
curl -s -H "apikey: $KEY" "$URL/instance/fetchInstances" \
  | tr '}' '\n' | grep -E '"name":"cesar-comercial"' \
  | grep -oE '"(groupsIgnore|readMessages|readStatus|alwaysOnline|syncFullHistory|msgCall|rejectCall)":(true|false)'
echo

echo "=== GRUPOS VISIBLES EN $INST ==="
curl -s -w "\n[HTTP %{http_code}]\n" -H "apikey: $KEY" "$URL/group/fetchAllGroups/$INST?getParticipants=false" | head -c 2500
echo
