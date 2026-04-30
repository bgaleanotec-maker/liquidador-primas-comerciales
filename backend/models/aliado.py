from extensions import db
from datetime import datetime


class Aliado(db.Model):
    """Maestro de aliados/firmas tomado del diccionario_aliados.

    Llave = NOMBRE_FIRMA + sociedad (igual que el archivo origen).
    """
    __tablename__ = 'aliados'

    id = db.Column(db.Integer, primary_key=True)
    llave = db.Column(db.String(500), unique=True, nullable=False, index=True)
    nit = db.Column(db.String(50), nullable=True, index=True)
    bp_vantilisto = db.Column(db.String(50), nullable=True, index=True)
    tipo_aliado = db.Column(db.String(120), nullable=True)
    nombre_firma = db.Column(db.String(500), nullable=False)
    nombre_correcto = db.Column(db.String(500), nullable=True)
    sociedad = db.Column(db.String(50), nullable=False, index=True)  # VANTI / GNCB / GOR / GNC

    supervisor_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supervisor = db.relationship('User', foreign_keys=[supervisor_user_id])

    def to_dict(self, include_current=False):
        d = {
            'id': self.id,
            'llave': self.llave,
            'nit': self.nit,
            'bp_vantilisto': self.bp_vantilisto,
            'tipo_aliado': self.tipo_aliado,
            'nombre_firma': self.nombre_firma,
            'nombre_correcto': self.nombre_correcto,
            'sociedad': self.sociedad,
            'supervisor_user_id': self.supervisor_user_id,
            'supervisor_name': self.supervisor.name if self.supervisor else None,
            'is_active': self.is_active,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_current:
            from models.aliado_assignment import AliadoAssignment
            current = AliadoAssignment.current_for_aliado(self.id)
            d['current_assignment'] = current.to_dict() if current else None
        return d

    def __repr__(self):
        return f'<Aliado {self.llave}>'
