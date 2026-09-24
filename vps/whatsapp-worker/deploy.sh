#!/bin/bash
# deploy-whatsapp-worker.sh
# Script para desplegar el worker de WhatsApp en el VPS

set -e

VPS_DIR="/root/whatsapp-worker"
LOCAL_DIR="vps/whatsapp-worker"
VPS_HOST="178.238.238.158"
SSH_KEY="$HOME/.ssh/vps_agenda_key"

echo "=== Deploy WhatsApp Worker ==="

# 1. Subir archivos al VPS
echo "Subiendo archivos al VPS..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r "$LOCAL_DIR" root@$VPS_HOST:$VPS_DIR

# 2. Entrar al VPS y construir
echo "Construyendo contenedor en el VPS..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@$VPS_HOST << 'EOF'
cd /root/whatsapp-worker

# Parar contenedor existente si está corriendo
docker-compose down 2>/dev/null || true

# Construir imagen
docker-compose build --no-cache

# Levantar contenedor
docker-compose up -d

# Verificar estado
echo "=== Estado del contenedor ==="
docker ps --filter "name=whatsapp-worker" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar health check
echo "=== Health check ==="
sleep 5
curl -s http://localhost:8083/health || echo "Health check falló"
EOF

echo "=== Deploy completado ==="