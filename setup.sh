#!/bin/bash

# EAR Trader Simulator - Quick Start Script

echo "🎯 EAR Trader Simulator - Setup"
echo "================================"
echo ""

# Check Python
echo "📦 Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo "✓ Python3 found"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo "✓ Python found"
else
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
$PYTHON_CMD -m pip install -r requirements.txt --break-system-packages 2>/dev/null || \
$PYTHON_CMD -m pip install -r requirements.txt

echo ""

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data
echo "✓ Data directory created"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the app:"
echo "   1. Run: $PYTHON_CMD main.py"
echo "   2. Open: app/index.html in your browser"
echo ""
echo "📖 Read README.md for detailed instructions"
echo ""
