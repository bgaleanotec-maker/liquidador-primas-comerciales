from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import User, Liquidation, Period, KPIResult, DataSource
import logging

logger = logging.getLogger(__name__)

metrics_bp = Blueprint('metrics', __name__)


@metrics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_metrics():
    """Get main dashboard metrics"""
    try:
        # Get latest period
        latest_period = Period.query.order_by(Period.year.desc(), Period.month.desc()).first()

        if not latest_period:
            return jsonify({
                'success': True,
                'data': {
                    'total_users': 0,
                    'pending_liquidations': 0,
                    'average_premium': 0.0,
                    'approved_liquidations': 0,
                    'top_performers': []
                }
            }), 200

        # Total users
        total_users = User.query.filter_by(is_active=True).count()

        # Pending liquidations
        pending_liquidations = Liquidation.query.filter_by(
            period_id=latest_period.id,
            status='submitted'
        ).count()

        # Average premium
        liquidations = Liquidation.query.filter_by(period_id=latest_period.id).all()
        average_premium = sum(l.premium_amount or 0 for l in liquidations) / len(liquidations) if liquidations else 0.0

        # Approved liquidations
        approved_liquidations = sum(1 for l in liquidations if l.status == 'approved')

        # Top performers (by score)
        top_performers = sorted(
            [{'user': l.user.name if l.user else 'N/A', 'score': l.llave_score} for l in liquidations],
            key=lambda x: x['score'],
            reverse=True
        )[:5]

        metrics = {
            'period': latest_period.to_dict(),
            'total_users': total_users,
            'pending_liquidations': pending_liquidations,
            'average_premium': average_premium,
            'approved_liquidations': approved_liquidations,
            'total_liquidations': len(liquidations),
            'top_performers': top_performers
        }

        return jsonify({'success': True, 'data': metrics}), 200

    except Exception as e:
        logger.error(f"Get dashboard metrics error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@metrics_bp.route('/kpi-compliance', methods=['GET'])
@jwt_required()
def get_kpi_compliance():
    """Get KPI compliance rates"""
    try:
        period_id = request.args.get('period_id', None, type=int)

        if not period_id:
            latest_period = Period.query.order_by(Period.year.desc(), Period.month.desc()).first()
            if not latest_period:
                return jsonify({'success': True, 'data': {}}), 200
            period_id = latest_period.id

        results = KPIResult.query.filter_by(period_id=period_id).all()

        if not results:
            return jsonify({'success': True, 'data': {}}), 200

        # Calculate compliance stats
        total_results = len(results)
        compliant_results = sum(1 for r in results if r.cumplimiento >= 80)
        partial_results = sum(1 for r in results if 50 <= r.cumplimiento < 80)
        non_compliant = sum(1 for r in results if r.cumplimiento < 50)

        compliance = {
            'period_id': period_id,
            'total': total_results,
            'compliant': compliant_results,
            'compliant_pct': (compliant_results / total_results * 100) if total_results > 0 else 0,
            'partial': partial_results,
            'partial_pct': (partial_results / total_results * 100) if total_results > 0 else 0,
            'non_compliant': non_compliant,
            'non_compliant_pct': (non_compliant / total_results * 100) if total_results > 0 else 0,
            'average_cumplimiento': sum(r.cumplimiento or 0 for r in results) / total_results if total_results > 0 else 0
        }

        return jsonify({'success': True, 'data': compliance}), 200

    except Exception as e:
        logger.error(f"Get KPI compliance error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@metrics_bp.route('/period-progress', methods=['GET'])
@jwt_required()
def get_period_progress():
    """Get period completion status"""
    try:
        period_id = request.args.get('period_id', None, type=int)

        if not period_id:
            return jsonify({'success': False, 'error': 'period_id required'}), 400

        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        liquidations = Liquidation.query.filter_by(period_id=period_id).all()

        if not liquidations:
            return jsonify({
                'success': True,
                'data': {
                    'period': period.to_dict(),
                    'total': 0,
                    'draft': 0,
                    'submitted': 0,
                    'approved': 0,
                    'rejected': 0,
                    'paid': 0,
                    'completion_pct': 0.0
                }
            }), 200

        total = len(liquidations)
        draft = sum(1 for l in liquidations if l.status == 'draft')
        submitted = sum(1 for l in liquidations if l.status == 'submitted')
        approved = sum(1 for l in liquidations if l.status == 'approved')
        rejected = sum(1 for l in liquidations if l.status == 'rejected')
        paid = sum(1 for l in liquidations if l.status == 'paid')

        completion_pct = ((approved + paid) / total * 100) if total > 0 else 0

        progress = {
            'period': period.to_dict(),
            'total': total,
            'draft': draft,
            'submitted': submitted,
            'approved': approved,
            'rejected': rejected,
            'paid': paid,
            'completion_pct': completion_pct
        }

        return jsonify({'success': True, 'data': progress}), 200

    except Exception as e:
        logger.error(f"Get period progress error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@metrics_bp.route('/source-coverage', methods=['GET'])
@jwt_required()
def get_source_coverage():
    """Get data source coverage percentage"""
    try:
        period_id = request.args.get('period_id', None, type=int)

        if not period_id:
            latest_period = Period.query.order_by(Period.year.desc(), Period.month.desc()).first()
            if not latest_period:
                return jsonify({'success': True, 'data': {}}), 200
            period_id = latest_period.id

        data_sources = DataSource.query.filter_by(is_active=True).all()

        if not data_sources:
            return jsonify({'success': True, 'data': {'total_sources': 0, 'active_sources': 0}}), 200

        coverage = {
            'period_id': period_id,
            'total_sources': len(data_sources),
            'active_sources': sum(1 for ds in data_sources if ds.last_sync),
            'sources': [
                {
                    'name': ds.name,
                    'type': ds.source_type,
                    'last_sync': ds.last_sync.isoformat() if ds.last_sync else None,
                    'is_active': ds.is_active
                }
                for ds in data_sources
            ]
        }

        return jsonify({'success': True, 'data': coverage}), 200

    except Exception as e:
        logger.error(f"Get source coverage error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
