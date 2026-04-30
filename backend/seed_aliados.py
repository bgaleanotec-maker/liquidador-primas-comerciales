"""Seed Aliados desde el archivo backend/data/diccionario_aliados.xlsx.

Crea automáticamente:
- Usuarios "supervisor" únicos a partir de la columna `supervisor`.
- Usuarios "professional" únicos a partir de `Responsable oficina central`.
- Maestro de Aliados.
- Historia temporal vigente (start_date = primer día del mes actual).
"""
import os
import logging
from datetime import date
import pandas as pd
from extensions import db
from models import User, Aliado, AliadoAssignment
from routes.aliados import import_diccionario_dataframe

logger = logging.getLogger(__name__)


def _slug_email(name: str, domain: str) -> str:
    """Convierte 'Lina del Mar Florez' -> 'lina.delmar.florez@<domain>'."""
    base = (name or '').strip().lower()
    if not base:
        return ''
    repl = (
        ('á', 'a'), ('é', 'e'), ('í', 'i'), ('ó', 'o'), ('ú', 'u'),
        ('ñ', 'n'), ('ü', 'u'),
    )
    for a, b in repl:
        base = base.replace(a, b)
    parts = [p for p in base.replace('.', ' ').split() if p]
    if not parts:
        return ''
    if len(parts) == 1:
        slug = parts[0]
    else:
        slug = parts[0] + '.' + ''.join(parts[1:])
    return f"{slug}@primax.com"


def _ensure_user(name: str, role: str, default_password='Beta2026!'):
    """Devuelve el User con ese nombre y rol; crea uno si no existe."""
    if not name or name.lower() in ('nan', 'none', 'firma instaladora'):
        return None
    existing = User.query.filter(db.func.lower(User.name) == name.lower()).first()
    if existing:
        # Si existía con otro rol pero más específico, solo lo dejamos.
        return existing
    email = _slug_email(name, 'primax.com')
    if not email or User.query.filter_by(email=email).first():
        # Si el email ya está usado, generar otro
        suffix = 2
        base = email.split('@')[0]
        while User.query.filter_by(email=email).first():
            email = f"{base}{suffix}@primax.com"
            suffix += 1
    u = User(email=email, name=name, role=role, is_active=True)
    u.set_password(default_password)
    db.session.add(u)
    db.session.flush()
    logger.info(f"Created user {role}: {name} <{email}>")
    return u


def seed_aliados_from_file(path=None, default_start_date=None):
    """Carga el diccionario si existe el archivo; idempotente."""
    if path is None:
        path = os.path.join(os.path.dirname(__file__), 'data', 'diccionario_aliados.xlsx')
    if not os.path.exists(path):
        logger.info(f"Diccionario aliados no encontrado: {path}; saltando seed_aliados")
        return None

    if default_start_date is None:
        today = date.today()
        default_start_date = date(today.year, today.month, 1)

    if Aliado.query.first() is not None:
        logger.info("Tabla aliados ya tiene registros; saltando seed_aliados")
        return None

    logger.info(f"Cargando aliados desde {path}")
    df = pd.read_excel(path, sheet_name='Base')

    # Crear usuarios supervisor y professional desde el diccionario
    supervisores = sorted({str(s).strip() for s in df['supervisor'].dropna().tolist() if str(s).strip()})
    profesionales = sorted({str(s).strip() for s in df['Responsable oficina central'].dropna().tolist()
                            if str(s).strip()})
    skip_words = {'firma instaladora'}
    for sup in supervisores:
        if sup.lower() in skip_words:
            continue
        _ensure_user(sup, role='supervisor')
    for prof in profesionales:
        if prof.lower() in skip_words:
            continue
        # No reemplazar admin/supervisor existente
        u = User.query.filter(db.func.lower(User.name) == prof.lower()).first()
        if not u:
            _ensure_user(prof, role='professional')
    db.session.commit()

    result = import_diccionario_dataframe(df, default_start_date)
    logger.info(f"Seed aliados terminado: {result}")
    return result
