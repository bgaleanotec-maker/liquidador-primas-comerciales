from extensions import db
from datetime import datetime


class ProfessionalAssignment(db.Model):
    __tablename__ = 'professional_assignments'

    id = db.Column(db.Integer, primary_key=True)
    professional_id = db.Column(db.Integer, db.ForeignKey('sales_professionals.id'), nullable=False)
    point_of_sale_id = db.Column(db.Integer, db.ForeignKey('points_of_sale.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('periods.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    professional = db.relationship('SalesProfessional', backref='assignments')
    point_of_sale = db.relationship('PointOfSale', backref='assignments')
    period = db.relationship('Period', backref='professional_assignments')

    def to_dict(self):
        return {
            'id': self.id,
            'professional_id': self.professional_id,
            'professional_name': self.professional.name if self.professional else None,
            'professional_code': self.professional.code if self.professional else None,
            'point_of_sale_id': self.point_of_sale_id,
            'point_of_sale_name': self.point_of_sale.name if self.point_of_sale else None,
            'point_of_sale_code': self.point_of_sale.code if self.point_of_sale else None,
            'period_id': self.period_id,
            'period_name': self.period.name if self.period else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_active': self.is_active,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<ProfessionalAssignment {self.professional_id} -> {self.point_of_sale_id}>'
