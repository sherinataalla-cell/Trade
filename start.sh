#!/bin/bash

# EAR Trader Simulator - Start Script

echo "🚀 Starting EAR Trader Simulator..."
echo ""

# Find Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found"
    exit 1
fi

# Start backend
echo "📊 Starting backend server..."
echo "   Access at: http://localhost:5000"
echo ""
echo "⚠️  Keep this terminal open!"
echo "   Press Ctrl+C to stop"
echo ""
echo "🌐 Open app/index.html in your browser"
echo "   Or use: file://$(pwd)/app/index.html"
echo ""

$PYTHON_CMD main.py
