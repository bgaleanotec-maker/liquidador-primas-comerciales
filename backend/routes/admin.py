from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, BusinessUnit, Period, DataSource, AuditLog
from decorators import role_required
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/users', methods=['GET'])
@role_required('super_admin', 'admin')
def list_users():
    """List all users"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        is_active = request.args.get('is_active', None, type=lambda x: x.lower() == 'true')
        role = request.args.get('role', None, type=str)

        query = User.query

        if is_active is not None:
            query = query.filter_by(is_active=is_active)

        if role:
            query = query.filter_by(role=role)

        pagination = query.paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'users': [u.to_dict() for u in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"List users error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/users', methods=['POST'])
@role_required('super_admin', 'admin')
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('name') or not data.get('password'):
            return jsonify({'success': False, 'error': 'Email, name, and password required'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'error': 'Email already exists'}), 409

        user = User(
            email=data['email'],
            name=data['name'],
            role=data.get('role', 'viewer'),
            business_unit_id=data.get('business_unit_id'),
            is_active=data.get('is_active', True)
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        logger.info(f"Created user {user.id}")

        return jsonify({'success': True, 'data': user.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create user error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@role_required('super_admin', 'admin')
def get_user(user_id):
    """Get user details"""
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        return jsonify({'success': True, 'data': user.to_dict()}), 200

    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@role_required('super_admin', 'admin')
def update_user(user_id):
    """Update user"""
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        data = request.get_json()

        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            if data['email'] != user.email and User.query.filter_by(email=data['email']).first():
                return jsonify({'success': False, 'error': 'Email already exists'}), 409
            user.email = data['email']
        if 'role' in data:
            user.role = data['role']
        if 'business_unit_id' in data:
            user.business_unit_id = data['business_unit_id']
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'password' in data and data['password']:
            user.set_password(data['password'])

        db.session.commit()
        logger.info(f"Updated user {user_id}")

        return jsonify({'success': True, 'data': user.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update user error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@role_required('super_admin')
def delete_user(user_id):
    """Delete user"""
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Don't delete, just deactivate
        user.is_active = False
        db.session.commit()

        logger.info(f"Deactivated user {user_id}")

        return jsonify({'success': True, 'data': {'message': 'User deactivated'}}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete user error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/audit-log', methods=['GET'])
@role_required('super_admin', 'admin')
def get_audit_log():
    """Get audit log"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        user_id = request.args.get('user_id', None, type=int)
        entity_type = request.args.get('entity_type', None, type=str)

        query = AuditLog.query

        if user_id:
            query = query.filter_by(user_id=user_id)

        if entity_type:
            query = query.filter_by(entity_type=entity_type)

        pagination = query.order_by(AuditLog.created_at.desc()).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'logs': [log.to_dict() for log in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Get audit log error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/business-units', methods=['GET'])
@role_required('super_admin', 'admin')
def list_business_units():
    """List all business units"""
    try:
        units = BusinessUnit.query.filter_by(is_active=True).all()

        return jsonify({
            'success': True,
            'data': [u.to_dict() for u in units]
        }), 200

    except Exception as e:
        logger.error(f"List business units error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/business-units', methods=['POST'])
@role_required('super_admin')
def create_business_unit():
    """Create a business unit"""
    try:
        data = request.get_json()

        if not data or not data.get('code') or not data.get('name'):
            return jsonify({'success': False, 'error': 'Code and name required'}), 400

        if BusinessUnit.query.filter_by(code=data['code']).first():
            return jsonify({'success': False, 'error': 'Code already exists'}), 409

        unit = BusinessUnit(
            code=data['code'],
            name=data['name'],
            description=data.get('description'),
            is_active=data.get('is_active', True)
        )

        db.session.add(unit)
        db.session.commit()

        logger.info(f"Created business unit {unit.id}")

        return jsonify({'success': True, 'data': unit.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create business unit error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/business-units/<int:unit_id>', methods=['PUT'])
@role_required('super_admin', 'admin')
def update_business_unit(unit_id):
    """Update business unit"""
    try:
        unit = BusinessUnit.query.get(unit_id)

        if not unit:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        data = request.get_json()

        if 'name' in data:
            unit.name = data['name']
        if 'description' in data:
            unit.description = data['description']
        if 'is_active' in data:
            unit.is_active = data['is_active']

        db.session.commit()
        logger.info(f"Updated business unit {unit_id}")

        return jsonify({'success': True, 'data': unit.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update business unit error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/periods', methods=['GET'])
@role_required('super_admin', 'admin')
def list_periods():
    """List all periods"""
    try:
        periods = Period.query.order_by(Period.year.desc(), Period.month.desc()).all()

        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in periods]
        }), 200

    except Exception as e:
        logger.error(f"List periods error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/periods', methods=['POST'])
@role_required('super_admin', 'admin')
def create_period():
    """Create a period"""
    try:
        data = request.get_json()

        if not data or 'year' not in data or 'month' not in data:
            return jsonify({'success': False, 'error': 'Year and month required'}), 400

        if Period.query.filter_by(year=data['year'], month=data['month']).first():
            return jsonify({'success': False, 'error': 'Period already exists'}), 409

        period = Period(
            year=data['year'],
            month=data['month'],
            status=data.get('status', 'open')
        )

        db.session.add(period)
        db.session.commit()

        logger.info(f"Created period {period.id}")

        return jsonify({'success': True, 'data': period.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create period error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/periods/<int:period_id>', methods=['PUT'])
@role_required('super_admin', 'admin')
def update_period(period_id):
    """Update period status"""
    try:
        period = Period.query.get(period_id)

        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        data = request.get_json()

        if 'status' in data:
            period.status = data['status']

        db.session.commit()
        logger.info(f"Updated period {period_id}")

        return jsonify({'success': True, 'data': period.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update period error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/data-sources', methods=['GET'])
@role_required('super_admin', 'admin')
def list_data_sources():
    """List data sources"""
    try:
        sources = DataSource.query.filter_by(is_active=True).all()

        return jsonify({
            'success': True,
            'data': [s.to_dict() for s in sources]
        }), 200

    except Exception as e:
        logger.error(f"List data sources error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/data-sources', methods=['POST'])
@role_required('super_admin', 'admin')
def create_data_source():
    """Create a data source"""
    try:
        data = request.get_json()

        if not data or not data.get('name') or not data.get('source_type'):
            return jsonify({'success': False, 'error': 'Name and source_type required'}), 400

        source = DataSource(
            name=data['name'],
            source_type=data['source_type'],
            business_unit_id=data.get('business_unit_id'),
            config=data.get('config'),
            is_active=data.get('is_active', True)
        )

        db.session.add(source)
        db.session.commit()

        logger.info(f"Created data source {source.id}")

        return jsonify({'success': True, 'data': source.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create data source error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@admin_bp.route('/data-sources/<int:source_id>', methods=['PUT'])
@role_required('super_admin', 'admin')
def update_data_source(source_id):
    """Update data source"""
    try:
        source = DataSource.query.get(source_id)

        if not source:
            return jsonify({'success': False, 'error': 'Data source not found'}), 404

        data = request.get_json()

        if 'name' in data:
            source.name = data['name']
        if 'config' in data:
            source.config = data['config']
        if 'is_active' in data:
            source.is_active = data['is_active']

        source.last_sync = datetime.utcnow()
        db.session.commit()

        logger.info(f"Updated data source {source_id}")

        return jsonify({'success': True, 'data': source.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update data source error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
