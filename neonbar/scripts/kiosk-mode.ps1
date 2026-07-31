# ─────────────────────────────────────────────────────────────
# barize - Configurar Modo Quiosco no Windows
# Pilar 2: Modo Quiosque - Terminal fullscreen sem menus
# ─────────────────────────────────────────────────────────────
# Uso: PowerShell como Administrador
# .\kiosk-mode.ps1 -URL "http://barize.local"
# ─────────────────────────────────────────────────────────────

param(
    [Parameter(Mandatory = $false)]
    [string]$URL = "http://barize.local",

    [Parameter(Mandatory = $false)]
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

# ─── Caminhos ───────────────────────────────────────────────
$ChromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
$EdgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$KioskScript = "$env:USERPROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\barize-Kiosk.ps1"

if ($Remove) {
    Write-Host "Removendo configuração de Kiosk Mode..." -ForegroundColor Yellow
    if (Test-Path $KioskScript) {
        Remove-Item $KioskScript -Force
        Write-Host "Script de inicialização removido." -ForegroundColor Green
    }
    return
}

# ─── Verifica navegador ─────────────────────────────────────
$BrowserPath = $null
if (Test-Path $ChromePath) {
    $BrowserPath = $ChromePath
    $BrowserName = "Google Chrome"
}
elseif (Test-Path $EdgePath) {
    $BrowserPath = $EdgePath
    $BrowserName = "Microsoft Edge"
}
else {
    Write-Error "Nenhum navegador compatível encontrado (Chrome ou Edge)."
    exit 1
}

Write-Host "═" x 50
Write-Host "  barize - Configurar Modo Quiosque"
Write-Host "═" x 50
Write-Host ""
Write-Host "Navegador: $BrowserName"
Write-Host "URL:       $URL"
Write-Host ""

# ─── Cria script de inicialização ───────────────────────────
$KioskCommand = @"
# barize - Iniciar Modo Quiosque
Start-Process -FilePath "$BrowserPath" -ArgumentList @(
    '--kiosk',
    '--no-first-run',
    '--disable-features=TranslateUI',
    '--disable-features=ChromeWhatsNewUI',
    '--disable-sync',
    '--no-default-browser-check',
    '--disable-restore-session-state',
    '--disable-session-crashed-bubble',
    '--disable-infobars',
    '--disable-notifications',
    '--disable-prompt-on-repost',
    '--disable-features=InterestFeedContentSuggestions',
    '--disable-features=SidePanel',
    '--disable-features=ReadAnything',
    '--disable-features=ReadAloud',
    '--disable-features=MediaRouter',
    '--disable-features=GlobalMediaControls',
    '--check-for-update-interval=604800',
    '$URL'
)
"@

# Cria o diretório Startup se não existir
$StartupDir = Split-Path $KioskScript -Parent
if (!(Test-Path $StartupDir)) {
    New-Item -ItemType Directory -Path $StartupDir -Force | Out-Null
}

# Escreve script
Set-Content -Path $KioskScript -Value $KioskCommand -Encoding UTF8

Write-Host "Script de inicialização criado:" -ForegroundColor Green
Write-Host "  $KioskScript" -ForegroundColor Gray
Write-Host ""
Write-Host "O terminal abrirá automaticamente em modo quiosque no próximo login."
Write-Host ""
Write-Host "Para testar agora, execute:" -ForegroundColor Yellow
Write-Host "  & '$KioskScript'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para remover a configuração:" -ForegroundColor Yellow
Write-Host "  .\kiosk-mode.ps1 -Remove" -ForegroundColor Cyan
