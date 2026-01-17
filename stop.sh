#!/bin/bash

# Stop EAR Trader

echo "🛑 Arresto EAR Trader..."

# Kill backend
if [ -f .backend.pid ]; then
    kill $(cat .backend.pid) 2>/dev/null
    rm .backend.pid
    echo "✓ Backend arrestato"
else
    # Fallback: kill by port
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    echo "✓ Processo su porta 5000 arrestato"
fi

# Kill frontend
if [ -f .frontend.pid ]; then
    kill $(cat .frontend.pid) 2>/dev/null
    rm .frontend.pid
    echo "✓ Frontend arrestato"
else
    # Fallback: kill by port
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    echo "✓ Processo su porta 8000 arrestato"
fi

echo "✅ App arrestata completamente"
