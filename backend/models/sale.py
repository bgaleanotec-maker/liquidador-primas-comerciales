from extensions import db
from datetime import datetime


class Sale(db.Model):
    __tablename__ = 'sales'

    id = db.Column(db.Integer, primary_key=True)
    sale_date = db.Column(db.Date, nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('periods.id'), nullable=False)
    point_of_sale_id = db.Column(db.Integer, db.ForeignKey('points_of_sale.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('sales_professionals.id'), nullable=False)
    business_unit_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=False)
    product_type = db.Column(db.String(120), nullable=False)
    client_name = db.Column(db.String(255), nullable=True)
    contract_number = db.Column(db.String(120), nullable=True)
    sale_value = db.Column(db.Float, nullable=False)
    commission_value = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='registered')  # registered, validated, paid, cancelled
    source = db.Column(db.String(50), nullable=False, default='manual')  # csv_upload, manual, api
    notes = db.Column(db.String(500), nullable=True)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    period = db.relationship('Period', backref='sales')
    point_of_sale = db.relationship('PointOfSale', backref='sales')
    professional = db.relationship('SalesProfessional', backref='sales')
    business_unit = db.relationship('BusinessUnit', backref='sales')
    uploaded_by = db.relationship('User', backref='uploaded_sales')

    def to_dict(self):
        return {
            'id': self.id,
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'period_id': self.period_id,
            'period_name': self.period.name if self.period else None,
            'point_of_sale_id': self.point_of_sale_id,
            'point_of_sale_name': self.point_of_sale.name if self.point_of_sale else None,
            'point_of_sale_code': self.point_of_sale.code if self.point_of_sale else None,
            'professional_id': self.professional_id,
            'professional_name': self.professional.name if self.professional else None,
            'professional_code': self.professional.code if self.professional else None,
            'business_unit_id': self.business_unit_id,
            'business_unit': self.business_unit.code if self.business_unit else None,
            'product_type': self.product_type,
            'client_name': self.client_name,
            'contract_number': self.contract_number,
            'sale_value': self.sale_value,
            'commission_value': self.commission_value,
            'status': self.status,
            'source': self.source,
            'notes': self.notes,
            'uploaded_by_id': self.uploaded_by_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Sale {self.id} {self.sale_date}>'
