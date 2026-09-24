#!/bin/sh
# Lista los nombres de las instancias de Evolution API (solo lectura).

URL=http://127.0.0.1:8080

KEY=$(docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^EVOLUTION_APIKEY=' | cut -d= -f2-)

if [ -z "$KEY" ]; then
  echo "No se pudo leer la key del bot."
  exit 1
fi

echo "=== CAMPOS DISPONIBLES EN LA RESPUESTA ==="
curl -s -H "apikey: $KEY" "$URL/instance/fetchInstances" \
  | tr ',' '\n' | grep -oE '"[a-zA-Z]+":' | sort -u | tr -d '":'
echo

echo "=== NOMBRES DE INSTANCIA Y ESTADO ==="
curl -s -H "apikey: $KEY" "$URL/instance/fetchInstances" \
  | tr '{' '\n' | grep -oE '"name":"[^"]*"|"connectionStatus":"[^"]*"' | sed 's/"name"://; s/"connectionStatus"://'
echo

echo "=== WEBHOOKS CONFIGURADOS (todas las instancias) ==="
for INST in $(curl -s -H "apikey: $KEY" "$URL/instance/fetchInstances" \
    | tr '{' '\n' | grep -oE '"name":"[^"]*"' | cut -d: -f2 | tr -d '"'); do
  echo "--- $INST ---"
  curl -s -H "apikey: $KEY" "$URL/webhook/find/$INST" | head -c 400
  echo
done
