$ErrorActionPreference = 'Continue'
$keyDst = "$env:USERPROFILE\.ssh\vps_key"

Write-Host "Buscando ruta de activaqr en el VPS..."
$remoteCmd = @'
find / -maxdepth 5 -name "docker-compose.yml" 2>/dev/null | grep -i "activa"
'@

& ssh -i $keyDst -o StrictHostKeyChecking=no root@178.238.238.158 $remoteCmd
