# NOTA: Al hacer cambios en ChatbotWidget.tsx, usar Node.js para el replace
# de colores, NO usar PowerShell Get-Content/Set-Content (rompe UTF-8 emojis)
# sync-bot.ps1
# Sincroniza archivos CORE del bot desde Agenda Cultural Loja hacia otros proyectos.
#
# USO:
#   cd "d:\Abel paginas\agenda cultural\software"
#   .\bot\sync-bot.ps1           <- sincroniza de verdad
#   .\bot\sync-bot.ps1 -DryRun   <- solo muestra que copiaria sin copiar nada
#
# ARCHIVOS QUE SINCRONIZA (identicos en todos los proyectos):
#   lib/chat/chatRouter.ts + lib/chat/skills/*.ts + components/ChatbotWidget.tsx
#   lib/prisma-bot.ts + prisma/schema-bot.prisma
#
# ARCHIVOS QUE NO SINCRONIZA (cada proyecto tiene el suyo propio):
#   app/api/chat/route.ts  -> SYSTEM PROMPT diferente por proyecto
#   .env.local             -> DB_URL y API keys distintas
#   prompt.txt             -> personalidad/contexto del bot

param([switch]$DryRun)

$FUENTE = Split-Path $PSScriptRoot -Parent

# ── Agregar aqui cada proyecto destino ────────────────────────────────────────
$PROYECTOS = @(
    @{ Nombre = "Agenda Turistica Loja"; Ruta = "d:\Abel paginas\Agenda turistica Loja\agenda-turistica-loja" }
    # @{ Nombre = "Que Comer en Loja";    Ruta = "d:\Abel paginas\Que comer en loja\quecomerenloja" }
)

# ── Archivos que son IDENTICOS en todos los proyectos ─────────────────────────
$CORE = @(
    "lib\chat\chatRouter.ts"
    "lib\chat\skills\types.ts"
    "lib\chat\skills\skillEventos.ts"
    "lib\chat\skills\skillHospedaje.ts"
    "lib\chat\skills\skillGastronomia.ts"
    "lib\chat\skills\skillTurismo.ts"
    "lib\chat\skills\skillPlanVisita.ts"
    "lib\chat\skills\skillOrchestrator.ts"
    "components\ChatbotWidget.tsx"
    "lib\prisma-bot.ts"
    "prisma\schema-bot.prisma"
)

Write-Host ""
Write-Host "=== SYNC BOT ===" -ForegroundColor Cyan
if ($DryRun) { Write-Host "  [DRY-RUN - no se copia nada]" -ForegroundColor Yellow }
Write-Host ""

$total = 0
$skipped = 0

foreach ($proyecto in $PROYECTOS) {
    Write-Host ("Proyecto: " + $proyecto.Nombre) -ForegroundColor Cyan
    if (-not (Test-Path $proyecto.Ruta)) {
        Write-Host ("  SKIP: carpeta no existe -> " + $proyecto.Ruta) -ForegroundColor Yellow
        $skipped++
        continue
    }
    foreach ($f in $CORE) {
        $src = Join-Path $FUENTE $f
        $dst = Join-Path $proyecto.Ruta $f
        if (Test-Path $src) {
            if (-not $DryRun) {
                New-Item -ItemType Directory -Path (Split-Path $dst) -Force | Out-Null
                Copy-Item $src $dst -Force
            }
            Write-Host ("  OK  " + $f) -ForegroundColor Green
            $total++
        } else {
            Write-Host ("  ??  " + $f + " (origen no existe)") -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

# Actualizar tambien paquete-migracion interno
Write-Host "Actualizando paquete-migracion..." -ForegroundColor Cyan
$PKG = Join-Path $FUENTE "bot\paquete-migracion"
foreach ($f in $CORE) {
    $src = Join-Path $FUENTE $f
    $dst = Join-Path $PKG $f
    if (Test-Path $src) {
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path (Split-Path $dst) -Force | Out-Null
            Copy-Item $src $dst -Force
        }
        Write-Host ("  OK  " + $f) -ForegroundColor Green
        $total++
    }
}
# route.ts SOLO va al paquete (como plantilla), NO a los otros proyectos directamente
$rsrc = Join-Path $FUENTE "app\api\chat\route.ts"
$rdst = Join-Path $PKG "app\api\chat\route.ts"
if (-not $DryRun) { Copy-Item $rsrc $rdst -Force }
Write-Host "  OK  route.ts (solo paquete, NO proyectos directos)" -ForegroundColor DarkGray

Write-Host ""
Write-Host ("=== RESUMEN: Copiados=" + $total + "  Saltados=" + $skipped) -ForegroundColor Cyan
Write-Host ""
Write-Host "RECUERDA editar por proyecto:" -ForegroundColor Magenta
Write-Host "  app/api/chat/route.ts  -> SYSTEM PROMPT diferente" -ForegroundColor Gray
Write-Host "  .env.local             -> DB_URL y API keys distintas" -ForegroundColor Gray
Write-Host "  prompt.txt             -> personalidad/contexto del bot" -ForegroundColor Gray
Write-Host ""


