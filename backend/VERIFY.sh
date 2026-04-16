#!/bin/bash

# Verification script for backend installation

echo "=================================="
echo "Liquidador de Primas Backend"
echo "Installation Verification"
echo "=================================="
echo

# Check Python version
echo "1. Checking Python version..."
python --version || python3 --version
echo

# Check pip
echo "2. Checking pip..."
pip --version || pip3 --version
echo

# Create virtual environment
echo "3. Creating virtual environment..."
if [ ! -d "venv" ]; then
    python -m venv venv || python3 -m venv venv
    echo "   Virtual environment created"
else
    echo "   Virtual environment already exists"
fi
echo

# Activate virtual environment
echo "4. Activating virtual environment..."
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
echo "   Virtual environment activated"
echo

# Install requirements
echo "5. Installing requirements..."
pip install -r requirements.txt -q
echo "   Requirements installed"
echo

# Check database
echo "6. Checking database..."
if [ -f "primax_dev.db" ]; then
    echo "   Database exists: primax_dev.db"
else
    echo "   No existing database found (will be created on first run)"
fi
echo

# List files
echo "7. File Structure:"
echo "   Core files:"
ls -1 *.py 2>/dev/null | sed 's/^/     - /'
echo
echo "   Models:"
ls -1 models/*.py 2>/dev/null | sed 's/^/     - /'
echo
echo "   Routes:"
ls -1 routes/*.py 2>/dev/null | sed 's/^/     - /'
echo
echo "   Services:"
ls -1 services/*.py 2>/dev/null | sed 's/^/     - /'
echo
echo "   Documentation:"
ls -1 *.md 2>/dev/null | sed 's/^/     - /'
echo

# Check Flask installation
echo "8. Checking Flask installation..."
python -c "import flask; print('   Flask version:', flask.__version__)" 2>/dev/null || echo "   Flask not installed"
echo

# Check SQLAlchemy
echo "9. Checking SQLAlchemy..."
python -c "import sqlalchemy; print('   SQLAlchemy version:', sqlalchemy.__version__)" 2>/dev/null || echo "   SQLAlchemy not installed"
echo

# Check pandas
echo "10. Checking pandas..."
python -c "import pandas; print('   Pandas version:', pandas.__version__)" 2>/dev/null || echo "   Pandas not installed"
echo

echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo
echo "Next steps:"
echo "1. Copy .env.example to .env"
echo "2. Run: python app.py"
echo "3. Login at http://localhost:5000"
echo "4. Read QUICKSTART.md for more info"
echo
