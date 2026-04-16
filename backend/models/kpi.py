from extensions import db
from datetime import datetime
import json

class KPI(db.Model):
    __tablename__ = 'kpis'

    id = db.Column(db.Integer, primary_key=True)
    llave_id = db.Column(db.Integer, db.ForeignKey('llaves.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    weight = db.Column(db.Float, default=0.0)  # % weight within the llave
    source_type = db.Column(db.String(50), nullable=False)  # automatico, manual, semiautomatico
    source_system = db.Column(db.String(100), nullable=True)  # Power BI, Vantilisto, SAP, CSV, Email, Teams
    source_config = db.Column(db.JSON, nullable=True)  # Additional config for the data source
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    llave = db.relationship('Llave', backref='kpis')

    def to_dict(self):
        return {
            'id': self.id,
            'llave_id': self.llave_id,
            'name': self.name,
            'description': self.description,
            'weight': self.weight,
            'source_type': self.source_type,
            'source_system': self.source_system,
            'source_config': self.source_config,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<KPI {self.name}>'
