from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Llave, KPI, BusinessUnit
from decorators import role_required
import logging

logger = logging.getLogger(__name__)

variables_bp = Blueprint('variables', __name__)


@variables_bp.route('/llaves', methods=['GET'])
@jwt_required()
def list_llaves():
    """List llaves with optional filtering"""
    try:
        business_unit_code = request.args.get('business_unit_code', None, type=str)
        level = request.args.get('level', None, type=int)
        is_active = request.args.get('is_active', True, type=lambda x: x.lower() == 'true')

        query = Llave.query

        if business_unit_code:
            bu = BusinessUnit.query.filter_by(code=business_unit_code).first()
            if bu:
                query = query.filter_by(business_unit_id=bu.id)

        if level is not None:
            query = query.filter_by(level=level)

        if is_active is not None:
            query = query.filter_by(is_active=is_active)

        llaves = query.order_by(Llave.code).all()

        return jsonify({
            'success': True,
            'data': [l.to_dict() for l in llaves]
        }), 200

    except Exception as e:
        logger.error(f"List llaves error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@variables_bp.route('/llaves', methods=['POST'])
@role_required('super_admin', 'admin')
def create_llave():
    """Create a llave"""
    try:
        data = request.get_json()

        if not data or not data.get('business_unit_id') or not data.get('code') or not data.get('name'):
            return jsonify({'success': False, 'error': 'business_unit_id, code, and name required'}), 400

        # Check if llave already exists for this business unit
        existing = Llave.query.filter_by(
            business_unit_id=data['business_unit_id'],
            code=data['code']
        ).first()

        if existing:
            return jsonify({'success': False, 'error': 'Llave already exists for this business unit'}), 409

        llave = Llave(
            business_unit_id=data['business_unit_id'],
            code=data['code'],
            name=data['name'],
            description=data.get('description'),
            weight=data.get('weight', 0.0),
            parent_id=data.get('parent_id'),
            level=data.get('level', 0),
            is_active=data.get('is_active', True)
        )

        db.session.add(llave)
        db.session.commit()

        logger.info(f"Created llave {llave.id}")

        return jsonify({'success': True, 'data': llave.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create llave error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@variables_bp.route('/llaves/<int:llave_id>', methods=['PUT'])
@role_required('super_admin', 'admin')
def update_llave(llave_id):
    """Update a llave"""
    try:
        llave = Llave.query.get(llave_id)

        if not llave:
            return jsonify({'success': False, 'error': 'Llave not found'}), 404

        data = request.get_json()

        if 'name' in data:
            llave.name = data['name']
        if 'description' in data:
            llave.description = data['description']
        if 'weight' in data:
            llave.weight = data['weight']
        if 'parent_id' in data:
            llave.parent_id = data['parent_id']
        if 'level' in data:
            llave.level = data['level']
        if 'is_active' in data:
            llave.is_active = data['is_active']

        llave.version += 1
        db.session.commit()

        logger.info(f"Updated llave {llave_id}")

        return jsonify({'success': True, 'data': llave.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update llave error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@variables_bp.route('/llaves/<int:llave_id>', methods=['DELETE'])
@role_required('super_admin')
def delete_llave(llave_id):
    """Delete a llave (soft delete)"""
    try:
        llave = Llave.query.get(llave_id)

        if not llave:
            return jsonify({'success': False, 'error': 'Llave not found'}), 404

        llave.is_active = False
        db.session.commit()

        logger.info(f"Deleted llave {llave_id}")

        return jsonify({'success': True, 'data': {'message': 'Llave deactivated'}}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete llave error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@variables_bp.route('/kpis', methods=['GET'])
@jwt_required()
def list_kpis():
    """List KPIs"""
    try:
        llave_id = request.args.get('llave_id', None, type=int)
        is_active = request.args.get('is_active', True, type=lambda x: x.lower() == 'true')

        query = KPI.query

        if llave_id:
            query = query.filter_by(llave_id=llave_id)

        if is_active is not None:
            query = query.filter_by(is_active=is_active)

        kpis = query.all()

        return jsonify({
            'success': True,
            'data': [k.to_dict() for k in kpis]
        }), 200

    except Exception as e:
        logger.error(f"List KPIs error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@variables_bp.route('/kpis', methods=['POST'])
@role_required('super_admin', 'admin')
def create_kpi():
    """Create a KPI"""
    try:
        data = request.get_json()

        if not data or not data.get('llave_id') or not data.get('name') or not data.get('source_type'):
            return jsonify({'success': False, 'error': 'llave_id, name, and source_type required'}), 400

        kpi = KPI(
            llave_id=data['llave_id'],
            name=data['name'],
            description=data.get('description'),
            weight=data.get('weight', 0.0),
            source_type=data['source_type'],
            source_system=data.get('source_system'),
            source_config=data.get('source_config'),
            is_active=data.get('is_active', True)
        )

        db.session.add(kpi)
        db.session.commit()

        logger.info(f"Created KPI {kpi.id}")

        return jsonify({'success': True, 'data': kpi.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create KPI error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@variables_bp.route('/kpis/<int:kpi_id>', methods=['PUT'])
@role_required('super_admin', 'admin')
def update_kpi(kpi_id):
    """Update a KPI"""
    try:
        kpi = KPI.query.get(kpi_id)

        if not kpi:
            return jsonify({'success': False, 'error': 'KPI not found'}), 404

        data = request.get_json()

        if 'name' in data:
            kpi.name = data['name']
        if 'description' in data:
            kpi.description = data['description']
        if 'weight' in data:
            kpi.weight = data['weight']
        if 'source_type' in data:
            kpi.source_type = data['source_type']
        if 'source_system' in data:
            kpi.source_system = data['source_system']
        if 'source_config' in data:
            kpi.source_config = data['source_config']
        if 'is_active' in data:
            kpi.is_active = data['is_active']

        db.session.commit()

        logger.info(f"Updated KPI {kpi_id}")

        return jsonify({'success': True, 'data': kpi.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update KPI error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@variables_bp.route('/kpis/<int:kpi_id>', methods=['DELETE'])
@role_required('super_admin')
def delete_kpi(kpi_id):
    """Delete a KPI (soft delete)"""
    try:
        kpi = KPI.query.get(kpi_id)

        if not kpi:
            return jsonify({'success': False, 'error': 'KPI not found'}), 404

        kpi.is_active = False
        db.session.commit()

        logger.info(f"Deleted KPI {kpi_id}")

        return jsonify({'success': True, 'data': {'message': 'KPI deactivated'}}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete KPI error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@variables_bp.route('/structure/<business_unit_code>', methods=['GET'])
@jwt_required()
def get_structure(business_unit_code):
    """Get full hierarchical structure for a business unit"""
    try:
        bu = BusinessUnit.query.filter_by(code=business_unit_code).first()

        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        # Get root llaves
        llaves = Llave.query.filter_by(
            business_unit_id=bu.id,
            parent_id=None,
            is_active=True
        ).order_by(Llave.code).all()

        structure = {
            'business_unit': bu.to_dict(),
            'llaves': []
        }

        for llave in llaves:
            llave_data = llave.to_dict()
            llave_data['kpis'] = [kpi.to_dict() for kpi in llave.kpis if kpi.is_active]
            llave_data['children'] = []

            # Get child llaves
            for child in llave.children:
                if child.is_active:
                    child_data = child.to_dict()
                    child_data['kpis'] = [kpi.to_dict() for kpi in child.kpis if kpi.is_active]
                    llave_data['children'].append(child_data)

            structure['llaves'].append(llave_data)

        return jsonify({'success': True, 'data': structure}), 200

    except Exception as e:
        logger.error(f"Get structure error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@variables_bp.route('/validate-weights', methods=['POST'])
@role_required('super_admin', 'admin')
def validate_weights():
    """Validate that weights sum to 1.0 for a business unit"""
    try:
        data = request.get_json()

        if not data or not data.get('business_unit_id'):
            return jsonify({'success': False, 'error': 'business_unit_id required'}), 400

        bu_id = data['business_unit_id']

        # Get root llaves
        llaves = Llave.query.filter_by(
            business_unit_id=bu_id,
            parent_id=None,
            is_active=True
        ).all()

        total_weight = sum(l.weight for l in llaves)

        is_valid = abs(total_weight - 1.0) < 0.001

        result = {
            'is_valid': is_valid,
            'total_weight': total_weight,
            'expected': 1.0,
            'difference': total_weight - 1.0
        }

        return jsonify({'success': True, 'data': result}), 200

    except Exception as e:
        logger.error(f"Validate weights error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
