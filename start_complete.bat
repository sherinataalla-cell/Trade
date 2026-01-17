@echo off
REM EAR Trader - Automated Startup (Windows)

title EAR Trader Simulator

echo ============================================
echo  EAR Trader Simulator - Startup Automatico
echo ============================================
echo.

REM Check if in correct directory
if not exist "main.py" (
    echo ERRORE: Esegui questo script dalla cartella ear-trader
    echo    Fai doppio click su start_complete.bat dalla cartella ear-trader
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: Python non trovato
    echo Installa Python da: https://python.org
    pause
    exit /b 1
)

echo Python trovato: 
python --version
echo.

REM Start backend
echo Avvio backend...
start "EAR Trader Backend" /MIN python main.py
echo OK: Backend avviato
echo.

REM Wait for backend
echo Attendo che backend sia pronto...
timeout /t 5 /nobreak >nul
echo.

REM Start frontend
echo Avvio frontend server...
cd app
start "EAR Trader Frontend" /MIN python -m http.server 8000
cd ..
echo OK: Frontend server avviato
echo.

echo ============================================
echo  App avviata con successo!
echo ============================================
echo.
echo  Apri nel browser:
echo    http://localhost:8000
echo.
echo  IMPORTANTE:
echo    - Due finestre sono state aperte (minimizzate)
echo    - Una per backend, una per frontend
echo    - Per fermare: esegui stop.bat
echo.
echo  Premi un tasto per aprire il browser...
pause >nul

REM Open browser
start http://localhost:8000

echo.
echo  App in esecuzione!
echo  Chiudi questa finestra quando hai finito
echo  (backend e frontend continueranno a girare)
echo.
pause
