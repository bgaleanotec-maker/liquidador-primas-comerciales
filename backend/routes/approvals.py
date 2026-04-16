from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import ApprovalStep, Liquidation, User
from decorators import role_required
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

approvals_bp = Blueprint('approvals', __name__)


@approvals_bp.route('/pending', methods=['GET'])
@role_required('super_admin', 'admin', 'approver')
def get_pending_approvals():
    """Get pending approvals for current user"""
    try:
        user_id = get_jwt_identity()

        pending_steps = ApprovalStep.query.filter_by(
            approver_id=user_id,
            status='pending'
        ).all()

        result = []
        for step in pending_steps:
            liquidation_data = step.liquidation.to_dict()
            step_data = step.to_dict()
            step_data['liquidation'] = liquidation_data
            result.append(step_data)

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        logger.error(f"Get pending approvals error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@approvals_bp.route('/<int:liquidation_id>/approve', methods=['POST'])
@role_required('super_admin', 'admin', 'approver')
def approve_liquidation(liquidation_id):
    """Approve a liquidation"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}

        liquidation = Liquidation.query.get(liquidation_id)

        if not liquidation:
            return jsonify({'success': False, 'error': 'Liquidation not found'}), 404

        if liquidation.status != 'submitted':
            return jsonify({'success': False, 'error': f'Cannot approve {liquidation.status} liquidation'}), 400

        # Find the pending approval step for this user
        step = ApprovalStep.query.filter_by(
            liquidation_id=liquidation_id,
            approver_id=user_id,
            status='pending'
        ).order_by(ApprovalStep.step_order).first()

        if not step:
            return jsonify({'success': False, 'error': 'No pending approval for this user'}), 404

        # Approve the step
        step.status = 'approved'
        step.comments = data.get('comments')
        step.action_at = datetime.utcnow()

        # Check if all steps are approved
        all_steps = ApprovalStep.query.filter_by(liquidation_id=liquidation_id).all()
        all_approved = all(s.status == 'approved' for s in all_steps)

        if all_approved:
            liquidation.status = 'approved'

        db.session.commit()

        logger.info(f"Approved liquidation {liquidation_id} by user {user_id}")

        return jsonify({'success': True, 'data': liquidation.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Approve liquidation error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@approvals_bp.route('/<int:liquidation_id>/reject', methods=['POST'])
@role_required('super_admin', 'admin', 'approver')
def reject_liquidation(liquidation_id):
    """Reject a liquidation"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or not data.get('comments'):
            return jsonify({'success': False, 'error': 'Rejection comments required'}), 400

        liquidation = Liquidation.query.get(liquidation_id)

        if not liquidation:
            return jsonify({'success': False, 'error': 'Liquidation not found'}), 404

        if liquidation.status != 'submitted':
            return jsonify({'success': False, 'error': f'Cannot reject {liquidation.status} liquidation'}), 400

        # Find the pending approval step for this user
        step = ApprovalStep.query.filter_by(
            liquidation_id=liquidation_id,
            approver_id=user_id,
            status='pending'
        ).first()

        if not step:
            return jsonify({'success': False, 'error': 'No pending approval for this user'}), 404

        # Reject the step and liquidation
        step.status = 'rejected'
        step.comments = data['comments']
        step.action_at = datetime.utcnow()

        liquidation.status = 'rejected'

        db.session.commit()

        logger.info(f"Rejected liquidation {liquidation_id} by user {user_id}")

        return jsonify({'success': True, 'data': liquidation.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Reject liquidation error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@approvals_bp.route('/history', methods=['GET'])
@jwt_required()
def get_approval_history():
    """Get approval history"""
    try:
        liquidation_id = request.args.get('liquidation_id', None, type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        query = ApprovalStep.query

        if liquidation_id:
            query = query.filter_by(liquidation_id=liquidation_id)

        pagination = query.order_by(ApprovalStep.step_order).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'approvals': [step.to_dict() for step in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Get approval history error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
