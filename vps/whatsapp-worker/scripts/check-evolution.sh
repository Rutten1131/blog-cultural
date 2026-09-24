#!/bin/sh
# Inspección de SOLO LECTURA de Evolution API.
# No envía mensajes ni modifica configuraciones.
# Se ejecuta en el HOST del VPS.

ENV_FILE=/root/whatsapp-worker/.env
API_URL=http://127.0.0.1:8080

KEY=$(grep -E '^EVOLUTION_API_KEY' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
INSTANCIA=$(grep -E '^EVOLUTION_INSTANCE' "$ENV_FILE" | cut -d= -f2- | tr -d '"')

echo "Instancia configurada en el worker : $INSTANCIA"
echo "Largo de la API key leida          : ${#KEY} caracteres"
echo

echo "=== 1. ¿Responde Evolution? (código HTTP) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" "$API_URL/"
echo

echo "=== 2. fetchInstances (con apikey) ==="
curl -s -w "\n[HTTP %{http_code}]\n" -H "apikey: $KEY" \
  "$API_URL/instance/fetchInstances" | head -c 2000
echo

echo "=== 3. Nombres de instancias ==="
curl -s -H "apikey: $KEY" "$API_URL/instance/fetchInstances" \
  | grep -o '"instanceName":"[^"]*"' | sed 's/"instanceName"://' | sort -u
echo

echo "=== 4. Webhook de la instancia del worker ==="
curl -s -w "\n[HTTP %{http_code}]\n" -H "apikey: $KEY" \
  "$API_URL/webhook/find/$INSTANCIA" | head -c 1200
echo
