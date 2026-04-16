from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import (
    User, SalesProfessional, Sale, CommissionPayment,
    Liquidation, Period
)
from models.objection import Objection
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

portal_bp = Blueprint('portal', __name__)


def _get_professional_for_user(user_id):
    """Map logged-in User to SalesProfessional by matching email."""
    user = User.query.get(user_id)
    if not user or not user.email:
        return None
    professional = SalesProfessional.query.filter_by(email=user.email).first()
    return professional


@portal_bp.route('/my-liquidations', methods=['GET'])
@jwt_required()
def get_my_liquidations():
    """Get liquidations for the logged-in professional"""
    try:
        user_id = get_jwt_identity()
        professional = _get_professional_for_user(user_id)

        if not professional:
            return jsonify({
                'success': False,
                'error': 'No se encontro un profesional de ventas asociado a este usuario'
            }), 404

        period_id = request.args.get('period_id', None, type=int)

        query = Liquidation.query.filter_by(professional_id=professional.id)
        if period_id:
            query = query.filter_by(period_id=period_id)

        liquidations = query.order_by(Liquidation.created_at.desc()).all()

        return jsonify({
            'success': True,
            'data': [l.to_dict() for l in liquidations]
        }), 200

    except Exception as e:
        logger.error(f"Get my liquidations error: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500


@portal_bp.route('/my-sales', methods=['GET'])
@jwt_required()
def get_my_sales():
    """Get sales assigned to this professional for current/selected period"""
    try:
        user_id = get_jwt_identity()
        professional = _get_professional_for_user(user_id)

        if not professional:
            return jsonify({
                'success': False,
                'error': 'No se encontro un profesional de ventas asociado a este usuario'
            }), 404

        period_id = request.args.get('period_id', None, type=int)

        query = Sale.query.filter_by(professional_id=professional.id)
        if period_id:
            query = query.filter_by(period_id=period_id)
        else:
            # Default to the most recent open period
            current_period = Period.query.filter(
                Period.status.in_(['open', 'in_progress'])
            ).order_by(Period.year.desc(), Period.month.desc()).first()
            if current_period:
                query = query.filter_by(period_id=current_period.id)

        sales = query.order_by(Sale.sale_date.desc()).all()

        return jsonify({
            'success': True,
            'data': [s.to_dict() for s in sales]
        }), 200

    except Exception as e:
        logger.error(f"Get my sales error: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500


@portal_bp.route('/my-commissions', methods=['GET'])
@jwt_required()
def get_my_commissions():
    """Get commission payments for this professional"""
    try:
        user_id = get_jwt_identity()
        professional = _get_professional_for_user(user_id)

        if not professional:
            return jsonify({
                'success': False,
                'error': 'No se encontro un profesional de ventas asociado a este usuario'
            }), 404

        period_id = request.args.get('period_id', None, type=int)

        query = CommissionPayment.query.filter_by(professional_id=professional.id)
        if period_id:
            query = query.filter_by(period_id=period_id)

        commissions = query.order_by(CommissionPayment.created_at.desc()).all()

        return jsonify({
            'success': True,
            'data': [c.to_dict() for c in commissions]
        }), 200

    except Exception as e:
        logger.error(f"Get my commissions error: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500


@portal_bp.route('/my-commissions/<int:commission_id>/detail', methods=['GET'])
@jwt_required()
def get_commission_detail(commission_id):
    """Detailed breakdown of a commission (sales, KPIs, LLAVE scores)"""
    try:
        user_id = get_jwt_identity()
        professional = _get_professional_for_user(user_id)

        if not professional:
            return jsonify({
                'success': False,
                'error': 'No se encontro un profesional de ventas asociado a este usuario'
            }), 404

        commission = CommissionPayment.query.get(commission_id)

        if not commission:
            return jsonify({'success': False, 'error': 'Pago de comision no encontrado'}), 404

        if commission.professional_id != professional.id:
            return jsonify({'success': False, 'error': 'No tiene permiso para ver esta comision'}), 403

        # Get related sales for the same period and professional
        sales = Sale.query.filter_by(
            professional_id=professional.id,
            period_id=commission.period_id
        ).all()

        # Get related objections
        objections = Objection.query.filter_by(
            commission_payment_id=commission.id,
            professional_id=professional.id
        ).all()

        result = commission.to_dict()
        result['sales'] = [s.to_dict() for s in sales]
        result['objections'] = [o.to_dict() for o in objections]

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        logger.error(f"Get commission detail error: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500


@portal_bp.route('/objections', methods=['POST'])
@jwt_required()
def create_objection():
    """Create an objection (only during claim period)"""
    try:
        user_id = get_jwt_identity()
        professional = _get_professional_for_user(user_id)

        if not professional:
            return jsonify({
                'success': False,
                'error': 'No se encontro un profesional de ventas asociado a este usuario'
            }), 404

        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Datos requeridos'}), 400

        commission_payment_id = data.get('commission_payment_id')
        if not commission_payment_id:
            return jsonify({'success': False, 'error': 'ID de pago de comision requerido'}), 400

        commission = CommissionPayment.query.get(commission_payment_id)
        if not commission:
            return jsonify({'success': False, 'error': 'Pago de comision no encontrado'}), 404

        if commission.professional_id != professional.id:
            return jsonify({'success': False, 'error': 'No tiene permiso para objetar esta comision'}), 403

        # Check claim deadline
        if not commission.claim_deadline:
            return jsonify({
                'success': False,
                'error': 'Esta liquidacion aun no ha sido publicada para reclamaciones'
            }), 400

        now = datetime.utcnow()
        if now > commission.claim_deadline:
            return jsonify({
                'success': False,
                'error': 'El periodo de reclamaciones ha expirado'
            }), 400

        description = data.get('description')
        if not description:
            return jsonify({'success': False, 'error': 'Descripcion de la objecion requerida'}), 400

        objection = Objection(
            commission_payment_id=commission_payment_id,
            professional_id=professional.id,
            period_id=commission.period_id,
            objection_type=data.get('objection_type', 'other'),
            description=description,
            reference_type=data.get('reference_type'),
            reference_value=data.get('reference_value'),
            status='pending',
            claim_deadline=commission.claim_deadline
        )

        db.session.add(objection)
        db.session.commit()

        logger.info(f"Objection created: {objection.id} by professional {professional.id}")

        return jsonify({
            'success': True,
            'data': objection.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create objection error: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500


@portal_bp.route('/objections', methods=['GET'])
@jwt_required()
def get_my_objections():
    """List my objections"""
    try:
        user_id = get_jwt_identity()
        professional = _get_professional_for_user(user_id)

        if not professional:
            return jsonify({
                'success': False,
                'error': 'No se encontro un profesional de ventas asociado a este usuario'
            }), 404

        period_id = request.args.get('period_id', None, type=int)
        status_filter = request.args.get('status', None, type=str)

        query = Objection.query.filter_by(professional_id=professional.id)
        if period_id:
            query = query.filter_by(period_id=period_id)
        if status_filter:
            query = query.filter_by(status=status_filter)

        objections = query.order_by(Objection.created_at.desc()).all()

        return jsonify({
            'success': True,
            'data': [o.to_dict() for o in objections]
        }), 200

    except Exception as e:
        logger.error(f"Get my objections error: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500


@portal_bp.route('/weekly-progress', methods=['GET'])
@jwt_required()
def get_weekly_progress():
    """Weekly sales progress (grouped by week for current period)"""
    try:
        user_id = get_jwt_identity()
        professional = _get_professional_for_user(user_id)

        if not professional:
            return jsonify({
                'success': False,
                'error': 'No se encontro un profesional de ventas asociado a este usuario'
            }), 404

        period_id = request.args.get('period_id', None, type=int)

        if period_id:
            period = Period.query.get(period_id)
        else:
            period = Period.query.filter(
                Period.status.in_(['open', 'in_progress'])
            ).order_by(Period.year.desc(), Period.month.desc()).first()

        if not period:
            return jsonify({
                'success': True,
                'data': {'period': None, 'weeks': []}
            }), 200

        sales = Sale.query.filter_by(
            professional_id=professional.id,
            period_id=period.id
        ).order_by(Sale.sale_date.asc()).all()

        # Group sales by ISO week
        weeks = {}
        for sale in sales:
            if sale.sale_date:
                week_number = sale.sale_date.isocalendar()[1]
                week_key = f"Semana {week_number}"
                if week_key not in weeks:
                    weeks[week_key] = {
                        'week': week_key,
                        'week_number': week_number,
                        'sales_count': 0,
                        'total_value': 0.0,
                        'total_commission': 0.0,
                    }
                weeks[week_key]['sales_count'] += 1
                weeks[week_key]['total_value'] += sale.sale_value or 0.0
                weeks[week_key]['total_commission'] += sale.commission_value or 0.0

        # Sort by week number
        sorted_weeks = sorted(weeks.values(), key=lambda w: w['week_number'])

        return jsonify({
            'success': True,
            'data': {
                'period': period.to_dict(),
                'weeks': sorted_weeks,
                'total_sales': len(sales),
                'total_value': sum(s.sale_value or 0.0 for s in sales),
                'total_commission': sum(s.commission_value or 0.0 for s in sales),
            }
        }), 200

    except Exception as e:
        logger.error(f"Get weekly progress error: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500
