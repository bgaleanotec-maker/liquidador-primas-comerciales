from extensions import db
from datetime import datetime, date


STATUSES = ('active', 'vacation', 'disability', 'leave', 'inactive', 'reassigned')


class AliadoAssignment(db.Model):
    """Historia temporal del responsable de oficina central por aliado.

    Cada vez que cambia el responsable, su estado o su rango de vigencia,
    se crea/actualiza un registro. Permite resolver responsable por (aliado, fecha).
    """
    __tablename__ = 'aliado_assignments'

    id = db.Column(db.Integer, primary_key=True)
    aliado_id = db.Column(db.Integer, db.ForeignKey('aliados.id'), nullable=False, index=True)

    # Profesional puede ser un usuario interno (User con rol 'professional')
    # o solo un nombre libre (cuando todavía no existe usuario en el sistema).
    professional_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    professional_name = db.Column(db.String(255), nullable=False)

    # Responsable filial (segunda persona indicada en el diccionario, opcional)
    responsable_filial = db.Column(db.String(255), nullable=True)

    start_date = db.Column(db.Date, nullable=False, index=True)
    end_date = db.Column(db.Date, nullable=True, index=True)  # null = vigente / indefinido

    status = db.Column(db.String(30), nullable=False, default='active')  # ver STATUSES
    notes = db.Column(db.String(500), nullable=True)

    created_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    aliado = db.relationship('Aliado', backref=db.backref('assignments', lazy='dynamic'))
    professional_user = db.relationship('User', foreign_keys=[professional_user_id])
    created_by = db.relationship('User', foreign_keys=[created_by_user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'aliado_id': self.aliado_id,
            'aliado_llave': self.aliado.llave if self.aliado else None,
            'aliado_nombre': self.aliado.nombre_firma if self.aliado else None,
            'aliado_sociedad': self.aliado.sociedad if self.aliado else None,
            'professional_user_id': self.professional_user_id,
            'professional_name': self.professional_name,
            'professional_email': self.professional_user.email if self.professional_user else None,
            'responsable_filial': self.responsable_filial,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_open': self.end_date is None,
            'status': self.status,
            'notes': self.notes,
            'created_by_user_id': self.created_by_user_id,
            'created_by_name': self.created_by.name if self.created_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def current_for_aliado(cls, aliado_id, ref_date=None):
        if ref_date is None:
            ref_date = date.today()
        q = cls.query.filter_by(aliado_id=aliado_id).filter(cls.start_date <= ref_date)
        q = q.filter(db.or_(cls.end_date == None, cls.end_date >= ref_date))
        return q.order_by(cls.start_date.desc()).first()

    def __repr__(self):
        return f'<AliadoAssignment aliado={self.aliado_id} prof={self.professional_name} {self.start_date}-{self.end_date}>'
