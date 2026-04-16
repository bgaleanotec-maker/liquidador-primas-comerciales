from extensions import db
from datetime import datetime


class Objection(db.Model):
    __tablename__ = 'objections'

    id = db.Column(db.Integer, primary_key=True)
    commission_payment_id = db.Column(db.Integer, db.ForeignKey('commission_payments.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('sales_professionals.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('periods.id'), nullable=False)

    # What they're objecting
    objection_type = db.Column(db.String(50))  # 'sale_missing', 'value_incorrect', 'assignment_wrong', 'pqr_dispute', 'other'
    description = db.Column(db.Text, nullable=False)

    # Association variable (e.g., PQR number, sale ID, contract number)
    reference_type = db.Column(db.String(50))  # 'pqr', 'sale', 'contract', 'kpi'
    reference_value = db.Column(db.String(200))  # The actual reference number/ID

    # Resolution
    status = db.Column(db.String(20), default='pending')  # 'pending', 'under_review', 'accepted', 'rejected', 'expired'
    resolution_notes = db.Column(db.Text, nullable=True)
    resolved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Claim period control
    claim_deadline = db.Column(db.DateTime, nullable=False)  # After this, can't claim

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    commission_payment = db.relationship('CommissionPayment', backref='objections')
    professional = db.relationship('SalesProfessional')
    period = db.relationship('Period')
    resolved_by = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'commission_payment_id': self.commission_payment_id,
            'professional_id': self.professional_id,
            'professional_name': self.professional.name if self.professional else None,
            'period_id': self.period_id,
            'period_name': self.period.name if self.period else None,
            'objection_type': self.objection_type,
            'description': self.description,
            'reference_type': self.reference_type,
            'reference_value': self.reference_value,
            'status': self.status,
            'resolution_notes': self.resolution_notes,
            'resolved_by_id': self.resolved_by_id,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'claim_deadline': self.claim_deadline.isoformat() if self.claim_deadline else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Objection {self.id} {self.status}>'
