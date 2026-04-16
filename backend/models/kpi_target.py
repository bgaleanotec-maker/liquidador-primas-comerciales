from extensions import db
from datetime import datetime

class KPITarget(db.Model):
    __tablename__ = 'kpi_targets'

    id = db.Column(db.Integer, primary_key=True)
    kpi_id = db.Column(db.Integer, db.ForeignKey('kpis.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('periods.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # null = group target
    target_value = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    kpi = db.relationship('KPI', backref='targets')
    period = db.relationship('Period', backref='kpi_targets')
    user = db.relationship('User', foreign_keys=[user_id], backref='kpi_targets_as_user')
    created_by = db.relationship('User', foreign_keys=[created_by_id])

    __table_args__ = (
        db.UniqueConstraint('kpi_id', 'period_id', 'user_id', name='uq_kpi_period_user'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'kpi_id': self.kpi_id,
            'period_id': self.period_id,
            'user_id': self.user_id,
            'target_value': self.target_value,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by_id': self.created_by_id,
        }

    def __repr__(self):
        return f'<KPITarget {self.kpi_id} {self.period_id}>'
