from extensions import db
from models import (
    User, BusinessUnit, Llave, KPI, Period, KPITarget, KPIResult,
    Liquidation, ApprovalStep, DataSource, AuditLog
)
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


def seed():
    """Seed the database with initial data"""
    try:
        logger.info("Starting database seed...")

        # Create business units
        business_units = [
            {'code': 'VL', 'name': 'Vanti Listo', 'description': 'Venti Listo Unit'},
            {'code': 'VM', 'name': 'Vanti Max', 'description': 'Vanti Max Unit'},
            {'code': 'NE', 'name': 'Nueva Edificación', 'description': 'Nueva Edificación Unit'},
            {'code': 'SIC', 'name': 'SIC (Negociaciones)', 'description': 'SIC Negotiations Unit'},
            {'code': 'SAT', 'name': 'Saturación', 'description': 'Saturación y Contratistas Unit'},
            {'code': 'COM', 'name': 'Comercial', 'description': 'Comercial Unit'},
        ]

        bu_objects = {}
        for bu_data in business_units:
            bu = BusinessUnit.query.filter_by(code=bu_data['code']).first()
            if not bu:
                bu = BusinessUnit(**bu_data)
                db.session.add(bu)
            bu_objects[bu_data['code']] = bu

        db.session.commit()
        logger.info("Created business units")

        # Create test users
        users_data = [
            {
                'email': 'superadmin@primax.com',
                'name': 'Super Admin',
                'password': 'SuperAdmin2024!',
                'role': 'super_admin',
                'business_unit_id': None
            },
            {
                'email': 'admin@primax.com',
                'name': 'Admin User',
                'password': 'Admin2024!',
                'role': 'admin',
                'business_unit_id': None
            },
            {
                'email': 'aprobador@primax.com',
                'name': 'Approver User',
                'password': 'Approver2024!',
                'role': 'approver',
                'business_unit_id': None
            },
            {
                'email': 'analista.vl@primax.com',
                'name': 'Analyst VL',
                'password': 'Analyst2024!',
                'role': 'analyst',
                'business_unit_id': bu_objects['VL'].id
            },
            {
                'email': 'analista.sat@primax.com',
                'name': 'Analyst SAT',
                'password': 'Analyst2024!',
                'role': 'analyst',
                'business_unit_id': bu_objects['SAT'].id
            },
            {
                'email': 'analista.com@primax.com',
                'name': 'Analyst COM',
                'password': 'Analyst2024!',
                'role': 'analyst',
                'business_unit_id': bu_objects['COM'].id
            },
            {
                'email': 'viewer@primax.com',
                'name': 'Viewer User',
                'password': 'Viewer2024!',
                'role': 'viewer',
                'business_unit_id': None
            },
        ]

        user_objects = {}
        for user_data in users_data:
            user = User.query.filter_by(email=user_data['email']).first()
            if not user:
                user = User(
                    email=user_data['email'],
                    name=user_data['name'],
                    role=user_data['role'],
                    business_unit_id=user_data['business_unit_id'],
                    is_active=True
                )
                user.set_password(user_data['password'])
                db.session.add(user)
            user_objects[user_data['email']] = user

        db.session.commit()
        logger.info("Created test users")

        # Create SIC structure
        sic_llave_1 = Llave(
            business_unit_id=bu_objects['SIC'].id,
            code='1',
            name='Negociaciones Individuales',
            weight=0.65,
            level=0
        )
        db.session.add(sic_llave_1)
        db.session.commit()

        sic_kpi_1_1 = KPI(
            llave_id=sic_llave_1.id,
            name='Cantidades negociaciones',
            weight=0.35,
            source_type='manual',
            source_system='Manual'
        )
        sic_kpi_1_2 = KPI(
            llave_id=sic_llave_1.id,
            name='% recuperaciones',
            weight=0.30,
            source_type='manual',
            source_system='Manual'
        )
        db.session.add(sic_kpi_1_1)
        db.session.add(sic_kpi_1_2)

        sic_llave_2 = Llave(
            business_unit_id=bu_objects['SIC'].id,
            code='2',
            name='Valor total negociaciones',
            weight=0.35,
            level=0
        )
        db.session.add(sic_llave_2)
        db.session.commit()

        sic_kpi_2 = KPI(
            llave_id=sic_llave_2.id,
            name='Valor total negociaciones',
            weight=1.0,
            source_type='manual',
            source_system='Manual'
        )
        db.session.add(sic_kpi_2)
        db.session.commit()

        logger.info("Created SIC structure")

        # Create SAT structure
        sat_llave_1 = Llave(
            business_unit_id=bu_objects['SAT'].id,
            code='1',
            name='# De Altas Contratista',
            weight=0.3,
            level=0
        )
        db.session.add(sat_llave_1)
        db.session.commit()

        sat_kpi_1 = KPI(
            llave_id=sat_llave_1.id,
            name='# De Altas Contratista',
            weight=1.0,
            source_type='semiautomatico',
            source_system='Power BI'
        )
        db.session.add(sat_kpi_1)

        sat_llave_2 = Llave(
            business_unit_id=bu_objects['SAT'].id,
            code='2',
            name='$ Margen De II',
            weight=0.7,
            level=0
        )
        db.session.add(sat_llave_2)
        db.session.commit()

        sat_kpi_2_1 = KPI(
            llave_id=sat_llave_2.id,
            name='% Market Share',
            weight=0.45,
            source_type='semiautomatico',
            source_system='Power BI'
        )
        sat_kpi_2_2 = KPI(
            llave_id=sat_llave_2.id,
            name='GASODOMESTICOS total',
            weight=0.40,
            source_type='manual',
            source_system='Manual'
        )
        sat_kpi_2_3 = KPI(
            llave_id=sat_llave_2.id,
            name='Encuesta Satisfaccion',
            weight=0.15,
            source_type='manual',
            source_system='Manual'
        )
        db.session.add_all([sat_kpi_2_1, sat_kpi_2_2, sat_kpi_2_3])
        db.session.commit()

        logger.info("Created SAT structure")

        # Create COM structure
        com_llave_1 = Llave(
            business_unit_id=bu_objects['COM'].id,
            code='1',
            name='# De Altas Totales',
            weight=0.3,
            level=0
        )
        db.session.add(com_llave_1)
        db.session.commit()

        com_kpi_1 = KPI(
            llave_id=com_llave_1.id,
            name='# De Altas Totales',
            weight=1.0,
            source_type='semiautomatico',
            source_system='Power BI'
        )
        db.session.add(com_kpi_1)

        com_llave_2 = Llave(
            business_unit_id=bu_objects['COM'].id,
            code='2',
            name='$ Margen Total Dirección',
            weight=0.7,
            level=0
        )
        db.session.add(com_llave_2)
        db.session.commit()

        com_kpi_2_1 = KPI(
            llave_id=com_llave_2.id,
            name='Volumen gas',
            weight=0.25,
            source_type='manual',
            source_system='Manual'
        )
        com_kpi_2_2 = KPI(
            llave_id=com_llave_2.id,
            name='TPEs CONTRATISTAS Depurado',
            weight=0.20,
            source_type='automatico',
            source_system='SAP'
        )
        com_kpi_2_3 = KPI(
            llave_id=com_llave_2.id,
            name='# de Artefactos',
            weight=0.15,
            source_type='manual',
            source_system='Manual'
        )
        com_kpi_2_4 = KPI(
            llave_id=com_llave_2.id,
            name='% Efectividad DE',
            weight=0.20,
            source_type='manual',
            source_system='Manual'
        )
        com_kpi_2_5 = KPI(
            llave_id=com_llave_2.id,
            name='Encuesta Satisfaccion',
            weight=0.20,
            source_type='manual',
            source_system='Manual'
        )
        db.session.add_all([com_kpi_2_1, com_kpi_2_2, com_kpi_2_3, com_kpi_2_4, com_kpi_2_5])
        db.session.commit()

        logger.info("Created COM structure")

        # Create VL structure (simplified)
        vl_llave_1 = Llave(
            business_unit_id=bu_objects['VL'].id,
            code='1',
            name='Ventas/Colocaciones',
            weight=0.5,
            level=0
        )
        db.session.add(vl_llave_1)
        db.session.commit()

        vl_kpi_1_1 = KPI(
            llave_id=vl_llave_1.id,
            name='Llave 1 Principal',
            weight=0.4,
            source_type='automatico',
            source_system='Vantilisto'
        )
        vl_kpi_1_2 = KPI(
            llave_id=vl_llave_1.id,
            name='Colocación Nuevos Aliados',
            weight=0.3,
            source_type='automatico',
            source_system='Vantilisto'
        )
        vl_kpi_1_3 = KPI(
            llave_id=vl_llave_1.id,
            name='Total Llave 1',
            weight=0.3,
            source_type='automatico',
            source_system='Vantilisto'
        )
        db.session.add_all([vl_kpi_1_1, vl_kpi_1_2, vl_kpi_1_3])

        vl_llave_2 = Llave(
            business_unit_id=bu_objects['VL'].id,
            code='2',
            name='Gestión Especializada',
            weight=0.5,
            level=0
        )
        db.session.add(vl_llave_2)
        db.session.commit()

        vl_kpi_2_1 = KPI(
            llave_id=vl_llave_2.id,
            name='KPI 2 Motos',
            weight=0.3,
            source_type='automatico',
            source_system='Vantilisto'
        )
        vl_kpi_2_2 = KPI(
            llave_id=vl_llave_2.id,
            name='KPI 2 Gasodomésticos',
            weight=0.3,
            source_type='manual',
            source_system='Manual'
        )
        vl_kpi_2_3 = KPI(
            llave_id=vl_llave_2.id,
            name='SAC+ Marketplace',
            weight=0.2,
            source_type='manual',
            source_system='Manual'
        )
        vl_kpi_2_4 = KPI(
            llave_id=vl_llave_2.id,
            name='Estaciones GNV',
            weight=0.2,
            source_type='automatico',
            source_system='Vantilisto'
        )
        db.session.add_all([vl_kpi_2_1, vl_kpi_2_2, vl_kpi_2_3, vl_kpi_2_4])
        db.session.commit()

        logger.info("Created VL structure")

        # Create current period
        now = datetime.utcnow()
        period = Period.query.filter_by(year=now.year, month=now.month).first()
        if not period:
            period = Period(year=now.year, month=now.month, status='open')
            db.session.add(period)
            db.session.commit()

        logger.info("Created periods")

        # Create sample KPI targets
        all_kpis = KPI.query.all()
        for kpi in all_kpis[:5]:
            target = KPITarget.query.filter_by(kpi_id=kpi.id, period_id=period.id, user_id=None).first()
            if not target:
                target = KPITarget(
                    kpi_id=kpi.id,
                    period_id=period.id,
                    user_id=None,
                    target_value=100.0,
                    created_by_id=user_objects['admin@primax.com'].id
                )
                db.session.add(target)

        db.session.commit()
        logger.info("Created KPI targets")

        # Create sample KPI results
        analyst_users = [user_objects[email] for email in ['analista.vl@primax.com', 'analista.sat@primax.com', 'analista.com@primax.com']]
        for user in analyst_users:
            for kpi in all_kpis[:5]:
                result = KPIResult.query.filter_by(kpi_id=kpi.id, period_id=period.id, user_id=user.id).first()
                if not result:
                    result = KPIResult(
                        kpi_id=kpi.id,
                        period_id=period.id,
                        user_id=user.id,
                        actual_value=85.0,
                        meta_value=100.0,
                        source='seed_data',
                        uploaded_by_id=user_objects['admin@primax.com'].id
                    )
                    db.session.add(result)

        db.session.commit()
        logger.info("Created KPI results")

        # Create sample liquidations
        for user in analyst_users:
            liquidation = Liquidation.query.filter_by(period_id=period.id, user_id=user.id).first()
            if not liquidation:
                liquidation = Liquidation(
                    period_id=period.id,
                    user_id=user.id,
                    business_unit_id=user.business_unit_id,
                    status='draft',
                    llave_score=0.85,
                    premium_pct=8.5,
                    base_salary=50000.0,
                    premium_amount=4250.0,
                    details={'breakdown': 'sample'}
                )
                db.session.add(liquidation)

        db.session.commit()
        logger.info("Created liquidations")

        # Create sample approval steps
        liquidations = Liquidation.query.filter_by(period_id=period.id).all()
        for liquidation in liquidations:
            existing_step = ApprovalStep.query.filter_by(liquidation_id=liquidation.id).first()
            if not existing_step:
                step = ApprovalStep(
                    liquidation_id=liquidation.id,
                    step_order=1,
                    approver_id=user_objects['aprobador@primax.com'].id,
                    status='pending',
                    required_role='approver'
                )
                db.session.add(step)

        db.session.commit()
        logger.info("Created approval steps")

        # Create data sources
        data_sources_data = [
            {
                'name': 'Power BI - SAP',
                'source_type': 'bigquery',
                'business_unit_id': None,
                'config': {'endpoint': 'https://api.powerbi.com'}
            },
            {
                'name': 'Vantilisto API',
                'source_type': 'api',
                'business_unit_id': bu_objects['VL'].id,
                'config': {'endpoint': 'https://api.vantilisto.com'}
            },
            {
                'name': 'SAP Connection',
                'source_type': 'api',
                'business_unit_id': None,
                'config': {'endpoint': 'https://sap.company.com/odata'}
            },
        ]

        for ds_data in data_sources_data:
            ds = DataSource.query.filter_by(name=ds_data['name']).first()
            if not ds:
                ds = DataSource(**ds_data)
                db.session.add(ds)

        db.session.commit()
        logger.info("Created data sources")

        logger.info("Database seed completed successfully!")

    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        db.session.rollback()
        raise


if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        seed()
