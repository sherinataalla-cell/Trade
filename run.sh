#!/bin/bash

echo "🔧 EAR Trader - Diagnostica e Avvio Automatico"
echo "=============================================="
echo ""

# Check Python
echo "1️⃣ Controllo Python..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
    echo "✅ Python3 trovato: $(python3 --version)"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PIP_CMD="pip"
    echo "✅ Python trovato: $(python --version)"
else
    echo "❌ Python non trovato!"
    echo "   Installa Python da: https://python.org"
    exit 1
fi
echo ""

# Check dependencies
echo "2️⃣ Controllo dipendenze..."
$PIP_CMD show flask >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Flask non trovato, installo dipendenze..."
    $PIP_CMD install -r requirements.txt --break-system-packages 2>/dev/null || \
    $PIP_CMD install -r requirements.txt
    echo "✅ Dipendenze installate"
else
    echo "✅ Dipendenze già installate"
fi
echo ""

# Check data directory
echo "3️⃣ Controllo cartella dati..."
if [ ! -d "data" ]; then
    mkdir data
    echo "✅ Cartella data creata"
else
    echo "✅ Cartella data esistente"
fi
echo ""

# Kill existing process on port 5000
echo "4️⃣ Libero porta 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
echo "✅ Porta 5000 libera"
echo ""

# Start backend
echo "5️⃣ Avvio backend..."
echo "   Backend URL: http://localhost:5000"
echo "   API Test: http://localhost:5000/api/market/BTC"
echo ""
echo "⚠️  IMPORTANTE: Tieni aperto questo terminale!"
echo "   Dopo che il backend è avviato, apri:"
echo "   file://$(pwd)/app/index.html"
echo ""
echo "   Oppure in un altro terminale:"
echo "   cd app && python3 -m http.server 8000"
echo "   poi vai su: http://localhost:8000"
echo ""
echo "🚀 Avvio in 3 secondi..."
sleep 3
echo ""

$PYTHON_CMD main.py
