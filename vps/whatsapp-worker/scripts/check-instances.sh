#!/bin/sh
# Consulta de SOLO LECTURA a Evolution API usando la key del bot existente.
# No modifica webhooks ni envía mensajes.

URL=http://127.0.0.1:8080

BOT_KEY=$(docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^EVOLUTION_APIKEY=' | cut -d= -f2-)

if [ -z "$BOT_KEY" ]; then
  echo "No se pudo leer la key del bot."
  exit 1
fi

echo "=== INSTANCIAS EN EVOLUTION (key del bot) ==="
curl -s -H "apikey: $BOT_KEY" "$URL/instance/fetchInstances" \
  | grep -o '"instanceName":"[^"]*"' | sed 's/"instanceName"://' | sort -u
echo

echo "=== ESTADOS DE CONEXION ==="
curl -s -H "apikey: $BOT_KEY" "$URL/instance/fetchInstances" \
  | grep -o '"connectionStatus":"[^"]*"' | sed 's/"connectionStatus"://' | sort -u
echo

echo "=== WEBHOOK ACTUAL DE LA INSTANCIA agenda-cultural ==="
curl -s -w "\n[HTTP %{http_code}]\n" -H "apikey: $BOT_KEY" \
  "$URL/webhook/find/agenda-cultural" | head -c 1500
echo

echo "=== ¿La key del worker sirve? ==="
WORKER_KEY=$(grep -E '^EVOLUTION_API_KEY' /root/whatsapp-worker/.env | cut -d= -f2- | tr -d '"')
curl -s -o /dev/null -w "worker key → HTTP %{http_code}\n" -H "apikey: $WORKER_KEY" \
  "$URL/instance/fetchInstances"
curl -s -o /dev/null -w "bot key    → HTTP %{http_code}\n" -H "apikey: $BOT_KEY" \
  "$URL/instance/fetchInstances"
