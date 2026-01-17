#!/bin/bash

# EAR Trader - Automated Startup Script
# This script starts both backend and frontend automatically

echo "🚀 EAR Trader Simulator - Startup Automatico"
echo "=============================================="
echo ""

# Check if in correct directory
if [ ! -f "main.py" ]; then
    echo "❌ Errore: Esegui questo script dalla cartella ear-trader"
    echo "   cd ear-trader"
    echo "   ./start_complete.sh"
    exit 1
fi

# Find Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python non trovato"
    exit 1
fi

echo "📦 Python trovato: $PYTHON_CMD"
echo ""

# Start backend in background
echo "🔧 Avvio backend..."
$PYTHON_CMD main.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ Backend avviato (PID: $BACKEND_PID)"
echo "  Log: backend.log"
echo ""

# Wait for backend to start
echo "⏳ Attendo che backend sia pronto..."
sleep 3

# Test backend
if curl -s http://localhost:5000/api/portfolio > /dev/null 2>&1; then
    echo "✓ Backend risponde correttamente"
else
    echo "⚠️  Backend non risponde ancora, attendo..."
    sleep 2
fi

echo ""

# Start frontend server in background
echo "🌐 Avvio frontend server..."
cd app
$PYTHON_CMD -m http.server 8000 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "✓ Frontend server avviato (PID: $FRONTEND_PID)"
echo "  Log: frontend.log"
echo ""

# Save PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo "=============================================="
echo "✅ App avviata con successo!"
echo ""
echo "📊 Apri nel browser:"
echo "   http://localhost:8000"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - NON chiudere questo terminale"
echo "   - Per fermare l'app: Ctrl+C"
echo "   - Oppure esegui: ./stop.sh"
echo ""
echo "📝 Log disponibili in:"
echo "   - backend.log"
echo "   - frontend.log"
echo ""
echo "🔍 Apri http://localhost:8000 nel browser ora!"
echo "=============================================="

# Wait for user to press Ctrl+C
trap cleanup INT

cleanup() {
    echo ""
    echo "🛑 Arresto in corso..."
    
    if [ -f .backend.pid ]; then
        kill $(cat .backend.pid) 2>/dev/null
        rm .backend.pid
    fi
    
    if [ -f .frontend.pid ]; then
        kill $(cat .frontend.pid) 2>/dev/null
        rm .frontend.pid
    fi
    
    echo "✓ App arrestata"
    exit 0
}

# Keep script running
while true; do
    sleep 1
done
