$ErrorActionPreference = 'Continue'
$keySrc = "d:\Abel paginas\Generador QR contacto\Mayo\Contacto-QR-main\vps\antigravity_vps_key"
$keyDst = "$env:USERPROFILE\.ssh\vps_key"

if (-not (Test-Path "$env:USERPROFILE\.ssh")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force | Out-Null
}

Copy-Item $keySrc $keyDst -Force

# Quitar herencia y dar permiso unico al usuario actual
$acl = Get-Acl $keyDst
$acl.SetAccessRuleProtection($true, $false)
$acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) } | Out-Null
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME, "Read", "Allow")
$acl.AddAccessRule($rule)
Set-Acl $keyDst $acl

Write-Host "--- Verificando ACL ---"
(Get-Acl $keyDst).Access | Select-Object IdentityReference, FileSystemRights

Write-Host "--- Probando conexion SSH ---"
& ssh -i $keyDst -o StrictHostKeyChecking=no -o ConnectTimeout=15 root@178.238.238.158 "echo 'CONECTADO_EXITOSAMENTE' && docker ps --format 'table {{.Names}}\t{{.Status}}'"
