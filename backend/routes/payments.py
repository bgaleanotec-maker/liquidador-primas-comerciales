from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import (
    CommissionPayment, Sale, SalesProfessional, Period, BusinessUnit,
    ProfessionalAssignment, Llave, LlaveConfig
)
from decorators import role_required
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('/', methods=['GET'])
@jwt_required()
def list_payments():
    """List commission payments"""
    try:
        period_id = request.args.get('period_id', None, type=int)
        business_unit_id = request.args.get('business_unit_id', None, type=int)
        professional_id = request.args.get('professional_id', None, type=int)
        status = request.args.get('status', None, type=str)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = CommissionPayment.query

        if period_id:
            query = query.filter_by(period_id=period_id)
        if business_unit_id:
            query = query.filter_by(business_unit_id=business_unit_id)
        if professional_id:
            query = query.filter_by(professional_id=professional_id)
        if status:
            query = query.filter_by(status=status)

        pagination = query.order_by(CommissionPayment.created_at.desc()).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'payments': [p.to_dict() for p in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"List payments error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@payments_bp.route('/calculate', methods=['POST'])
@role_required('super_admin', 'admin', 'analyst')
def calculate_commissions():
    """Calculate commissions for a period/BU"""
    try:
        data = request.get_json()

        if not data or not data.get('period_id') or not data.get('business_unit_id'):
            return jsonify({'success': False, 'error': 'period_id and business_unit_id required'}), 400

        period_id = data['period_id']
        business_unit_id = data['business_unit_id']

        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        bu = BusinessUnit.query.get(business_unit_id)
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        # Get all active assignments for this period and BU
        assignments = ProfessionalAssignment.query.join(SalesProfessional).filter(
            ProfessionalAssignment.period_id == period_id,
            SalesProfessional.business_unit_id == business_unit_id,
            ProfessionalAssignment.is_active == True
        ).all()

        if not assignments:
            return jsonify({'success': False, 'error': 'No active assignments found for this period/BU'}), 404

        # Get LLAVE config for this period/BU (with overrides)
        llaves = Llave.query.filter_by(business_unit_id=business_unit_id, is_active=True).all()
        llave_weights = {}
        for llave in llaves:
            config = LlaveConfig.query.filter_by(
                business_unit_id=business_unit_id,
                period_id=period_id,
                llave_id=llave.id,
                is_active=True
            ).first()
            llave_weights[llave.id] = config.weight_override if config and config.weight_override is not None else llave.weight

        created = 0
        updated = 0
        results = []

        # Get unique professionals from assignments
        professional_ids = list(set(a.professional_id for a in assignments))

        for prof_id in professional_ids:
            professional = SalesProfessional.query.get(prof_id)
            if not professional:
                continue

            # Aggregate sales for this professional in this period
            sales_agg = db.session.query(
                db.func.count(Sale.id).label('count'),
                db.func.coalesce(db.func.sum(Sale.sale_value), 0).label('total_value'),
                db.func.coalesce(db.func.sum(Sale.commission_value), 0).label('total_commission'),
            ).filter(
                Sale.professional_id == prof_id,
                Sale.period_id == period_id,
                Sale.business_unit_id == business_unit_id,
                Sale.status != 'cancelled'
            ).first()

            total_sales = float(sales_agg.total_value) if sales_agg else 0.0
            total_commission = float(sales_agg.total_commission) if sales_agg else 0.0

            # Simple llave score calculation (sum of weights for active llaves)
            llave_score = sum(llave_weights.values()) if llave_weights else 0.0

            # Premium calculation (simplified: based on llave score)
            premium_pct = llave_score * 100  # e.g., 0.85 -> 8.5%
            base_salary = data.get('base_salary', 0.0)
            premium_amount = base_salary * (premium_pct / 100) if base_salary else 0.0

            # Check if payment already exists
            existing = CommissionPayment.query.filter_by(
                period_id=period_id,
                professional_id=prof_id,
                business_unit_id=business_unit_id
            ).first()

            if existing:
                existing.total_sales = total_sales
                existing.total_commission = total_commission
                existing.llave_score = llave_score
                existing.premium_pct = premium_pct
                existing.premium_amount = premium_amount
                existing.base_salary = base_salary
                existing.status = 'calculated'
                existing.details = {
                    'sales_count': sales_agg.count if sales_agg else 0,
                    'llave_weights': {str(k): v for k, v in llave_weights.items()},
                }
                results.append(existing.to_dict())
                updated += 1
            else:
                payment = CommissionPayment(
                    period_id=period_id,
                    professional_id=prof_id,
                    business_unit_id=business_unit_id,
                    total_sales=total_sales,
                    total_commission=total_commission,
                    llave_score=llave_score,
                    premium_pct=premium_pct,
                    premium_amount=premium_amount,
                    base_salary=base_salary,
                    status='calculated',
                    details={
                        'sales_count': sales_agg.count if sales_agg else 0,
                        'llave_weights': {str(k): v for k, v in llave_weights.items()},
                    }
                )
                db.session.add(payment)
                results.append(payment.to_dict())
                created += 1

        db.session.commit()

        logger.info(f"Calculated commissions: {created} created, {updated} updated")

        return jsonify({
            'success': True,
            'data': {
                'created': created,
                'updated': updated,
                'payments': results
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Calculate commissions error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@payments_bp.route('/<int:payment_id>/approve', methods=['POST'])
@role_required('super_admin', 'admin', 'approver')
def approve_payment(payment_id):
    """Approve a commission payment"""
    try:
        payment = CommissionPayment.query.get(payment_id)

        if not payment:
            return jsonify({'success': False, 'error': 'Payment not found'}), 404

        if payment.status != 'calculated':
            return jsonify({'success': False, 'error': f'Cannot approve payment with status "{payment.status}"'}), 400

        payment.status = 'approved'
        db.session.commit()

        logger.info(f"Approved payment {payment_id}")

        return jsonify({'success': True, 'data': payment.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Approve payment error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@payments_bp.route('/<int:payment_id>/mark-paid', methods=['POST'])
@role_required('super_admin', 'admin')
def mark_payment_paid(payment_id):
    """Mark a payment as paid"""
    try:
        payment = CommissionPayment.query.get(payment_id)

        if not payment:
            return jsonify({'success': False, 'error': 'Payment not found'}), 404

        if payment.status != 'approved':
            return jsonify({'success': False, 'error': f'Cannot mark as paid with status "{payment.status}". Must be approved first.'}), 400

        data = request.get_json() or {}

        payment.status = 'paid'
        payment.payment_date = date.fromisoformat(data['payment_date']) if data.get('payment_date') else date.today()
        payment.payment_reference = data.get('payment_reference')

        db.session.commit()

        logger.info(f"Marked payment {payment_id} as paid")

        return jsonify({'success': True, 'data': payment.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Mark payment paid error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@payments_bp.route('/history', methods=['GET'])
@jwt_required()
def payment_history():
    """Payment history"""
    try:
        business_unit_id = request.args.get('business_unit_id', None, type=int)
        professional_id = request.args.get('professional_id', None, type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = CommissionPayment.query.filter(
            CommissionPayment.status.in_(['approved', 'paid'])
        )

        if business_unit_id:
            query = query.filter_by(business_unit_id=business_unit_id)
        if professional_id:
            query = query.filter_by(professional_id=professional_id)

        pagination = query.order_by(CommissionPayment.created_at.desc()).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'data': {
                'payments': [p.to_dict() for p in pagination.items],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Payment history error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
