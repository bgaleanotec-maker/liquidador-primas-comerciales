from extensions import db
from datetime import datetime

class Llave(db.Model):
    __tablename__ = 'llaves'

    id = db.Column(db.Integer, primary_key=True)
    business_unit_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=False)
    code = db.Column(db.String(50), nullable=False)  # e.g., "1", "2", "2.1", "2.2"
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    weight = db.Column(db.Float, default=0.0)  # % weight
    parent_id = db.Column(db.Integer, db.ForeignKey('llaves.id'), nullable=True)
    level = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    version = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business_unit = db.relationship('BusinessUnit', backref='llaves')
    parent = db.relationship('Llave', remote_side=[id], backref='children')

    __table_args__ = (
        db.UniqueConstraint('business_unit_id', 'code', name='uq_bu_code'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'business_unit_id': self.business_unit_id,
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'weight': self.weight,
            'parent_id': self.parent_id,
            'level': self.level,
            'is_active': self.is_active,
            'version': self.version,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Llave {self.code}>'
