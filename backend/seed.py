from extensions import db
from models import (
    User, BusinessUnit, Llave, KPI, Period, KPITarget, KPIResult,
    Liquidation, ApprovalStep, DataSource, AuditLog,
    PointOfSale, SalesProfessional, ProfessionalAssignment, Sale,
    CommissionPayment, LlaveConfig
)
from datetime import datetime, timedelta, date
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

        # ─── VantiListo (VL) Sales Data ──────────────────────────────────────

        vl_bu = bu_objects['VL']

        # Create Points of Sale for VL
        pdv_data = [
            {'code': 'EXITO_001', 'name': 'Exito Calle 80', 'address': 'Calle 80 #50-20', 'city': 'Bogota'},
            {'code': 'JUMBO_001', 'name': 'Jumbo Norte', 'address': 'Av. 9 #127-30', 'city': 'Bogota'},
            {'code': 'ALKOSTO_001', 'name': 'Alkosto Centro', 'address': 'Cra 10 #15-30', 'city': 'Bogota'},
            {'code': 'HOMECENTER_001', 'name': 'Homecenter Sur', 'address': 'Autopista Sur #60-50', 'city': 'Bogota'},
            {'code': 'SAO_001', 'name': 'SAO Unicentro', 'address': 'Cra 15 #124-30', 'city': 'Bogota'},
            {'code': 'FALABELLA_001', 'name': 'Falabella Titan', 'address': 'Av. Boyaca #80-94', 'city': 'Bogota'},
        ]

        pdv_objects = {}
        for pdv_item in pdv_data:
            pdv = PointOfSale.query.filter_by(code=pdv_item['code']).first()
            if not pdv:
                pdv = PointOfSale(
                    code=pdv_item['code'],
                    name=pdv_item['name'],
                    address=pdv_item['address'],
                    city=pdv_item['city'],
                    business_unit_id=vl_bu.id,
                    is_active=True
                )
                db.session.add(pdv)
            pdv_objects[pdv_item['code']] = pdv

        db.session.commit()
        logger.info("Created VL points of sale")

        # Create Sales Professionals for VL
        prof_data = [
            {'code': 'VL-001', 'name': 'Juan Perez', 'email': 'juan.perez@primax.com', 'phone': '3001234567', 'status': 'active'},
            {'code': 'VL-002', 'name': 'Maria Lopez', 'email': 'maria.lopez@primax.com', 'phone': '3009876543', 'status': 'active'},
            {'code': 'VL-003', 'name': 'Carlos Gomez', 'email': 'carlos.gomez@primax.com', 'phone': '3005551234', 'status': 'active'},
            {'code': 'VL-004', 'name': 'Ana Rodriguez', 'email': 'ana.rodriguez@primax.com', 'phone': '3007778899', 'status': 'active'},
            {'code': 'VL-005', 'name': 'Daniel Torres', 'email': 'daniel.torres@primax.com', 'phone': '3004443322', 'status': 'vacation'},
        ]

        prof_objects = {}
        for prof_item in prof_data:
            prof = SalesProfessional.query.filter_by(code=prof_item['code']).first()
            if not prof:
                prof = SalesProfessional(
                    code=prof_item['code'],
                    name=prof_item['name'],
                    email=prof_item['email'],
                    phone=prof_item['phone'],
                    status=prof_item['status'],
                    business_unit_id=vl_bu.id
                )
                db.session.add(prof)
            prof_objects[prof_item['code']] = prof

        db.session.commit()
        logger.info("Created VL sales professionals")

        # Create assignments for current period
        assignment_map = [
            ('VL-001', 'EXITO_001'),
            ('VL-001', 'JUMBO_001'),
            ('VL-002', 'ALKOSTO_001'),
            ('VL-002', 'HOMECENTER_001'),
            ('VL-003', 'SAO_001'),
            ('VL-004', 'FALABELLA_001'),
            ('VL-004', 'EXITO_001'),
        ]

        for prof_code, pdv_code in assignment_map:
            existing = ProfessionalAssignment.query.filter_by(
                professional_id=prof_objects[prof_code].id,
                point_of_sale_id=pdv_objects[pdv_code].id,
                period_id=period.id
            ).first()
            if not existing:
                assignment = ProfessionalAssignment(
                    professional_id=prof_objects[prof_code].id,
                    point_of_sale_id=pdv_objects[pdv_code].id,
                    period_id=period.id,
                    start_date=date(now.year, now.month, 1),
                    is_active=True
                )
                db.session.add(assignment)

        db.session.commit()
        logger.info("Created VL professional assignments")

        # Create sample sales for current period
        product_types = ['gas_natural', 'gasodomestico', 'seguro_hogar', 'mantenimiento']
        sample_sales = [
            ('VL-001', 'EXITO_001', 'gas_natural', 'Pedro Martinez', 'CONT-2026-001', 1500000, 75000),
            ('VL-001', 'EXITO_001', 'gasodomestico', 'Laura Sanchez', 'CONT-2026-002', 850000, 42500),
            ('VL-001', 'JUMBO_001', 'seguro_hogar', 'Roberto Diaz', 'CONT-2026-003', 320000, 16000),
            ('VL-002', 'ALKOSTO_001', 'gas_natural', 'Carmen Ruiz', 'CONT-2026-004', 2100000, 105000),
            ('VL-002', 'ALKOSTO_001', 'mantenimiento', 'Luis Garcia', 'CONT-2026-005', 450000, 22500),
            ('VL-002', 'HOMECENTER_001', 'gas_natural', 'Sofia Herrera', 'CONT-2026-006', 1800000, 90000),
            ('VL-003', 'SAO_001', 'gasodomestico', 'Andres Moreno', 'CONT-2026-007', 920000, 46000),
            ('VL-003', 'SAO_001', 'gas_natural', 'Diana Castro', 'CONT-2026-008', 1350000, 67500),
            ('VL-003', 'SAO_001', 'seguro_hogar', 'Felipe Ortiz', 'CONT-2026-009', 280000, 14000),
            ('VL-004', 'FALABELLA_001', 'gas_natural', 'Patricia Vargas', 'CONT-2026-010', 1750000, 87500),
            ('VL-004', 'FALABELLA_001', 'gasodomestico', 'Miguel Angel', 'CONT-2026-011', 680000, 34000),
            ('VL-004', 'EXITO_001', 'mantenimiento', 'Claudia Reyes', 'CONT-2026-012', 390000, 19500),
            ('VL-001', 'EXITO_001', 'gas_natural', 'Oscar Mendoza', 'CONT-2026-013', 2300000, 115000),
            ('VL-002', 'HOMECENTER_001', 'gasodomestico', 'Isabel Paredes', 'CONT-2026-014', 750000, 37500),
            ('VL-003', 'SAO_001', 'gas_natural', 'Javier Rios', 'CONT-2026-015', 1100000, 55000),
        ]

        admin_user = user_objects['admin@primax.com']
        for idx, (prof_code, pdv_code, product, client, contract, value, commission) in enumerate(sample_sales):
            sale_day = min(idx + 1, 28)  # Spread across the month
            existing_sale = Sale.query.filter_by(contract_number=contract).first()
            if not existing_sale:
                sale = Sale(
                    sale_date=date(now.year, now.month, sale_day),
                    period_id=period.id,
                    point_of_sale_id=pdv_objects[pdv_code].id,
                    professional_id=prof_objects[prof_code].id,
                    business_unit_id=vl_bu.id,
                    product_type=product,
                    client_name=client,
                    contract_number=contract,
                    sale_value=float(value),
                    commission_value=float(commission),
                    status='validated',
                    source='seed_data',
                    uploaded_by_id=admin_user.id
                )
                db.session.add(sale)

        db.session.commit()
        logger.info("Created VL sample sales")

        # Create sample commission payments
        commission_data = [
            ('VL-001', 4650000, 232500, 0.85, 8.5, 2500000),
            ('VL-002', 5100000, 255000, 0.90, 9.0, 2500000),
            ('VL-003', 3650000, 182500, 0.78, 7.8, 2500000),
            ('VL-004', 2820000, 141000, 0.82, 8.2, 2500000),
        ]

        for prof_code, total_sales, total_comm, score, pct, base in commission_data:
            existing_payment = CommissionPayment.query.filter_by(
                period_id=period.id,
                professional_id=prof_objects[prof_code].id,
                business_unit_id=vl_bu.id
            ).first()
            if not existing_payment:
                payment = CommissionPayment(
                    period_id=period.id,
                    professional_id=prof_objects[prof_code].id,
                    business_unit_id=vl_bu.id,
                    total_sales=float(total_sales),
                    total_commission=float(total_comm),
                    llave_score=score,
                    premium_pct=pct,
                    premium_amount=base * (pct / 100),
                    base_salary=float(base),
                    status='calculated',
                    details={'source': 'seed_data'}
                )
                db.session.add(payment)

        db.session.commit()
        logger.info("Created VL commission payments")

        logger.info("Database seed completed successfully!")

    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        db.session.rollback()
        raise


def seed_sales_data():
    """Seed sales data independently (for existing databases that need new tables populated)"""
    from models import (BusinessUnit, Period, User, PointOfSale, SalesProfessional,
                        ProfessionalAssignment, Sale, CommissionPayment)
    from datetime import date, datetime

    try:
        now = datetime.utcnow()
        vl_bu = BusinessUnit.query.filter_by(code='VL').first()
        if not vl_bu:
            logger.warning("VL business unit not found, skipping sales seed")
            return

        period = Period.query.filter_by(year=now.year, month=now.month).first()
        if not period:
            period = Period(year=now.year, month=now.month, status='open')
            db.session.add(period)
            db.session.commit()

        admin_user = User.query.filter_by(role='admin').first()

        # Points of Sale
        pdv_data = [
            {'code': 'EXITO_001', 'name': 'Exito Calle 80', 'address': 'Calle 80 #50-20', 'city': 'Bogota'},
            {'code': 'JUMBO_001', 'name': 'Jumbo Norte', 'address': 'Av. 9 #127-30', 'city': 'Bogota'},
            {'code': 'ALKOSTO_001', 'name': 'Alkosto Centro', 'address': 'Cra 10 #15-30', 'city': 'Bogota'},
            {'code': 'HOMECENTER_001', 'name': 'Homecenter Sur', 'address': 'Autopista Sur #60-50', 'city': 'Bogota'},
            {'code': 'SAO_001', 'name': 'SAO Unicentro', 'address': 'Cra 15 #124-30', 'city': 'Bogota'},
            {'code': 'FALABELLA_001', 'name': 'Falabella Titan', 'address': 'Av. Boyaca #80-94', 'city': 'Bogota'},
        ]
        pdv_objects = {}
        for item in pdv_data:
            pdv = PointOfSale.query.filter_by(code=item['code']).first()
            if not pdv:
                pdv = PointOfSale(code=item['code'], name=item['name'], address=item['address'],
                                  city=item['city'], business_unit_id=vl_bu.id, is_active=True)
                db.session.add(pdv)
            pdv_objects[item['code']] = pdv
        db.session.commit()
        logger.info("Seeded points of sale")

        # Professionals
        prof_data = [
            {'code': 'VL-001', 'name': 'Juan Perez', 'email': 'juan.perez@primax.com', 'status': 'active'},
            {'code': 'VL-002', 'name': 'Maria Lopez', 'email': 'maria.lopez@primax.com', 'status': 'active'},
            {'code': 'VL-003', 'name': 'Carlos Gomez', 'email': 'carlos.gomez@primax.com', 'status': 'active'},
            {'code': 'VL-004', 'name': 'Ana Rodriguez', 'email': 'ana.rodriguez@primax.com', 'status': 'active'},
            {'code': 'VL-005', 'name': 'Daniel Torres', 'email': 'daniel.torres@primax.com', 'status': 'vacation'},
        ]
        prof_objects = {}
        for item in prof_data:
            prof = SalesProfessional.query.filter_by(code=item['code']).first()
            if not prof:
                prof = SalesProfessional(code=item['code'], name=item['name'], email=item['email'],
                                         status=item['status'], business_unit_id=vl_bu.id)
                db.session.add(prof)
            prof_objects[item['code']] = prof
        db.session.commit()
        logger.info("Seeded professionals")

        # Assignments
        for prof_code, pdv_code in [('VL-001','EXITO_001'),('VL-001','JUMBO_001'),('VL-002','ALKOSTO_001'),
                                     ('VL-002','HOMECENTER_001'),('VL-003','SAO_001'),('VL-004','FALABELLA_001'),('VL-004','EXITO_001')]:
            if not ProfessionalAssignment.query.filter_by(professional_id=prof_objects[prof_code].id,
                    point_of_sale_id=pdv_objects[pdv_code].id, period_id=period.id).first():
                db.session.add(ProfessionalAssignment(professional_id=prof_objects[prof_code].id,
                    point_of_sale_id=pdv_objects[pdv_code].id, period_id=period.id,
                    start_date=date(now.year, now.month, 1), is_active=True))
        db.session.commit()
        logger.info("Seeded assignments")

        # Sales
        sales = [
            ('VL-001','EXITO_001','gas_natural','Pedro Martinez','CONT-2026-001',1500000,75000),
            ('VL-001','EXITO_001','gasodomestico','Laura Sanchez','CONT-2026-002',850000,42500),
            ('VL-001','JUMBO_001','seguro_hogar','Roberto Diaz','CONT-2026-003',320000,16000),
            ('VL-002','ALKOSTO_001','gas_natural','Carmen Ruiz','CONT-2026-004',2100000,105000),
            ('VL-002','ALKOSTO_001','mantenimiento','Luis Garcia','CONT-2026-005',450000,22500),
            ('VL-002','HOMECENTER_001','gas_natural','Sofia Herrera','CONT-2026-006',1800000,90000),
            ('VL-003','SAO_001','gasodomestico','Andres Moreno','CONT-2026-007',920000,46000),
            ('VL-003','SAO_001','gas_natural','Diana Castro','CONT-2026-008',1350000,67500),
            ('VL-003','SAO_001','seguro_hogar','Felipe Ortiz','CONT-2026-009',280000,14000),
            ('VL-004','FALABELLA_001','gas_natural','Patricia Vargas','CONT-2026-010',1750000,87500),
            ('VL-004','FALABELLA_001','gasodomestico','Miguel Angel','CONT-2026-011',680000,34000),
            ('VL-004','EXITO_001','mantenimiento','Claudia Reyes','CONT-2026-012',390000,19500),
            ('VL-001','EXITO_001','gas_natural','Oscar Mendoza','CONT-2026-013',2300000,115000),
            ('VL-002','HOMECENTER_001','gasodomestico','Isabel Paredes','CONT-2026-014',750000,37500),
            ('VL-003','SAO_001','gas_natural','Javier Rios','CONT-2026-015',1100000,55000),
        ]
        for idx, (pc, pdvc, prod, cli, cont, val, comm) in enumerate(sales):
            if not Sale.query.filter_by(contract_number=cont).first():
                db.session.add(Sale(sale_date=date(now.year, now.month, min(idx+1,28)), period_id=period.id,
                    point_of_sale_id=pdv_objects[pdvc].id, professional_id=prof_objects[pc].id,
                    business_unit_id=vl_bu.id, product_type=prod, client_name=cli, contract_number=cont,
                    sale_value=float(val), commission_value=float(comm), status='validated',
                    source='seed_data', uploaded_by_id=admin_user.id if admin_user else None))
        db.session.commit()
        logger.info("Seeded sales")

        # Commission payments
        for pc, ts, tc, sc, pct, base in [('VL-001',4650000,232500,0.85,8.5,2500000),
                ('VL-002',5100000,255000,0.90,9.0,2500000),('VL-003',3650000,182500,0.78,7.8,2500000),
                ('VL-004',2820000,141000,0.82,8.2,2500000)]:
            if not CommissionPayment.query.filter_by(period_id=period.id, professional_id=prof_objects[pc].id).first():
                db.session.add(CommissionPayment(period_id=period.id, professional_id=prof_objects[pc].id,
                    business_unit_id=vl_bu.id, total_sales=float(ts), total_commission=float(tc),
                    llave_score=sc, premium_pct=pct, premium_amount=base*(pct/100), base_salary=float(base),
                    status='calculated', details={'source': 'seed_data'}))
        db.session.commit()
        logger.info("Seeded commission payments - sales data complete!")

    except Exception as e:
        logger.error(f"Error seeding sales data: {str(e)}")
        db.session.rollback()


if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        seed()
