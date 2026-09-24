#!/bin/sh
# Inspección de SOLO LECTURA del bot existente "agenda-cultural-bot".
# Muestra nombres de variables y huellas cortas (no valores secretos).

echo "=== 1. Ubicación del proyecto (labels de compose) ==="
docker inspect agenda-cultural-bot \
  --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null
docker inspect agenda-cultural-bot \
  --format '{{ index .Config.Labels "com.docker.compose.project" }}' 2>/dev/null
echo

echo "=== 2. Imagen y comando ==="
docker inspect agenda-cultural-bot --format 'Image: {{.Config.Image}}' 2>/dev/null
docker inspect agenda-cultural-bot --format 'Cmd:   {{.Config.Cmd}}' 2>/dev/null
docker inspect agenda-cultural-bot --format 'Entrypoint: {{.Config.Entrypoint}}' 2>/dev/null
echo

echo "=== 3. Nombres de variables de entorno (sin valores) ==="
docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | cut -d= -f1 | sort
echo

echo "=== 4. ¿La EVOLUTION_API_KEY del bot es la misma que la del worker? ==="
BOT_KEY=$(docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^EVOLUTION_API_KEY=' | cut -d= -f2-)
WORKER_KEY=$(grep -E '^EVOLUTION_API_KEY' /root/whatsapp-worker/.env | cut -d= -f2- | tr -d '"')

if [ -z "$BOT_KEY" ]; then
  echo "El bot NO tiene EVOLUTION_API_KEY en sus variables."
else
  echo "Huella bot    : $(printf '%s' "$BOT_KEY" | md5sum | cut -c1-8)"
  echo "Huella worker : $(printf '%s' "$WORKER_KEY" | md5sum | cut -c1-8)"
  if [ "$BOT_KEY" = "$WORKER_KEY" ]; then
    echo "=> SON LA MISMA key"
  else
    echo "=> SON DISTINTAS"
  fi
fi
echo

echo "=== 5. ¿Qué instancia usa el bot? ==="
docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -iE 'INSTANCE|EVOLUTION.*URL|PORT|WEBHOOK' | sed -E 's/(KEY|TOKEN|SECRET)=.*/\1=***/' 
echo

echo "=== 6. Últimas líneas del log del bot ==="
docker logs --tail 15 agenda-cultural-bot 2>&1
