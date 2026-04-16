from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Liquidation, Period, User, ApprovalStep
from services.liquidation_service import LiquidationService
from decorators import role_required
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

liquidations_bp = Blueprint('liquidations', __name__)


@liquidations_bp.route('', methods=['GET'])
@jwt_required()
def list_liquidations():
    """List liquidations"""
    try:
        period_id = request.args.get('period_id', None, type=int)
        user_id = request.args.get('user_id', None, type=int)
        business_unit_id = request.args.get('business_unit_id', None, type=int)
        status = request.args.get('status', None, type=str)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        query = Liquidation.query

        if period_id:
            query = query.filter_by(period_id=period_id)
        if user_id:
            query = query.filter_by(user_id=user_id)
        if business_unit_id:
            query = query.filter_by(business_unit_id=business_unit_id)
        if status:
            query = query.filter_by(status=status)

        pagination = query.order_by(Liquidation.created_at.desc()).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'liquidations': [l.to_dict() for l in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"List liquidations error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@liquidations_bp.route('/<int:liquidation_id>', methods=['GET'])
@jwt_required()
def get_liquidation(liquidation_id):
    """Get liquidation detail"""
    try:
        liquidation = Liquidation.query.get(liquidation_id)

        if not liquidation:
            return jsonify({'success': False, 'error': 'Liquidation not found'}), 404

        data = liquidation.to_dict()
        data['approval_steps'] = [step.to_dict() for step in liquidation.approval_steps]

        return jsonify({'success': True, 'data': data}), 200

    except Exception as e:
        logger.error(f"Get liquidation error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@liquidations_bp.route('/calculate', methods=['POST'])
@role_required('admin', 'analyst')
def calculate_liquidation():
    """Calculate liquidation for a period/user"""
    try:
        data = request.get_json()

        period_id = data.get('period_id')
        user_id = data.get('user_id')
        business_unit_id = data.get('business_unit_id')
        base_salary = data.get('base_salary')

        if not period_id:
            return jsonify({'success': False, 'error': 'period_id required'}), 400

        if not user_id and not business_unit_id:
            return jsonify({'success': False, 'error': 'Either user_id or business_unit_id required'}), 400

        breakdown = LiquidationService.calculate(
            period_id=period_id,
            user_id=user_id,
            business_unit_id=business_unit_id,
            base_salary=base_salary
        )

        return jsonify({'success': True, 'data': breakdown}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Calculate liquidation error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@liquidations_bp.route('/create-and-save', methods=['POST'])
@role_required('admin', 'analyst')
def create_liquidation():
    """Create and save liquidation"""
    try:
        data = request.get_json()

        period_id = data.get('period_id')
        user_id = data.get('user_id')
        business_unit_id = data.get('business_unit_id')
        base_salary = data.get('base_salary')

        if not period_id:
            return jsonify({'success': False, 'error': 'period_id required'}), 400

        if not user_id and not business_unit_id:
            return jsonify({'success': False, 'error': 'Either user_id or business_unit_id required'}), 400

        liquidation = LiquidationService.create_liquidation(
            period_id=period_id,
            user_id=user_id,
            business_unit_id=business_unit_id,
            base_salary=base_salary
        )

        return jsonify({'success': True, 'data': liquidation.to_dict()}), 201

    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Create liquidation error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@liquidations_bp.route('/<int:liquidation_id>/submit', methods=['PUT'])
@role_required('admin', 'analyst')
def submit_liquidation(liquidation_id):
    """Submit liquidation for approval"""
    try:
        liquidation = Liquidation.query.get(liquidation_id)

        if not liquidation:
            return jsonify({'success': False, 'error': 'Liquidation not found'}), 404

        if liquidation.status != 'draft':
            return jsonify({'success': False, 'error': f'Cannot submit {liquidation.status} liquidation'}), 400

        liquidation = LiquidationService.submit_liquidation(liquidation_id)

        return jsonify({'success': True, 'data': liquidation.to_dict()}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Submit liquidation error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@liquidations_bp.route('/<int:liquidation_id>', methods=['DELETE'])
@role_required('admin')
def delete_liquidation(liquidation_id):
    """Delete draft liquidation"""
    try:
        liquidation = Liquidation.query.get(liquidation_id)

        if not liquidation:
            return jsonify({'success': False, 'error': 'Liquidation not found'}), 404

        if liquidation.status != 'draft':
            return jsonify({'success': False, 'error': 'Can only delete draft liquidations'}), 400

        db.session.delete(liquidation)
        db.session.commit()

        logger.info(f"Deleted liquidation {liquidation_id}")

        return jsonify({'success': True, 'data': {'message': 'Liquidation deleted'}}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete liquidation error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
