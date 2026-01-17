@echo off
REM EAR Trader Simulator - Setup per Windows

echo ========================================
echo  EAR Trader Simulator - Setup Windows
echo ========================================
echo.

REM Check Python
echo Controllo Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: Python non trovato
    echo Installa Python 3.8+ da python.org
    pause
    exit /b 1
)
echo OK: Python trovato
echo.

REM Install dependencies
echo Installazione dipendenze...
python -m pip install -r requirements.txt
echo.

REM Create data directory
echo Creazione cartella dati...
if not exist "data" mkdir data
echo OK: Cartella data creata
echo.

echo ========================================
echo  Setup completato!
echo ========================================
echo.
echo Per avviare l'applicazione:
echo   1. Esegui: python main.py
echo   2. Apri: app\index.html nel browser
echo.
echo Leggi README.md per istruzioni dettagliate
echo.
pause
