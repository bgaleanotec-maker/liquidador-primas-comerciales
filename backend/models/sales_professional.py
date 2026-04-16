from extensions import db
from datetime import datetime


class SalesProfessional(db.Model):
    __tablename__ = 'sales_professionals'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='active')  # active, vacation, disability, inactive
    business_unit_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    business_unit = db.relationship('BusinessUnit', backref='sales_professionals')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'status': self.status,
            'business_unit_id': self.business_unit_id,
            'business_unit': self.business_unit.code if self.business_unit else None,
            'is_active': self.status == 'active',
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<SalesProfessional {self.code}>'
