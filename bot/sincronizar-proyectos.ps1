# =============================================================================
# SINCRONIZAR BOT A LOS 3 PROYECTOS
# =============================================================================
# Ejecutar desde la carpeta raiz de Agenda Cultural:
#   .\bot\sincronizar-proyectos.ps1
#
# Que hace?
#   1. Copia los archivos del bot desde Agenda Cultural (master) hacia:
#      - Que Comer en Loja
#      - Agenda Turistica Loja
#   2. Actualiza la carpeta bot/paquete-migracion con los archivos actuales
#
# IMPORTANTE: Los archivos .env NO se tocan.
# =============================================================================

# Ajusta estas rutas segun donde tengas los proyectos:
$MASTER         = "D:\Abel paginas\agenda cultural\software"
$QUECOMER       = "D:\Abel paginas\quecomerenloja\software"
$TURISTICALOJA  = "D:\Abel paginas\agendaturistica\software"

$ARCHIVOS_BOT = @(
    "app\api\chat\route.ts",
    "components\ChatbotWidget.tsx",
    "lib\chat\contenidoService.ts",
    "lib\chat\chatMemory.ts",
    "lib\chat\chatRouter.ts",
    "lib\chat\chatCache.ts",
    "lib\prisma-bot.ts"
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SYNC BOT - Agenda Cultural -> Proyectos hermanos" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

function Sync-Archivo {
    param($origen, $destino, $nombreProyecto)
    if (-not (Test-Path $origen)) {
        Write-Host "  OMITIDO: $origen" -ForegroundColor Yellow
        return
    }
    $dir = Split-Path $destino -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item -Path $origen -Destination $destino -Force
    Write-Host "  OK  $origen -> $nombreProyecto" -ForegroundColor Green
}

# 1. Actualizar paquete-migracion
Write-Host "Actualizando paquete de migracion..." -ForegroundColor White
foreach ($a in $ARCHIVOS_BOT) {
    Sync-Archivo (Join-Path $MASTER $a) (Join-Path "$MASTER\bot\paquete-migracion" $a) "bot/paquete-migracion"
}
Write-Host ""

# 2. Que Comer en Loja
if (Test-Path $QUECOMER) {
    Write-Host "Sincronizando -> Que Comer en Loja..." -ForegroundColor White
    foreach ($a in $ARCHIVOS_BOT) { Sync-Archivo (Join-Path $MASTER $a) (Join-Path $QUECOMER $a) "quecomerenloja" }
    Write-Host ""
} else {
    Write-Host "SKIP: Que Comer no encontrado en $QUECOMER (ajusta la ruta en este script)" -ForegroundColor DarkYellow
    Write-Host ""
}

# 3. Agenda Turistica
if (Test-Path $TURISTICALOJA) {
    Write-Host "Sincronizando -> Agenda Turistica Loja..." -ForegroundColor White
    foreach ($a in $ARCHIVOS_BOT) { Sync-Archivo (Join-Path $MASTER $a) (Join-Path $TURISTICALOJA $a) "agendaturisticaloja" }
    Write-Host ""
} else {
    Write-Host "SKIP: Agenda Turistica no encontrada en $TURISTICALOJA (ajusta la ruta en este script)" -ForegroundColor DarkYellow
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Sync completado. Recuerda: los .env NO se tocan." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
