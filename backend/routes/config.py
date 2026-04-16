from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import LlaveConfig, Llave, BusinessUnit, Period, User
from decorators import role_required
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

config_bp = Blueprint('config', __name__)


@config_bp.route('/llaves/<bu_code>', methods=['GET'])
@jwt_required()
def get_llave_config(bu_code):
    """Get LLAVE config for a BU + period (with override weights)"""
    try:
        period_id = request.args.get('period_id', None, type=int)

        bu = BusinessUnit.query.filter_by(code=bu_code).first()
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        # Get all llaves for this BU
        llaves = Llave.query.filter_by(business_unit_id=bu.id, is_active=True).all()

        result = []
        for llave in llaves:
            llave_data = llave.to_dict()

            # Check for period-specific override
            if period_id:
                config = LlaveConfig.query.filter_by(
                    business_unit_id=bu.id,
                    period_id=period_id,
                    llave_id=llave.id,
                    is_active=True
                ).first()

                if config:
                    llave_data['weight_override'] = config.weight_override
                    llave_data['effective_weight'] = config.weight_override if config.weight_override is not None else llave.weight
                    llave_data['config_id'] = config.id
                    llave_data['config_notes'] = config.notes
                    llave_data['configured_by'] = config.configured_by.name if config.configured_by else None
                else:
                    llave_data['weight_override'] = None
                    llave_data['effective_weight'] = llave.weight
                    llave_data['config_id'] = None
                    llave_data['config_notes'] = None
                    llave_data['configured_by'] = None
            else:
                llave_data['effective_weight'] = llave.weight

            result.append(llave_data)

        return jsonify({
            'success': True,
            'data': {
                'business_unit': bu.to_dict(),
                'period_id': period_id,
                'llaves': result
            }
        }), 200

    except Exception as e:
        logger.error(f"Get llave config error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@config_bp.route('/llaves', methods=['POST'])
@role_required('super_admin', 'admin', 'analyst')
def save_llave_config():
    """Save LLAVE weight overrides for a period"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or not data.get('business_unit_id') or not data.get('period_id') or not data.get('overrides'):
            return jsonify({'success': False, 'error': 'business_unit_id, period_id, and overrides required'}), 400

        business_unit_id = data['business_unit_id']
        period_id = data['period_id']
        overrides = data['overrides']  # List of { llave_id, weight_override, notes }

        bu = BusinessUnit.query.get(business_unit_id)
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        created = 0
        updated = 0
        results = []

        for override in overrides:
            llave_id = override.get('llave_id')
            weight_override = override.get('weight_override')
            notes = override.get('notes')

            if not llave_id:
                continue

            llave = Llave.query.get(llave_id)
            if not llave:
                continue

            # Check if config already exists
            existing = LlaveConfig.query.filter_by(
                business_unit_id=business_unit_id,
                period_id=period_id,
                llave_id=llave_id
            ).first()

            if existing:
                existing.weight_override = weight_override
                existing.is_active = True
                existing.configured_by_id = user_id
                existing.notes = notes
                results.append(existing.to_dict())
                updated += 1
            else:
                config = LlaveConfig(
                    business_unit_id=business_unit_id,
                    period_id=period_id,
                    llave_id=llave_id,
                    weight_override=weight_override,
                    is_active=True,
                    configured_by_id=user_id,
                    notes=notes
                )
                db.session.add(config)
                results.append(config.to_dict())
                created += 1

        db.session.commit()

        logger.info(f"Saved llave config: {created} created, {updated} updated")

        return jsonify({
            'success': True,
            'data': {
                'created': created,
                'updated': updated,
                'configs': results
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Save llave config error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@config_bp.route('/llaves/history', methods=['GET'])
@jwt_required()
def llave_config_history():
    """History of LLAVE config changes"""
    try:
        business_unit_id = request.args.get('business_unit_id', None, type=int)
        llave_id = request.args.get('llave_id', None, type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = LlaveConfig.query

        if business_unit_id:
            query = query.filter_by(business_unit_id=business_unit_id)
        if llave_id:
            query = query.filter_by(llave_id=llave_id)

        pagination = query.order_by(LlaveConfig.created_at.desc()).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'configs': [c.to_dict() for c in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Llave config history error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
