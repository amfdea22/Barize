$backendDir = Split-Path -Parent $PSScriptRoot
$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$logDir = Join-Path $backendDir "logs"

if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

$logFile = Join-Path $logDir "uvicorn-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$pidFile = Join-Path $logDir "uvicorn.pid"

$existing = Get-Process -Name "python*" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "uvicorn.*8000" }
if ($existing) {
  Write-Host "⚠ Backend ja rodando (PID $($existing.Id)). Use Stop-Process -Id $($existing.Id) para reiniciar."
  exit 1
}

Write-Host "🚀 Iniciando NeonBar Backend..."
Write-Host "   Log: $logFile"

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $venvPython
$startInfo.Arguments = "-m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
$startInfo.WorkingDirectory = $backendDir
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $startInfo
$process.Start() | Out-Null

$process.Id | Out-File -FilePath $pidFile -Force

Start-Sleep -Seconds 3

if ($process.HasExited) {
  Write-Host "❌ Backend falhou ao iniciar. Verifique o log."
  $stderr = $process.StandardError.ReadToEnd()
  Write-Host $stderr
  exit 1
}

Write-Host "✅ Backend rodando em http://127.0.0.1:8000 (PID $($process.Id))"
