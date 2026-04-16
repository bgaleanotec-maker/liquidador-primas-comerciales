from extensions import db
from datetime import datetime

class KPIResult(db.Model):
    __tablename__ = 'kpi_results'

    id = db.Column(db.Integer, primary_key=True)
    kpi_id = db.Column(db.Integer, db.ForeignKey('kpis.id'), nullable=False)
    period_id = db.Column(db.Integer, db.ForeignKey('periods.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    actual_value = db.Column(db.Float, nullable=False)
    meta_value = db.Column(db.Float, nullable=True)  # Target/goal value
    source = db.Column(db.String(100), nullable=True)  # Where this came from
    file_path = db.Column(db.String(255), nullable=True)  # Path to uploaded file
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, submitted, validated
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    kpi = db.relationship('KPI', backref='results')
    period = db.relationship('Period', backref='kpi_results')
    user = db.relationship('User', foreign_keys=[user_id], backref='kpi_results')
    uploaded_by = db.relationship('User', foreign_keys=[uploaded_by_id])

    @property
    def cumplimiento(self):
        """Calculate compliance rate: actual / meta"""
        if self.meta_value and self.meta_value > 0:
            return (self.actual_value / self.meta_value) * 100
        return 0.0

    def to_dict(self):
        return {
            'id': self.id,
            'kpi_id': self.kpi_id,
            'period_id': self.period_id,
            'user_id': self.user_id,
            'actual_value': self.actual_value,
            'meta_value': self.meta_value,
            'cumplimiento': self.cumplimiento,
            'source': self.source,
            'file_path': self.file_path,
            'notes': self.notes,
            'status': self.status,
            'uploaded_by_id': self.uploaded_by_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<KPIResult {self.kpi_id} {self.period_id} {self.user_id}>'
