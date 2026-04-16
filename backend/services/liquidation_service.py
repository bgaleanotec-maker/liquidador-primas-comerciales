from extensions import db
from models import Liquidation, KPIResult, KPITarget, Llave, KPI, Period, User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class LiquidationService:
    @staticmethod
    def calculate(period_id, user_id=None, business_unit_id=None, base_salary=None):
        """
        Calculate premium for a user or group in a period.

        Algorithm:
        1. Get business unit structure (llaves + kpis with weights)
        2. For each LLAVE at root level:
           a. If it's a compound llave (has children/sub-KPIs):
              - For each sub-KPI, get actual vs target
              - cumplimiento = actual/target * 100
              - Apply threshold logic (>= 80% = full credit)
              - kpi_score = cumplimiento * kpi_weight
              - llave_score = sum of kpi_scores
           b. If it's a simple KPI:
              - Direct cumplimiento calculation
        3. Apply llave weights: total_score = sum(llave_score * llave_weight)
        4. If base_salary provided: premium_amount = base_salary * total_score
        5. Return full breakdown dict
        """
        try:
            period = Period.query.get(period_id)
            if not period:
                raise ValueError(f"Period {period_id} not found")

            if not user_id and not business_unit_id:
                raise ValueError("Either user_id or business_unit_id must be provided")

            # Get user or business unit
            user = None
            bu = None
            if user_id:
                user = User.query.get(user_id)
                if not user:
                    raise ValueError(f"User {user_id} not found")
                bu = user.business_unit
            else:
                from models import BusinessUnit
                bu = BusinessUnit.query.get(business_unit_id)
                if not bu:
                    raise ValueError(f"Business unit {business_unit_id} not found")

            # Get root llaves for this business unit
            root_llaves = Llave.query.filter_by(
                business_unit_id=bu.id,
                parent_id=None
            ).order_by(Llave.level).all()

            breakdown = {
                'llaves': {},
                'total_score': 0.0,
                'premium_amount': 0.0,
                'premium_pct': 0.0,
                'notes': []
            }

            total_score = 0.0
            llave_weights_sum = sum(l.weight for l in root_llaves if l.weight)

            for llave in root_llaves:
                llave_data = LiquidationService._calculate_llave(
                    llave, period, user_id, llave_weights_sum
                )
                breakdown['llaves'][llave.code] = llave_data
                total_score += llave_data['score'] * (llave.weight / llave_weights_sum if llave_weights_sum > 0 else 0)

            breakdown['total_score'] = total_score

            # Calculate premium amount if base_salary provided
            if base_salary:
                breakdown['premium_amount'] = base_salary * total_score
                breakdown['premium_pct'] = total_score * 100

            return breakdown

        except Exception as e:
            logger.error(f"Error calculating liquidation: {str(e)}")
            raise

    @staticmethod
    def _calculate_llave(llave, period, user_id, total_weights):
        """Calculate score for a single llave"""
        llave_data = {
            'code': llave.code,
            'name': llave.name,
            'weight': llave.weight,
            'score': 0.0,
            'kpis': {},
            'details': []
        }

        # Get KPIs for this llave
        kpis = KPI.query.filter_by(llave_id=llave.id, is_active=True).all()

        if not kpis:
            return llave_data

        kpi_scores = []
        kpi_weights_sum = sum(k.weight for k in kpis if k.weight)

        for kpi in kpis:
            kpi_data = LiquidationService._calculate_kpi(kpi, period, user_id, kpi_weights_sum)
            llave_data['kpis'][kpi.id] = kpi_data
            kpi_scores.append({
                'kpi_id': kpi.id,
                'name': kpi.name,
                'weight': kpi.weight,
                'score': kpi_data['score'],
                'weighted_score': kpi_data['score'] * (kpi.weight / kpi_weights_sum if kpi_weights_sum > 0 else 0)
            })
            llave_data['details'].append(kpi_data)

        # Llave score = weighted average of kpi scores
        llave_data['score'] = sum(k['weighted_score'] for k in kpi_scores)

        return llave_data

    @staticmethod
    def _calculate_kpi(kpi, period, user_id, total_weights):
        """Calculate score for a single KPI"""
        kpi_data = {
            'kpi_id': kpi.id,
            'name': kpi.name,
            'weight': kpi.weight,
            'actual': 0.0,
            'target': 0.0,
            'cumplimiento': 0.0,
            'score': 0.0,
            'source_type': kpi.source_type
        }

        # Get the KPI result
        query = KPIResult.query.filter_by(
            kpi_id=kpi.id,
            period_id=period.id
        )

        if user_id:
            query = query.filter_by(user_id=user_id)

        result = query.first()

        if not result:
            return kpi_data

        # Get the target
        target_query = KPITarget.query.filter_by(
            kpi_id=kpi.id,
            period_id=period.id
        )
        if user_id:
            target_query = target_query.filter_by(user_id=user_id)

        target = target_query.first()

        kpi_data['actual'] = result.actual_value

        if target:
            kpi_data['target'] = target.target_value
            if target.target_value > 0:
                cumplimiento = (result.actual_value / target.target_value) * 100
                kpi_data['cumplimiento'] = cumplimiento

                # Apply threshold logic: >= 80% = full credit (1.0)
                if cumplimiento >= 80:
                    kpi_data['score'] = 1.0
                elif cumplimiento >= 50:
                    # Linear interpolation between 50% and 80%
                    kpi_data['score'] = (cumplimiento - 50) / (80 - 50) * 0.5
                else:
                    kpi_data['score'] = 0.0

        return kpi_data

    @staticmethod
    def create_liquidation(period_id, user_id=None, business_unit_id=None, base_salary=None):
        """Create or update a liquidation record"""
        try:
            period = Period.query.get(period_id)
            if not period:
                raise ValueError(f"Period {period_id} not found")

            # Get existing liquidation or create new one
            if user_id:
                liquidation = Liquidation.query.filter_by(
                    period_id=period_id,
                    user_id=user_id
                ).first()
            else:
                liquidation = Liquidation.query.filter_by(
                    period_id=period_id,
                    business_unit_id=business_unit_id
                ).first()

            if not liquidation:
                if user_id:
                    liquidation = Liquidation(period_id=period_id, user_id=user_id)
                else:
                    liquidation = Liquidation(period_id=period_id, business_unit_id=business_unit_id)

            # Calculate the premium
            breakdown = LiquidationService.calculate(period_id, user_id, business_unit_id, base_salary)

            liquidation.llave_score = breakdown['total_score']
            liquidation.premium_pct = breakdown.get('premium_pct', 0.0)
            liquidation.base_salary = base_salary
            liquidation.premium_amount = breakdown.get('premium_amount', 0.0)
            liquidation.details = breakdown
            liquidation.status = 'draft'
            liquidation.updated_at = datetime.utcnow()

            db.session.add(liquidation)
            db.session.commit()

            logger.info(f"Created/updated liquidation {liquidation.id}")
            return liquidation

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating liquidation: {str(e)}")
            raise

    @staticmethod
    def submit_liquidation(liquidation_id):
        """Submit liquidation for approval and create approval steps"""
        from models import ApprovalStep

        try:
            liquidation = Liquidation.query.get(liquidation_id)
            if not liquidation:
                raise ValueError(f"Liquidation {liquidation_id} not found")

            if liquidation.status != 'draft':
                raise ValueError(f"Can only submit draft liquidations, current status: {liquidation.status}")

            liquidation.status = 'submitted'
            liquidation.submitted_at = datetime.utcnow()

            # Create approval steps if none exist
            existing_steps = ApprovalStep.query.filter_by(liquidation_id=liquidation_id).count()
            if existing_steps == 0:
                # Step 1: Approver
                approver = User.query.filter_by(role='approver', is_active=True).first()
                if approver:
                    step1 = ApprovalStep(
                        liquidation_id=liquidation.id,
                        step_order=1,
                        approver_id=approver.id,
                        status='pending',
                        required_role='approver'
                    )
                    db.session.add(step1)

                # Step 2: Admin
                admin = User.query.filter_by(role='admin', is_active=True).first()
                if admin:
                    step2 = ApprovalStep(
                        liquidation_id=liquidation.id,
                        step_order=2,
                        approver_id=admin.id,
                        status='pending',
                        required_role='admin'
                    )
                    db.session.add(step2)

            db.session.commit()

            logger.info(f"Submitted liquidation {liquidation_id} with approval steps")
            return liquidation

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error submitting liquidation: {str(e)}")
            raise

    @staticmethod
    def normalize_weights(kpis_or_llaves):
        """Auto-normalize weights to sum to 1.0"""
        total = sum(k.weight for k in kpis_or_llaves if k.weight)
        if total == 0:
            return kpis_or_llaves

        for k in kpis_or_llaves:
            if k.weight:
                k._normalized_weight = k.weight / total

        return kpis_or_llaves
