#!/bin/sh
# Verificación puntual: ¿existe la instancia "agenda-cultural"?
# Solo lectura.

URL=http://127.0.0.1:8080

KEY=$(docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^EVOLUTION_APIKEY=' | cut -d= -f2-)

if [ -z "$KEY" ]; then
  echo "No se pudo leer la key."
  exit 1
fi

echo "=== LISTA LIMPIA: una instancia por línea (nombre | estado) ==="
curl -s -H "apikey: $KEY" "$URL/instance/fetchInstances" \
  | tr '}' '\n' \
  | sed -n 's/.*"name":"\([^"]*\)".*"connectionStatus":"\([^"]*\)".*/\1 | \2/p'
echo

echo "=== ¿CUÁNTAS INSTANCIAS HAY? ==="
curl -s -H "apikey: $KEY" "$URL/instance/fetchInstances" \
  | grep -o '"name":"[^"]*"' | wc -l
echo

echo "=== ESTADO DE \"agenda-cultural\" ==="
curl -s -w "\n[HTTP %{http_code}]\n" -H "apikey: $KEY" \
  "$URL/instance/connectionState/agenda-cultural"
echo

echo "=== ¿Existe el nombre exacto en la lista? ==="
curl -s -H "apikey: $KEY" "$URL/instance/fetchInstances" \
  | grep -c '"name":"agenda-cultural"'
echo "(0 = no existe, 1+ = existe)"
