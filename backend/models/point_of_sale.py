from extensions import db
from datetime import datetime


class PointOfSale(db.Model):
    __tablename__ = 'points_of_sale'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(500), nullable=True)
    city = db.Column(db.String(120), nullable=True)
    business_unit_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    business_unit = db.relationship('BusinessUnit', backref='points_of_sale')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'business_unit_id': self.business_unit_id,
            'business_unit': self.business_unit.code if self.business_unit else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<PointOfSale {self.code}>'
