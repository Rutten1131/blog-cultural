# deploy.ps1 — Script para desplegar el worker de WhatsApp en el VPS
# Uso: .\deploy.ps1

$ErrorActionPreference = "Continue"
$keyPath = "$env:USERPROFILE\.ssh\vps_agenda_key"
$VPS_HOST = "178.238.238.158"
$VPS_DIR = "/root/whatsapp-worker"
$LOCAL_DIR = "vps\whatsapp-worker"

Write-Host "=== Deploy WhatsApp Worker ===" -ForegroundColor Cyan

# Verificar que la key existe
if (-not (Test-Path $keyPath)) {
    Write-Host "ERROR: No se encontró la key SSH en $keyPath" -ForegroundColor Red
    exit 1
}

# Subir archivos al VPS
Write-Host "Subiendo archivos al VPS..." -ForegroundColor Yellow
scp -i $keyPath -o StrictHostKeyChecking=no -r $LOCAL_DIR root@$VPS_HOST`:$VPS_DIR

# Construir y levantar en el VPS
Write-Host "Construyendo contenedor en el VPS..." -ForegroundColor Yellow
ssh -i $keyPath -o StrictHostKeyChecking=no root@$VPS_HOST @'
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
curl -s http://localhost:8083/health || echo "Health check fallo"
'@

Write-Host "=== Deploy completado ===" -ForegroundColor Green