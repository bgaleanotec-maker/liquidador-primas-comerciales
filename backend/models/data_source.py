from extensions import db
from datetime import datetime

class DataSource(db.Model):
    __tablename__ = 'data_sources'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    source_type = db.Column(db.String(50), nullable=False)  # csv, bigquery, api, email
    business_unit_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=True)  # null = global
    config = db.Column(db.JSON, nullable=True)  # Connection config
    is_active = db.Column(db.Boolean, default=True)
    last_sync = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business_unit = db.relationship('BusinessUnit', backref='data_sources')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'source_type': self.source_type,
            'business_unit_id': self.business_unit_id,
            'config': self.config,
            'is_active': self.is_active,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<DataSource {self.name}>'
