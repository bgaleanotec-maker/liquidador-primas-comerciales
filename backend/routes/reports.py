from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Liquidation, Period, User, KPIResult
from decorators import role_required
from io import BytesIO
import pandas as pd
import logging

logger = logging.getLogger(__name__)

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/monthly-summary', methods=['GET'])
@jwt_required()
def get_monthly_summary():
    """Get monthly summary report"""
    try:
        period_id = request.args.get('period_id', None, type=int)

        if not period_id:
            return jsonify({'success': False, 'error': 'period_id required'}), 400

        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        liquidations = Liquidation.query.filter_by(period_id=period_id).all()

        total_premium = sum(l.premium_amount or 0 for l in liquidations)
        avg_score = sum(l.llave_score or 0 for l in liquidations) / len(liquidations) if liquidations else 0
        approved_count = sum(1 for l in liquidations if l.status == 'approved')

        summary = {
            'period': period.to_dict(),
            'total_liquidations': len(liquidations),
            'approved': approved_count,
            'pending': len(liquidations) - approved_count,
            'total_premium': total_premium,
            'average_score': avg_score,
            'by_status': {}
        }

        # Count by status
        for status in ['draft', 'submitted', 'approved', 'rejected', 'paid']:
            count = sum(1 for l in liquidations if l.status == status)
            if count > 0:
                summary['by_status'][status] = count

        return jsonify({'success': True, 'data': summary}), 200

    except Exception as e:
        logger.error(f"Get monthly summary error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@reports_bp.route('/business-unit', methods=['GET'])
@jwt_required()
def get_business_unit_report():
    """Get business unit detail report"""
    try:
        period_id = request.args.get('period_id', None, type=int)
        bu_code = request.args.get('bu', None, type=str)

        if not period_id or not bu_code:
            return jsonify({'success': False, 'error': 'period_id and bu required'}), 400

        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        from models import BusinessUnit
        bu = BusinessUnit.query.filter_by(code=bu_code).first()
        if not bu:
            return jsonify({'success': False, 'error': 'Business unit not found'}), 404

        liquidations = Liquidation.query.filter_by(
            period_id=period_id,
            business_unit_id=bu.id
        ).all()

        details = {
            'period': period.to_dict(),
            'business_unit': bu.to_dict(),
            'total_users': len(liquidations),
            'total_premium': sum(l.premium_amount or 0 for l in liquidations),
            'average_score': sum(l.llave_score or 0 for l in liquidations) / len(liquidations) if liquidations else 0,
            'liquidations': [
                {
                    **l.to_dict(),
                    'user_name': l.user.name if l.user else 'N/A'
                }
                for l in liquidations
            ]
        }

        return jsonify({'success': True, 'data': details}), 200

    except Exception as e:
        logger.error(f"Get business unit report error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@reports_bp.route('/user-performance', methods=['GET'])
@jwt_required()
def get_user_performance():
    """Get user performance report"""
    try:
        period_id = request.args.get('period_id', None, type=int)
        user_id = request.args.get('user_id', None, type=int)

        if not period_id or not user_id:
            return jsonify({'success': False, 'error': 'period_id and user_id required'}), 400

        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        liquidation = Liquidation.query.filter_by(
            period_id=period_id,
            user_id=user_id
        ).first()

        if not liquidation:
            return jsonify({'success': False, 'error': 'No liquidation found for this user in this period'}), 404

        # Get KPI results for this user
        kpi_results = KPIResult.query.filter_by(
            period_id=period_id,
            user_id=user_id
        ).all()

        performance = {
            'period': period.to_dict(),
            'user': user.to_dict(),
            'liquidation': liquidation.to_dict(),
            'kpi_results': [r.to_dict() for r in kpi_results],
            'total_kpis': len(kpi_results),
            'average_cumplimiento': sum(r.cumplimiento or 0 for r in kpi_results) / len(kpi_results) if kpi_results else 0
        }

        return jsonify({'success': True, 'data': performance}), 200

    except Exception as e:
        logger.error(f"Get user performance error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@reports_bp.route('/trend', methods=['GET'])
@jwt_required()
def get_trend_analysis():
    """Get trend analysis over multiple periods"""
    try:
        months = request.args.get('months', 6, type=int)

        periods = Period.query.order_by(Period.year.desc(), Period.month.desc()).limit(months).all()

        trend_data = []

        for period in reversed(periods):
            liquidations = Liquidation.query.filter_by(period_id=period.id).all()

            period_trend = {
                'period': period.to_dict(),
                'count': len(liquidations),
                'total_premium': sum(l.premium_amount or 0 for l in liquidations),
                'average_score': sum(l.llave_score or 0 for l in liquidations) / len(liquidations) if liquidations else 0,
                'approved': sum(1 for l in liquidations if l.status == 'approved')
            }

            trend_data.append(period_trend)

        return jsonify({'success': True, 'data': trend_data}), 200

    except Exception as e:
        logger.error(f"Get trend analysis error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@reports_bp.route('/export', methods=['POST'])
@role_required('admin', 'analyst')
def export_report():
    """Export report to Excel"""
    try:
        data = request.get_json()

        period_id = data.get('period_id')
        report_type = data.get('report_type', 'summary')  # summary, detailed, users

        if not period_id:
            return jsonify({'success': False, 'error': 'period_id required'}), 400

        period = Period.query.get(period_id)
        if not period:
            return jsonify({'success': False, 'error': 'Period not found'}), 404

        liquidations = Liquidation.query.filter_by(period_id=period_id).all()

        # Create DataFrame
        export_data = []
        for liq in liquidations:
            row = {
                'Period': period.name,
                'User': liq.user.name if liq.user else 'N/A',
                'BusinessUnit': liq.business_unit.code if liq.business_unit else 'N/A',
                'Status': liq.status,
                'LlaveScore': liq.llave_score,
                'PremiumPct': liq.premium_pct,
                'BaseSalary': liq.base_salary,
                'PremiumAmount': liq.premium_amount,
                'CreatedAt': liq.created_at
            }
            export_data.append(row)

        df = pd.DataFrame(export_data)

        # Create Excel file
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Liquidations', index=False)

        output.seek(0)

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'report_{period.name}.xlsx'
        )

    except Exception as e:
        logger.error(f"Export report error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
