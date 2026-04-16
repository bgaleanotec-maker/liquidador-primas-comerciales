from extensions import db
from datetime import datetime


class LlaveConfig(db.Model):
    __tablename__ = 'llave_configs'

    id = db.Column(db.Integer, primary_key=True)
    business_unit_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('periods.id'), nullable=False)
    llave_id = db.Column(db.Integer, db.ForeignKey('llaves.id'), nullable=False)
    weight_override = db.Column(db.Float, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    configured_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    business_unit = db.relationship('BusinessUnit', backref='llave_configs')
    period = db.relationship('Period', backref='llave_configs')
    llave = db.relationship('Llave', backref='configs')
    configured_by = db.relationship('User', backref='llave_configs')

    __table_args__ = (
        db.UniqueConstraint('business_unit_id', 'period_id', 'llave_id', name='uq_bu_period_llave'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'business_unit_id': self.business_unit_id,
            'business_unit': self.business_unit.code if self.business_unit else None,
            'period_id': self.period_id,
            'period_name': self.period.name if self.period else None,
            'llave_id': self.llave_id,
            'llave_code': self.llave.code if self.llave else None,
            'llave_name': self.llave.name if self.llave else None,
            'weight_override': self.weight_override,
            'is_active': self.is_active,
            'configured_by_id': self.configured_by_id,
            'configured_by_name': self.configured_by.name if self.configured_by else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<LlaveConfig {self.llave_id} period={self.period_id}>'
