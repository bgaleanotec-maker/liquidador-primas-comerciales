from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import (
    PointOfSale, SalesProfessional, ProfessionalAssignment,
    Sale, Period, BusinessUnit, User
)
from decorators import role_required
from io import BytesIO, StringIO
from datetime import datetime, date
import pandas as pd
import logging

logger = logging.getLogger(__name__)

sales_bp = Blueprint('sales', __name__)


# ─── Points of Sale ──────────────────────────────────────────────────────────

@sales_bp.route('/points-of-sale', methods=['GET'])
@jwt_required()
def list_points_of_sale():
    """List all points of sale"""
    try:
        business_unit_id = request.args.get('business_unit_id', None, type=int)
        is_active = request.args.get('is_active', None, type=lambda x: x.lower() == 'true')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = PointOfSale.query

        if business_unit_id:
            query = query.filter_by(business_unit_id=business_unit_id)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)

        pagination = query.order_by(PointOfSale.name).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'points_of_sale': [pdv.to_dict() for pdv in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"List points of sale error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/points-of-sale', methods=['POST'])
@role_required('super_admin', 'admin', 'analyst')
def create_point_of_sale():
    """Create a point of sale"""
    try:
        data = request.get_json()

        if not data or not data.get('code') or not data.get('name') or not data.get('business_unit_id'):
            return jsonify({'success': False, 'error': 'code, name, and business_unit_id required'}), 400

        if PointOfSale.query.filter_by(code=data['code']).first():
            return jsonify({'success': False, 'error': 'Code already exists'}), 409

        bu = BusinessUnit.query.get(data['business_unit_id'])
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        pdv = PointOfSale(
            code=data['code'],
            name=data['name'],
            address=data.get('address'),
            city=data.get('city'),
            business_unit_id=data['business_unit_id'],
            is_active=data.get('is_active', True)
        )

        db.session.add(pdv)
        db.session.commit()

        logger.info(f"Created point of sale {pdv.id}")

        return jsonify({'success': True, 'data': pdv.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create point of sale error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/points-of-sale/<int:pdv_id>', methods=['PUT'])
@role_required('super_admin', 'admin', 'analyst')
def update_point_of_sale(pdv_id):
    """Update a point of sale"""
    try:
        pdv = PointOfSale.query.get(pdv_id)

        if not pdv:
            return jsonify({'success': False, 'error': 'Point of sale not found'}), 404

        data = request.get_json()

        if 'name' in data:
            pdv.name = data['name']
        if 'address' in data:
            pdv.address = data['address']
        if 'city' in data:
            pdv.city = data['city']
        if 'is_active' in data:
            pdv.is_active = data['is_active']

        db.session.commit()
        logger.info(f"Updated point of sale {pdv_id}")

        return jsonify({'success': True, 'data': pdv.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update point of sale error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


# ─── Sales Professionals ─────────────────────────────────────────────────────

@sales_bp.route('/professionals', methods=['GET'])
@jwt_required()
def list_professionals():
    """List sales professionals"""
    try:
        business_unit_id = request.args.get('business_unit_id', None, type=int)
        status = request.args.get('status', None, type=str)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = SalesProfessional.query

        if business_unit_id:
            query = query.filter_by(business_unit_id=business_unit_id)
        if status:
            query = query.filter_by(status=status)

        pagination = query.order_by(SalesProfessional.name).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'professionals': [p.to_dict() for p in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"List professionals error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/professionals', methods=['POST'])
@role_required('super_admin', 'admin', 'analyst')
def create_professional():
    """Create a sales professional"""
    try:
        data = request.get_json()

        if not data or not data.get('code') or not data.get('name') or not data.get('business_unit_id'):
            return jsonify({'success': False, 'error': 'code, name, and business_unit_id required'}), 400

        if SalesProfessional.query.filter_by(code=data['code']).first():
            return jsonify({'success': False, 'error': 'Code already exists'}), 409

        bu = BusinessUnit.query.get(data['business_unit_id'])
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        professional = SalesProfessional(
            code=data['code'],
            name=data['name'],
            email=data.get('email'),
            phone=data.get('phone'),
            status=data.get('status', 'active'),
            business_unit_id=data['business_unit_id']
        )

        db.session.add(professional)
        db.session.commit()

        logger.info(f"Created professional {professional.id}")

        return jsonify({'success': True, 'data': professional.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create professional error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/professionals/<int:prof_id>', methods=['PUT'])
@role_required('super_admin', 'admin', 'analyst')
def update_professional(prof_id):
    """Update a sales professional"""
    try:
        professional = SalesProfessional.query.get(prof_id)

        if not professional:
            return jsonify({'success': False, 'error': 'Professional not found'}), 404

        data = request.get_json()

        if 'name' in data:
            professional.name = data['name']
        if 'email' in data:
            professional.email = data['email']
        if 'phone' in data:
            professional.phone = data['phone']
        if 'status' in data:
            professional.status = data['status']

        db.session.commit()
        logger.info(f"Updated professional {prof_id}")

        return jsonify({'success': True, 'data': professional.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update professional error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


# ─── Professional Assignments ────────────────────────────────────────────────

@sales_bp.route('/assignments', methods=['GET'])
@jwt_required()
def list_assignments():
    """List professional assignments"""
    try:
        period_id = request.args.get('period_id', None, type=int)
        professional_id = request.args.get('professional_id', None, type=int)
        point_of_sale_id = request.args.get('point_of_sale_id', None, type=int)
        is_active = request.args.get('is_active', None, type=lambda x: x.lower() == 'true')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = ProfessionalAssignment.query

        if period_id:
            query = query.filter_by(period_id=period_id)
        if professional_id:
            query = query.filter_by(professional_id=professional_id)
        if point_of_sale_id:
            query = query.filter_by(point_of_sale_id=point_of_sale_id)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)

        pagination = query.order_by(ProfessionalAssignment.created_at.desc()).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'assignments': [a.to_dict() for a in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"List assignments error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/assignments', methods=['POST'])
@role_required('super_admin', 'admin', 'analyst')
def create_assignment():
    """Create a professional assignment"""
    try:
        data = request.get_json()

        required = ['professional_id', 'point_of_sale_id', 'period_id', 'start_date']
        if not data or not all(data.get(f) for f in required):
            return jsonify({'success': False, 'error': f'{", ".join(required)} are required'}), 400

        # Validate references
        professional = SalesProfessional.query.get(data['professional_id'])
        if not professional:
            return jsonify({'success': False, 'error': 'Professional not found'}), 404

        pdv = PointOfSale.query.get(data['point_of_sale_id'])
        if not pdv:
            return jsonify({'success': False, 'error': 'Point of sale not found'}), 404

        period = Period.query.get(data['period_id'])
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        assignment = ProfessionalAssignment(
            professional_id=data['professional_id'],
            point_of_sale_id=data['point_of_sale_id'],
            period_id=data['period_id'],
            start_date=date.fromisoformat(data['start_date']),
            end_date=date.fromisoformat(data['end_date']) if data.get('end_date') else None,
            is_active=data.get('is_active', True),
            notes=data.get('notes')
        )

        db.session.add(assignment)
        db.session.commit()

        logger.info(f"Created assignment {assignment.id}")

        return jsonify({'success': True, 'data': assignment.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create assignment error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/assignments/<int:assignment_id>', methods=['PUT'])
@role_required('super_admin', 'admin', 'analyst')
def update_assignment(assignment_id):
    """Update a professional assignment"""
    try:
        assignment = ProfessionalAssignment.query.get(assignment_id)

        if not assignment:
            return jsonify({'success': False, 'error': 'Assignment not found'}), 404

        data = request.get_json()

        if 'end_date' in data:
            assignment.end_date = date.fromisoformat(data['end_date']) if data['end_date'] else None
        if 'is_active' in data:
            assignment.is_active = data['is_active']
        if 'notes' in data:
            assignment.notes = data['notes']

        db.session.commit()
        logger.info(f"Updated assignment {assignment_id}")

        return jsonify({'success': True, 'data': assignment.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update assignment error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


# ─── Sales ────────────────────────────────────────────────────────────────────

@sales_bp.route('/', methods=['GET'])
@jwt_required()
def list_sales():
    """List sales"""
    try:
        period_id = request.args.get('period_id', None, type=int)
        business_unit_id = request.args.get('business_unit_id', None, type=int)
        point_of_sale_id = request.args.get('point_of_sale_id', None, type=int)
        professional_id = request.args.get('professional_id', None, type=int)
        status = request.args.get('status', None, type=str)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = Sale.query

        if period_id:
            query = query.filter_by(period_id=period_id)
        if business_unit_id:
            query = query.filter_by(business_unit_id=business_unit_id)
        if point_of_sale_id:
            query = query.filter_by(point_of_sale_id=point_of_sale_id)
        if professional_id:
            query = query.filter_by(professional_id=professional_id)
        if status:
            query = query.filter_by(status=status)

        pagination = query.order_by(Sale.sale_date.desc()).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'sales': [s.to_dict() for s in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"List sales error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/upload-csv', methods=['POST'])
@role_required('super_admin', 'admin', 'analyst')
def upload_sales_csv():
    """Upload sales CSV file"""
    try:
        user_id = get_jwt_identity()

        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400

        file = request.files['file']
        period_id = request.form.get('period_id', type=int)
        business_unit_id = request.form.get('business_unit_id', type=int)

        if not period_id or not business_unit_id:
            return jsonify({'success': False, 'error': 'period_id and business_unit_id required'}), 400

        if not file or file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        # Read file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({'success': False, 'error': 'Only CSV and Excel files supported'}), 400

        # Validate period and BU exist
        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        bu = BusinessUnit.query.get(business_unit_id)
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        # Required columns
        required_cols = ['sale_date', 'point_of_sale_code', 'product_type', 'sale_value']
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            return jsonify({'success': False, 'error': f'Missing columns: {", ".join(missing)}'}), 400

        created = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                # Find point of sale
                pdv_code = str(row.get('point_of_sale_code', '')).strip()
                pdv = PointOfSale.query.filter_by(code=pdv_code).first()
                if not pdv:
                    errors.append(f"Row {idx + 2}: Point of sale '{pdv_code}' not found")
                    continue

                # Find professional - either from CSV column or from assignment
                prof_code = str(row.get('professional_code', '')).strip() if 'professional_code' in df.columns else ''
                professional = None

                if prof_code:
                    professional = SalesProfessional.query.filter_by(code=prof_code).first()
                    if not professional:
                        errors.append(f"Row {idx + 2}: Professional '{prof_code}' not found")
                        continue
                else:
                    # Auto-detect from assignment for this period + PdV
                    assignment = ProfessionalAssignment.query.filter_by(
                        point_of_sale_id=pdv.id,
                        period_id=period_id,
                        is_active=True
                    ).first()
                    if assignment:
                        professional = assignment.professional
                    else:
                        errors.append(f"Row {idx + 2}: No active assignment for PdV '{pdv_code}' in this period")
                        continue

                # Parse sale date
                sale_date_val = row.get('sale_date')
                if isinstance(sale_date_val, str):
                    sale_date_parsed = date.fromisoformat(sale_date_val)
                else:
                    sale_date_parsed = pd.Timestamp(sale_date_val).date()

                sale = Sale(
                    sale_date=sale_date_parsed,
                    period_id=period_id,
                    point_of_sale_id=pdv.id,
                    professional_id=professional.id,
                    business_unit_id=business_unit_id,
                    product_type=str(row.get('product_type', '')).strip(),
                    client_name=str(row.get('client_name', '')).strip() if pd.notna(row.get('client_name')) else None,
                    contract_number=str(row.get('contract_number', '')).strip() if pd.notna(row.get('contract_number')) else None,
                    sale_value=float(row['sale_value']),
                    commission_value=float(row['commission_value']) if 'commission_value' in df.columns and pd.notna(row.get('commission_value')) else None,
                    status='registered',
                    source='csv_upload',
                    uploaded_by_id=user_id
                )

                db.session.add(sale)
                created += 1

            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        db.session.commit()

        logger.info(f"Uploaded sales CSV: {created} created")

        return jsonify({
            'success': True,
            'data': {
                'created': created,
                'errors': errors
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Upload sales CSV error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/template/<bu_code>', methods=['GET'])
@jwt_required()
def download_sales_template(bu_code):
    """Download CSV template for sales upload"""
    try:
        bu = BusinessUnit.query.filter_by(code=bu_code).first()
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        # Get active points of sale for this BU
        pdvs = PointOfSale.query.filter_by(business_unit_id=bu.id, is_active=True).all()

        template_data = {
            'sale_date': ['2026-04-01'] * max(len(pdvs), 1),
            'point_of_sale_code': [pdv.code for pdv in pdvs] if pdvs else ['PDV_CODE'],
            'professional_code': ['PROF_CODE'] * max(len(pdvs), 1),
            'product_type': ['gas_natural'] * max(len(pdvs), 1),
            'client_name': ['Cliente Ejemplo'] * max(len(pdvs), 1),
            'contract_number': ['CONT-001'] * max(len(pdvs), 1),
            'sale_value': [0.0] * max(len(pdvs), 1),
            'commission_value': [0.0] * max(len(pdvs), 1),
        }

        df = pd.DataFrame(template_data)

        output = BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)

        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'sales_template_{bu_code}.csv'
        )

    except Exception as e:
        logger.error(f"Download sales template error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/manual', methods=['POST'])
@role_required('super_admin', 'admin', 'analyst')
def create_manual_sale():
    """Create a single sale manually"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        required = ['sale_date', 'period_id', 'point_of_sale_id', 'professional_id',
                     'business_unit_id', 'product_type', 'sale_value']
        if not data or not all(data.get(f) for f in required):
            return jsonify({'success': False, 'error': f'{", ".join(required)} are required'}), 400

        # Validate references
        period = Period.query.get(data['period_id'])
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        pdv = PointOfSale.query.get(data['point_of_sale_id'])
        if not pdv:
            return jsonify({'success': False, 'error': 'Point of sale not found'}), 404

        professional = SalesProfessional.query.get(data['professional_id'])
        if not professional:
            return jsonify({'success': False, 'error': 'Professional not found'}), 404

        bu = BusinessUnit.query.get(data['business_unit_id'])
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        sale = Sale(
            sale_date=date.fromisoformat(data['sale_date']),
            period_id=data['period_id'],
            point_of_sale_id=data['point_of_sale_id'],
            professional_id=data['professional_id'],
            business_unit_id=data['business_unit_id'],
            product_type=data['product_type'],
            client_name=data.get('client_name'),
            contract_number=data.get('contract_number'),
            sale_value=float(data['sale_value']),
            commission_value=float(data['commission_value']) if data.get('commission_value') else None,
            status='registered',
            source='manual',
            notes=data.get('notes'),
            uploaded_by_id=user_id
        )

        db.session.add(sale)
        db.session.commit()

        logger.info(f"Created manual sale {sale.id}")

        return jsonify({'success': True, 'data': sale.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create manual sale error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/<int:sale_id>', methods=['PUT'])
@role_required('super_admin', 'admin', 'analyst')
def update_sale(sale_id):
    """Update a sale"""
    try:
        sale = Sale.query.get(sale_id)

        if not sale:
            return jsonify({'success': False, 'error': 'Sale not found'}), 404

        data = request.get_json()

        if 'sale_value' in data:
            sale.sale_value = float(data['sale_value'])
        if 'commission_value' in data:
            sale.commission_value = float(data['commission_value']) if data['commission_value'] else None
        if 'status' in data:
            sale.status = data['status']
        if 'product_type' in data:
            sale.product_type = data['product_type']
        if 'client_name' in data:
            sale.client_name = data['client_name']
        if 'contract_number' in data:
            sale.contract_number = data['contract_number']
        if 'notes' in data:
            sale.notes = data['notes']

        db.session.commit()
        logger.info(f"Updated sale {sale_id}")

        return jsonify({'success': True, 'data': sale.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update sale error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@sales_bp.route('/summary', methods=['GET'])
@jwt_required()
def sales_summary():
    """Sales summary by period/BU/professional"""
    try:
        period_id = request.args.get('period_id', None, type=int)
        business_unit_id = request.args.get('business_unit_id', None, type=int)
        professional_id = request.args.get('professional_id', None, type=int)

        query = db.session.query(
            Sale.business_unit_id,
            Sale.professional_id,
            Sale.period_id,
            db.func.count(Sale.id).label('total_count'),
            db.func.sum(Sale.sale_value).label('total_value'),
            db.func.sum(Sale.commission_value).label('total_commission'),
        ).filter(Sale.status != 'cancelled')

        if period_id:
            query = query.filter(Sale.period_id == period_id)
        if business_unit_id:
            query = query.filter(Sale.business_unit_id == business_unit_id)
        if professional_id:
            query = query.filter(Sale.professional_id == professional_id)

        query = query.group_by(Sale.business_unit_id, Sale.professional_id, Sale.period_id)

        results = query.all()

        summary = []
        for row in results:
            bu = BusinessUnit.query.get(row.business_unit_id)
            prof = SalesProfessional.query.get(row.professional_id)
            period = Period.query.get(row.period_id)

            summary.append({
                'business_unit_id': row.business_unit_id,
                'business_unit': bu.code if bu else None,
                'professional_id': row.professional_id,
                'professional_name': prof.name if prof else None,
                'period_id': row.period_id,
                'period_name': period.name if period else None,
                'total_count': row.total_count,
                'total_value': float(row.total_value) if row.total_value else 0.0,
                'total_commission': float(row.total_commission) if row.total_commission else 0.0,
            })

        return jsonify({
            'success': True,
            'data': summary
        }), 200

    except Exception as e:
        logger.error(f"Sales summary error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
