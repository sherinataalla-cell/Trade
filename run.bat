@echo off
REM EAR Trader - Diagnostica e Avvio Automatico (Windows)

echo ============================================
echo  EAR Trader - Diagnostica e Avvio Automatico
echo ============================================
echo.

REM Check Python
echo 1. Controllo Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: Python non trovato
    echo Installa Python da: https://python.org
    echo Assicurati di spuntare "Add Python to PATH"
    pause
    exit /b 1
)
echo OK: Python trovato
for /f "tokens=*" %%i in ('python --version') do echo    %%i
echo.

REM Check dependencies
echo 2. Controllo dipendenze...
python -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installo dipendenze...
    python -m pip install -r requirements.txt
    echo OK: Dipendenze installate
) else (
    echo OK: Dipendenze gia installate
)
echo.

REM Check data directory
echo 3. Controllo cartella dati...
if not exist "data" (
    mkdir data
    echo OK: Cartella data creata
) else (
    echo OK: Cartella data esistente
)
echo.

REM Kill existing processes (Windows doesn't have lsof, skip)
echo 4. Libero porta 5000...
echo OK: (controllo automatico non disponibile su Windows)
echo.

REM Instructions
echo 5. Avvio backend...
echo.
echo    Backend URL: http://localhost:5000
echo    API Test: http://localhost:5000/api/market/BTC
echo.
echo    IMPORTANTE: Tieni aperto questo terminale!
echo    Dopo che il backend e avviato, apri in browser:
echo.
echo    file:///%CD%\app\index.html
echo.
echo    Oppure apri un altro prompt e:
echo    cd app
echo    python -m http.server 8000
echo    poi vai su: http://localhost:8000
echo.
echo Avvio in 3 secondi...
timeout /t 3 /nobreak >nul
echo.

python main.py
