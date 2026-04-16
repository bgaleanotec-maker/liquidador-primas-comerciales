from extensions import db
from datetime import datetime


class CommissionPayment(db.Model):
    __tablename__ = 'commission_payments'

    id = db.Column(db.Integer, primary_key=True)
    period_id = db.Column(db.Integer, db.ForeignKey('periods.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('sales_professionals.id'), nullable=False)
    business_unit_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=False)
    total_sales = db.Column(db.Float, nullable=False, default=0.0)
    total_commission = db.Column(db.Float, nullable=False, default=0.0)
    llave_score = db.Column(db.Float, nullable=True)
    premium_pct = db.Column(db.Float, nullable=True)
    premium_amount = db.Column(db.Float, nullable=True)
    base_salary = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='calculated')  # calculated, approved, paid
    payment_date = db.Column(db.Date, nullable=True)
    payment_reference = db.Column(db.String(255), nullable=True)
    details = db.Column(db.JSON, nullable=True)
    published_at = db.Column(db.DateTime, nullable=True)  # When published to professional (dia 10)
    claim_deadline = db.Column(db.DateTime, nullable=True)  # End of claim period
    auto_approved = db.Column(db.Boolean, default=False)  # If auto-approved by escalation
    escalated_at = db.Column(db.DateTime, nullable=True)  # When escalated to superior
    escalation_level = db.Column(db.Integer, default=0)  # 0=not escalated, 1=leader, 2=superior
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    period = db.relationship('Period', backref='commission_payments')
    professional = db.relationship('SalesProfessional', backref='commission_payments')
    business_unit = db.relationship('BusinessUnit', backref='commission_payments')

    def to_dict(self):
        return {
            'id': self.id,
            'period_id': self.period_id,
            'period_name': self.period.name if self.period else None,
            'professional_id': self.professional_id,
            'professional_name': self.professional.name if self.professional else None,
            'professional_code': self.professional.code if self.professional else None,
            'business_unit_id': self.business_unit_id,
            'business_unit': self.business_unit.code if self.business_unit else None,
            'total_sales': self.total_sales,
            'total_commission': self.total_commission,
            'llave_score': self.llave_score,
            'premium_pct': self.premium_pct,
            'premium_amount': self.premium_amount,
            'base_salary': self.base_salary,
            'status': self.status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_reference': self.payment_reference,
            'details': self.details,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'claim_deadline': self.claim_deadline.isoformat() if self.claim_deadline else None,
            'auto_approved': self.auto_approved,
            'escalated_at': self.escalated_at.isoformat() if self.escalated_at else None,
            'escalation_level': self.escalation_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<CommissionPayment {self.id} {self.status}>'
