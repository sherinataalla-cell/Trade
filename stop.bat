@echo off
REM Stop EAR Trader (Windows)

title Arresto EAR Trader

echo ============================================
echo  Arresto EAR Trader Simulator
echo ============================================
echo.

echo Arresto backend (porta 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo OK: Backend arrestato
echo.

echo Arresto frontend (porta 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo OK: Frontend arrestato
echo.

echo ============================================
echo  App arrestata completamente
echo ============================================
echo.
pause
