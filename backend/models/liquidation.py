from extensions import db
from datetime import datetime

class Liquidation(db.Model):
    __tablename__ = 'liquidations'

    id = db.Column(db.Integer, primary_key=True)
    period_id = db.Column(db.Integer, db.ForeignKey('periods.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    business_unit_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, submitted, approved, rejected, paid
    llave_score = db.Column(db.Float, nullable=True)  # Overall score
    premium_pct = db.Column(db.Float, nullable=True)  # Premium percentage
    base_salary = db.Column(db.Float, nullable=True)  # Base salary for calculation
    premium_amount = db.Column(db.Float, nullable=True)  # Calculated premium
    details = db.Column(db.JSON, nullable=True)  # Full breakdown by llave/kpi
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = db.Column(db.DateTime, nullable=True)

    period = db.relationship('Period', backref='liquidations')
    user = db.relationship('User', backref='liquidations')
    business_unit = db.relationship('BusinessUnit', backref='liquidations')

    def to_dict(self):
        return {
            'id': self.id,
            'period_id': self.period_id,
            'user_id': self.user_id,
            'business_unit_id': self.business_unit_id,
            'status': self.status,
            'llave_score': self.llave_score,
            'premium_pct': self.premium_pct,
            'base_salary': self.base_salary,
            'premium_amount': self.premium_amount,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
        }

    def __repr__(self):
        return f'<Liquidation {self.period_id} {self.user_id}>'
