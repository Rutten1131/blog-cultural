# deploy.ps1 — Script para desplegar el worker de WhatsApp en el VPS
# Uso: .\deploy.ps1

$ErrorActionPreference = "Continue"
$keyPath = "$env:USERPROFILE\.ssh\vps_key"
$VPS_HOST = "178.238.238.158"
$VPS_DIR = "/root/whatsapp-worker"
$LOCAL_DIR = "d:\Abel paginas\agenda cultural\software\vps\whatsapp-worker"

Write-Host "=== Deploy WhatsApp Worker ===" -ForegroundColor Cyan

# 1. Subir archivos actualizados (incluye lib/municipio-scraper.js y worker.js)
Write-Host "Subiendo archivos al VPS..." -ForegroundColor Yellow
& scp -i $keyPath -o StrictHostKeyChecking=no "$LOCAL_DIR\worker.js" root@${VPS_HOST}:${VPS_DIR}/worker.js
& scp -i $keyPath -o StrictHostKeyChecking=no -r "$LOCAL_DIR\lib\*" root@${VPS_HOST}:${VPS_DIR}/lib/

# 2. Reiniciar contenedor en el VPS y verificar logs
Write-Host "Reiniciando contenedor en el VPS..." -ForegroundColor Yellow
$remoteCmd = @'
docker restart whatsapp-worker-whatsapp-worker-1
sleep 4
docker logs whatsapp-worker-whatsapp-worker-1 --tail 30
'@

& ssh -i $keyPath -o StrictHostKeyChecking=no root@$VPS_HOST $remoteCmd

Write-Host "=== Deploy completado exitosamente ===" -ForegroundColor Green