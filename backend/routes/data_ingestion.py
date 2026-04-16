from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import KPIResult, KPITarget, Period, User, Llave, KPI
from decorators import role_required
from io import BytesIO
import pandas as pd
import logging
import os

logger = logging.getLogger(__name__)

data_bp = Blueprint('data', __name__)


@data_bp.route('/upload-csv', methods=['POST'])
@role_required('admin', 'analyst')
def upload_csv():
    """Upload CSV/Excel file with KPI results"""
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

        # Validate period exists
        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        # Process rows
        created = 0
        updated = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                kpi_id = row.get('kpi_id')
                user_email = row.get('user_email')
                actual_value = row.get('actual_value')

                if not kpi_id or not user_email or actual_value is None:
                    errors.append(f"Row {idx + 2}: Missing required fields (kpi_id, user_email, actual_value)")
                    continue

                # Get user
                user_obj = User.query.filter_by(email=user_email).first()
                if not user_obj:
                    errors.append(f"Row {idx + 2}: User {user_email} not found")
                    continue

                # Get KPI
                kpi = KPI.query.get(int(kpi_id))
                if not kpi:
                    errors.append(f"Row {idx + 2}: KPI {kpi_id} not found")
                    continue

                # Check or create result
                result = KPIResult.query.filter_by(
                    kpi_id=int(kpi_id),
                    period_id=period_id,
                    user_id=user_obj.id
                ).first()

                if result:
                    result.actual_value = float(actual_value)
                    result.uploaded_by_id = user_id
                    updated += 1
                else:
                    result = KPIResult(
                        kpi_id=int(kpi_id),
                        period_id=period_id,
                        user_id=user_obj.id,
                        actual_value=float(actual_value),
                        uploaded_by_id=user_id,
                        source='csv_upload'
                    )
                    db.session.add(result)
                    created += 1

            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        db.session.commit()

        logger.info(f"Uploaded data: {created} created, {updated} updated")

        return jsonify({
            'success': True,
            'data': {
                'created': created,
                'updated': updated,
                'errors': errors
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Upload CSV error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@data_bp.route('/results', methods=['GET'])
@jwt_required()
def list_results():
    """List KPI results"""
    try:
        period_id = request.args.get('period_id', None, type=int)
        user_id = request.args.get('user_id', None, type=int)
        kpi_id = request.args.get('kpi_id', None, type=int)
        status = request.args.get('status', None, type=str)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = KPIResult.query

        if period_id:
            query = query.filter_by(period_id=period_id)
        if user_id:
            query = query.filter_by(user_id=user_id)
        if kpi_id:
            query = query.filter_by(kpi_id=kpi_id)
        if status:
            query = query.filter_by(status=status)

        pagination = query.order_by(KPIResult.created_at.desc()).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'results': [r.to_dict() for r in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"List results error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@data_bp.route('/results/<int:result_id>', methods=['PUT'])
@role_required('admin', 'analyst')
def update_result(result_id):
    """Update a KPI result"""
    try:
        result = KPIResult.query.get(result_id)

        if not result:
            return jsonify({'success': False, 'error': 'Result not found'}), 404

        data = request.get_json()

        if 'actual_value' in data:
            result.actual_value = data['actual_value']
        if 'meta_value' in data:
            result.meta_value = data['meta_value']
        if 'notes' in data:
            result.notes = data['notes']
        if 'status' in data:
            result.status = data['status']

        db.session.commit()

        logger.info(f"Updated result {result_id}")

        return jsonify({'success': True, 'data': result.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update result error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@data_bp.route('/results/bulk', methods=['POST'])
@role_required('admin', 'analyst')
def bulk_create_results():
    """Bulk create/update results"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or not isinstance(data.get('results'), list):
            return jsonify({'success': False, 'error': 'results array required'}), 400

        created = 0
        updated = 0
        errors = []

        for idx, item in enumerate(data['results']):
            try:
                kpi_id = item.get('kpi_id')
                period_id = item.get('period_id')
                user_obj_id = item.get('user_id')
                actual_value = item.get('actual_value')

                if not all([kpi_id, period_id, user_obj_id, actual_value is not None]):
                    errors.append(f"Item {idx}: Missing required fields")
                    continue

                result = KPIResult.query.filter_by(
                    kpi_id=kpi_id,
                    period_id=period_id,
                    user_id=user_obj_id
                ).first()

                if result:
                    result.actual_value = actual_value
                    updated += 1
                else:
                    result = KPIResult(
                        kpi_id=kpi_id,
                        period_id=period_id,
                        user_id=user_obj_id,
                        actual_value=actual_value,
                        uploaded_by_id=user_id
                    )
                    db.session.add(result)
                    created += 1

            except Exception as e:
                errors.append(f"Item {idx}: {str(e)}")

        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'created': created,
                'updated': updated,
                'errors': errors
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Bulk create results error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@data_bp.route('/targets', methods=['GET'])
@jwt_required()
def list_targets():
    """List KPI targets"""
    try:
        period_id = request.args.get('period_id', None, type=int)
        user_id = request.args.get('user_id', None, type=int)
        kpi_id = request.args.get('kpi_id', None, type=int)

        query = KPITarget.query

        if period_id:
            query = query.filter_by(period_id=period_id)
        if user_id:
            query = query.filter_by(user_id=user_id)
        if kpi_id:
            query = query.filter_by(kpi_id=kpi_id)

        targets = query.all()

        return jsonify({
            'success': True,
            'data': [t.to_dict() for t in targets]
        }), 200

    except Exception as e:
        logger.error(f"List targets error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@data_bp.route('/targets/bulk', methods=['POST'])
@role_required('admin', 'analyst')
def bulk_create_targets():
    """Bulk create/update targets"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or not isinstance(data.get('targets'), list):
            return jsonify({'success': False, 'error': 'targets array required'}), 400

        created = 0
        updated = 0
        errors = []

        for idx, item in enumerate(data['targets']):
            try:
                kpi_id = item.get('kpi_id')
                period_id = item.get('period_id')
                target_user_id = item.get('user_id')
                target_value = item.get('target_value')

                if not all([kpi_id, period_id, target_value is not None]):
                    errors.append(f"Item {idx}: Missing required fields")
                    continue

                target = KPITarget.query.filter_by(
                    kpi_id=kpi_id,
                    period_id=period_id,
                    user_id=target_user_id
                ).first()

                if target:
                    target.target_value = target_value
                    updated += 1
                else:
                    target = KPITarget(
                        kpi_id=kpi_id,
                        period_id=period_id,
                        user_id=target_user_id,
                        target_value=target_value,
                        created_by_id=user_id
                    )
                    db.session.add(target)
                    created += 1

            except Exception as e:
                errors.append(f"Item {idx}: {str(e)}")

        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'created': created,
                'updated': updated,
                'errors': errors
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Bulk create targets error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@data_bp.route('/template/<business_unit_code>', methods=['GET'])
@jwt_required()
def download_template(business_unit_code):
    """Download CSV template for data entry"""
    try:
        from models import BusinessUnit

        bu = BusinessUnit.query.filter_by(code=business_unit_code).first()
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        # Get KPIs for this business unit
        kpis = db.session.query(KPI).join(Llave).filter(
            Llave.business_unit_id == bu.id,
            KPI.is_active == True
        ).all()

        # Create template data
        template_data = {
            'kpi_id': [],
            'kpi_name': [],
            'user_email': [],
            'actual_value': [],
            'meta_value': []
        }

        for kpi in kpis:
            template_data['kpi_id'].append(kpi.id)
            template_data['kpi_name'].append(kpi.name)
            template_data['user_email'].append('example@company.com')
            template_data['actual_value'].append(0.0)
            template_data['meta_value'].append(0.0)

        df = pd.DataFrame(template_data)

        # Create Excel file
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Data', index=False)

        output.seek(0)

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'template_{business_unit_code}.xlsx'
        )

    except Exception as e:
        logger.error(f"Download template error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
