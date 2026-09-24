$ErrorActionPreference = 'Continue'
$keyDst = "$env:USERPROFILE\.ssh\vps_key"

Write-Host "Aplicando git stash y procediendo al build en el VPS..."
$remoteCmd = @'
cd /root/activaqr-fast
git stash
git pull origin main
docker compose up -d --build
docker ps --filter "name=activaqr"
'@

& ssh -i $keyDst -o StrictHostKeyChecking=no root@178.238.238.158 $remoteCmd
