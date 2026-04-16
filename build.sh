#!/bin/bash
set -e

echo "=== Instalando dependencias Python ==="
pip install -r backend/requirements.txt

echo "=== Instalando dependencias Node.js ==="
cd frontend
npm install

echo "=== Construyendo frontend React ==="
npm run build

echo "=== Copiando build al backend ==="
cd ..
mkdir -p backend/dist
cp -r frontend/dist/* backend/dist/

echo "=== Inicializando base de datos ==="
cd backend
export FLASK_APP=app.py
python -c "
from app import create_app
from extensions import db
app = create_app()
with app.app_context():
    db.create_all()
    print('Base de datos inicializada')
    from seed import seed
    seed()
    print('Datos iniciales cargados')
"

echo "✅ Build completo!"
