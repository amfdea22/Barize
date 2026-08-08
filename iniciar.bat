@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title BARIZE - Gerenciador do Sistema

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%neonbar\backend"
set "FRONTEND_DIR=%ROOT%neonbar\frontend"
set "VENV_PY=%BACKEND_DIR%\.venv\Scripts\python.exe"

rem Se chamado com argumento "parar"/"stop", vai direto para a rotina de parada
if /i "%~1"=="parar" goto :parar
if /i "%~1"=="stop" goto :parar

:menu
echo ============================================
echo   BARIZE - Gerenciador do Sistema
echo ============================================
echo.
echo   [1] Iniciar sistema (backend + frontend)
echo   [2] Parar servidores e liberar portas
echo.
choice /c 12 /n /m "   Escolha uma opcao (1/2): "
if errorlevel 2 goto :parar
if errorlevel 1 goto :iniciar
goto :menu

:iniciar
echo.
echo ============================================
echo   BARIZE - Iniciar sistema (backend + front)
echo ============================================
echo.

rem ---------- 1. Verificar Node.js/npm ----------
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js/npm nao encontrado no PATH.
    echo        Instale o Node.js em https://nodejs.org e tente novamente.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('npm --version') do echo [OK] npm %%v encontrado.

rem ---------- 2. Verificar venv do backend ----------
if not exist "%VENV_PY%" (
    echo [AVISO] Ambiente virtual do backend nao encontrado em:
    echo         %VENV_PY%
    echo.
    set /p "criar=    Deseja criar o venv e instalar dependencias agora? (s/N): "
    if /i "!criar!"=="s" (
        echo.
        echo Criando venv...
        pushd "%BACKEND_DIR%"
        python -m venv .venv
        if errorlevel 1 (
            echo [ERRO] Falha ao criar venv. Python nao instalado ou fora do PATH?
            pause
            exit /b 1
        )
        echo Instalando dependencias do backend...
        "%VENV_PY%" -m pip install --upgrade pip >nul 2>nul
        "%VENV_PY%" -m pip install -r requirements.txt
        if errorlevel 1 (
            echo [ERRO] Falha ao instalar dependencias do backend.
            pause
            exit /b 1
        )
        popd
        echo [OK] Backend pronto.
    ) else (
        echo.
        echo Abortado. Configure manualmente:
        echo     cd neonbar\backend
        echo     python -m venv .venv
        echo     .venv\Scripts\activate
        echo     pip install -r requirements.txt
        pause
        exit /b 1
    )
) else (
    echo [OK] venv do backend encontrado.
)

rem ---------- 3. Verificar node_modules do frontend ----------
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [AVISO] node_modules do frontend nao encontrado.
    set /p "instalar=    Deseja rodar 'npm install' agora? (s/N): "
    if /i "!instalar!"=="s" (
        echo.
        echo Instalando dependencias do frontend...
        pushd "%FRONTEND_DIR%"
        call npm install
        if errorlevel 1 (
            echo [ERRO] Falha no npm install do frontend.
            pause
            exit /b 1
        )
        popd
        echo [OK] Frontend pronto.
    ) else (
        echo.
        echo Abortado. Rode 'npm install' em neonbar\frontend manualmente.
        pause
        exit /b 1
    )
) else (
    echo [OK] node_modules do frontend encontrado.
)

rem ---------- 4. Verificar portas 8000 e 5173 ----------
set "SKIP_BACKEND="
set "SKIP_FRONTEND="

netstat -ano | findstr /C:":8000 " | findstr /C:"LISTENING" >nul 2>nul
if not errorlevel 1 (
    echo [AVISO] Porta 8000 ja em uso. Backend NAO sera iniciado.
    set "SKIP_BACKEND=1"
)
netstat -ano | findstr /C:":5173 " | findstr /C:"LISTENING" >nul 2>nul
if not errorlevel 1 (
    echo [AVISO] Porta 5173 ja em uso. Frontend NAO sera iniciado.
    set "SKIP_FRONTEND=1"
)
echo.

rem ---------- 5. Iniciar Backend (janela separada) ----------
if not defined SKIP_BACKEND (
    echo [..] Abrindo janela do Backend...
    start "BARIZE - Backend (http://localhost:8000)" /D "%BACKEND_DIR%" cmd /k ""%VENV_PY%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
)

timeout /t 2 /nobreak >nul

rem ---------- 6. Iniciar Frontend (janela separada) ----------
if not defined SKIP_FRONTEND (
    echo [..] Abrindo janela do Frontend...
    start "BARIZE - Frontend (http://localhost:5173)" /D "%FRONTEND_DIR%" cmd /k "npm run dev"
)

echo.
echo ============================================
echo  Frontend:  http://localhost:5173
echo  Backend:   http://localhost:8000   (/docs)
echo.
echo  Para encerrar e liberar as portas, rode:
echo      %~f0 parar
echo ============================================
echo.
pause
exit /b 0

:parar
echo.
echo ============================================
echo   BARIZE - Encerrar servidores e liberar portas
echo ============================================
echo.

rem ---------- 1. Encerrar Backend (porta 8000) ----------
set "PID_BACKEND="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":8000 .*LISTENING"') do set "PID_BACKEND=%%p"
if not defined PID_BACKEND goto :backend_livre
echo [..] Encerrando Backend na porta 8000 - PID !PID_BACKEND!...
taskkill /F /PID !PID_BACKEND! >nul 2>nul
if errorlevel 1 (
    echo [AVISO] Falha ao encerrar o processo da porta 8000.
) else (
    echo [OK] Backend encerrado.
)
goto :parar_frontend
:backend_livre
echo [OK] Porta 8000 ja esta livre.

rem ---------- 2. Encerrar Frontend (porta 5173) ----------
:parar_frontend
set "PID_FRONTEND="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING"') do set "PID_FRONTEND=%%p"
if not defined PID_FRONTEND goto :frontend_livre
echo [..] Encerrando Frontend na porta 5173 - PID !PID_FRONTEND!...
taskkill /F /PID !PID_FRONTEND! >nul 2>nul
if errorlevel 1 (
    echo [AVISO] Falha ao encerrar o processo da porta 5173.
) else (
    echo [OK] Frontend encerrado.
)
goto :confirmar
:frontend_livre
echo [OK] Porta 5173 ja esta livre.

rem ---------- 3. Confirmar liberacao das portas ----------
:confirmar
echo.
set /a "tentativa=0"
:verifica_8000
netstat -ano | findstr /C:":8000 " | findstr /C:"LISTENING" >nul 2>nul
if not errorlevel 1 (
    set /a tentativa+=1
    if !tentativa! lss 5 (
        timeout /t 1 /nobreak >nul
        goto :verifica_8000
    )
    echo [AVISO] Porta 8000 ainda ocupada apos 5 tentativas.
) else (
    echo [OK] Porta 8000 liberada.
)

set /a "tentativa=0"
:verifica_5173
netstat -ano | findstr /C:":5173 " | findstr /C:"LISTENING" >nul 2>nul
if not errorlevel 1 (
    set /a tentativa+=1
    if !tentativa! lss 5 (
        timeout /t 1 /nobreak >nul
        goto :verifica_5173
    )
    echo [AVISO] Porta 5173 ainda ocupada apos 5 tentativas.
) else (
    echo [OK] Porta 5173 liberada.
)

echo.
echo ============================================
echo   Servidores encerrados. Portas liberadas.
echo ============================================
echo.
pause
exit /b 0
endlocal
