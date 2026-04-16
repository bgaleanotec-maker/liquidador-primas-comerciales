from extensions import db
from datetime import datetime

class ApprovalStep(db.Model):
    __tablename__ = 'approval_steps'

    id = db.Column(db.Integer, primary_key=True)
    liquidation_id = db.Column(db.Integer, db.ForeignKey('liquidations.id'), nullable=False)
    step_order = db.Column(db.Integer, nullable=False)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, approved, rejected, skipped
    comments = db.Column(db.Text, nullable=True)
    action_at = db.Column(db.DateTime, nullable=True)
    required_role = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    liquidation = db.relationship('Liquidation', backref='approval_steps')
    approver = db.relationship('User', backref='approval_steps')

    __table_args__ = (
        db.UniqueConstraint('liquidation_id', 'step_order', name='uq_liquidation_step_order'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'liquidation_id': self.liquidation_id,
            'step_order': self.step_order,
            'approver_id': self.approver_id,
            'approver': self.approver.to_dict() if self.approver else None,
            'status': self.status,
            'comments': self.comments,
            'action_at': self.action_at.isoformat() if self.action_at else None,
            'required_role': self.required_role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<ApprovalStep {self.liquidation_id} {self.step_order}>'
