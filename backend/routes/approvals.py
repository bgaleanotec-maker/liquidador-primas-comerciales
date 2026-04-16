from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import ApprovalStep, Liquidation, User, CommissionPayment, Period
from decorators import role_required
from datetime import datetime, timedelta
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


def _add_business_days(start_date, num_days):
    """Add business days (Mon-Fri) to a date."""
    current = start_date
    added = 0
    while added < num_days:
        current += timedelta(days=1)
        if current.weekday() < 5:  # Monday=0 ... Friday=4
            added += 1
    return current


@approvals_bp.route('/publish/<int:period_id>', methods=['POST'])
@role_required('super_admin', 'admin')
def publish_liquidations(period_id):
    """Publish liquidations for a period (sets published_at and claim_deadline)"""
    try:
        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Periodo no encontrado'}), 404

        commissions = CommissionPayment.query.filter_by(
            period_id=period_id,
            status='calculated'
        ).filter(CommissionPayment.published_at.is_(None)).all()

        if not commissions:
            return jsonify({
                'success': False,
                'error': 'No hay liquidaciones calculadas pendientes de publicar para este periodo'
            }), 400

        now = datetime.utcnow()
        claim_deadline = _add_business_days(now, 5)

        count = 0
        for commission in commissions:
            commission.published_at = now
            commission.claim_deadline = claim_deadline
            count += 1

        db.session.commit()

        logger.info(f"Published {count} liquidations for period {period_id}")

        return jsonify({
            'success': True,
            'data': {
                'published_count': count,
                'published_at': now.isoformat(),
                'claim_deadline': claim_deadline.isoformat(),
                'period': period.to_dict()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Publish liquidations error: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500


@approvals_bp.route('/check-escalation', methods=['POST'])
@role_required('super_admin', 'admin')
def check_escalation():
    """Check and auto-escalate overdue approvals"""
    try:
        now = datetime.utcnow()
        escalated = []
        auto_approved = []

        # Find all commission_payments with status='calculated' and published_at is set
        commissions = CommissionPayment.query.filter(
            CommissionPayment.status == 'calculated',
            CommissionPayment.published_at.isnot(None)
        ).all()

        for commission in commissions:
            # Level 0 -> 1: If published_at + 3 days < now AND escalation_level == 0
            if (commission.escalation_level == 0
                    and commission.published_at + timedelta(days=3) < now):
                commission.escalation_level = 1
                commission.escalated_at = now
                escalated.append({
                    'id': commission.id,
                    'professional_id': commission.professional_id,
                    'from_level': 0,
                    'to_level': 1
                })

            # Level 1 -> 2: If escalated_at + 24 hours < now AND escalation_level == 1
            elif (commission.escalation_level == 1
                    and commission.escalated_at
                    and commission.escalated_at + timedelta(hours=24) < now):
                commission.escalation_level = 2
                commission.escalated_at = now
                escalated.append({
                    'id': commission.id,
                    'professional_id': commission.professional_id,
                    'from_level': 1,
                    'to_level': 2
                })

            # Level 2 -> auto-approve: If escalated_at + 24 hours < now AND escalation_level == 2
            elif (commission.escalation_level == 2
                    and commission.escalated_at
                    and commission.escalated_at + timedelta(hours=24) < now):
                commission.status = 'approved'
                commission.auto_approved = True
                auto_approved.append({
                    'id': commission.id,
                    'professional_id': commission.professional_id
                })

        db.session.commit()

        logger.info(
            f"Escalation check: {len(escalated)} escalated, "
            f"{len(auto_approved)} auto-approved"
        )

        return jsonify({
            'success': True,
            'data': {
                'escalated': escalated,
                'auto_approved': auto_approved,
                'total_checked': len(commissions)
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Check escalation error: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500
