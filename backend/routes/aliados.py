"""Aliados (firmas) y asignaciones temporales de Responsable Oficina Central.

Este módulo implementa la fase Beta solicitada:
- Maestro de Aliados (cargado del diccionario_aliados_Marzo.xlsx).
- Historia temporal de responsables (start/end date, estados de vacaciones,
  incapacidad, reasignación, etc.).
- Resolver: dado (llave aliado, fecha de venta) -> ¿quién era responsable?
- Vista por supervisor (cada supervisor administra su grupo).
- Vista por profesional (cuántas ventas/comisiones le corresponden).
"""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_, func
from extensions import db
from models import (
    Aliado, AliadoAssignment, User, Sale, CommissionPayment, BusinessUnit, Period
)
from models.aliado_assignment import STATUSES
from decorators import role_required
from datetime import date, datetime
from io import BytesIO
import pandas as pd
import logging

logger = logging.getLogger(__name__)

aliados_bp = Blueprint('aliados', __name__)


def _current_user():
    return User.query.get(get_jwt_identity())


def _can_admin(user):
    return user.role in ('super_admin', 'admin')


def _supervisor_filter(user, query):
    """Si el user es supervisor, filtra solo sus aliados."""
    if user.role == 'supervisor':
        return query.filter(Aliado.supervisor_user_id == user.id)
    return query


# ─── Aliados (CRUD) ─────────────────────────────────────────────────────────

@aliados_bp.route('', methods=['GET'])
@aliados_bp.route('/', methods=['GET'])
@jwt_required()
def list_aliados():
    user = _current_user()
    sociedad = request.args.get('sociedad')
    tipo = request.args.get('tipo_aliado')
    supervisor_id = request.args.get('supervisor_user_id', type=int)
    search = request.args.get('search')
    is_active = request.args.get('is_active')
    include_current = request.args.get('include_current', 'true').lower() == 'true'
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 100, type=int)

    q = Aliado.query
    q = _supervisor_filter(user, q)

    if sociedad:
        q = q.filter(Aliado.sociedad == sociedad)
    if tipo:
        q = q.filter(Aliado.tipo_aliado == tipo)
    if supervisor_id and _can_admin(user):
        q = q.filter(Aliado.supervisor_user_id == supervisor_id)
    if is_active is not None:
        q = q.filter(Aliado.is_active == (is_active.lower() == 'true'))
    if search:
        like = f"%{search}%"
        q = q.filter(or_(
            Aliado.nombre_firma.ilike(like),
            Aliado.llave.ilike(like),
            Aliado.nit.ilike(like),
            Aliado.bp_vantilisto.ilike(like),
        ))

    pag = q.order_by(Aliado.nombre_firma).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': {
            'aliados': [a.to_dict(include_current=include_current) for a in pag.items],
            'pagination': {
                'page': page, 'per_page': per_page,
                'total': pag.total, 'pages': pag.pages,
            }
        }
    })


@aliados_bp.route('/<int:aliado_id>', methods=['GET'])
@jwt_required()
def get_aliado(aliado_id):
    user = _current_user()
    aliado = Aliado.query.get(aliado_id)
    if not aliado:
        return jsonify({'success': False, 'error': 'Aliado no encontrado'}), 404
    if user.role == 'supervisor' and aliado.supervisor_user_id != user.id:
        return jsonify({'success': False, 'error': 'Sin permisos'}), 403
    return jsonify({'success': True, 'data': aliado.to_dict(include_current=True)})


@aliados_bp.route('', methods=['POST'])
@aliados_bp.route('/', methods=['POST'])
@role_required('super_admin', 'admin')
def create_aliado():
    data = request.get_json() or {}
    required = ['nombre_firma', 'sociedad']
    if not all(data.get(f) for f in required):
        return jsonify({'success': False, 'error': 'nombre_firma y sociedad requeridos'}), 400

    llave = data.get('llave') or f"{data['nombre_firma']}{data['sociedad']}"
    if Aliado.query.filter_by(llave=llave).first():
        return jsonify({'success': False, 'error': 'Llave ya existe'}), 409

    a = Aliado(
        llave=llave,
        nit=data.get('nit'),
        bp_vantilisto=data.get('bp_vantilisto'),
        tipo_aliado=data.get('tipo_aliado'),
        nombre_firma=data['nombre_firma'],
        nombre_correcto=data.get('nombre_correcto'),
        sociedad=data['sociedad'],
        supervisor_user_id=data.get('supervisor_user_id'),
        is_active=data.get('is_active', True),
        notes=data.get('notes'),
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({'success': True, 'data': a.to_dict(include_current=True)}), 201


@aliados_bp.route('/<int:aliado_id>', methods=['PUT'])
@role_required('super_admin', 'admin', 'supervisor')
def update_aliado(aliado_id):
    user = _current_user()
    a = Aliado.query.get(aliado_id)
    if not a:
        return jsonify({'success': False, 'error': 'Aliado no encontrado'}), 404
    if user.role == 'supervisor' and a.supervisor_user_id != user.id:
        return jsonify({'success': False, 'error': 'Sin permisos'}), 403

    data = request.get_json() or {}
    # Supervisor solo puede editar notes y nombre_correcto
    allowed_supervisor = {'notes', 'nombre_correcto'}
    for field in ('nit', 'bp_vantilisto', 'tipo_aliado', 'nombre_firma', 'nombre_correcto',
                  'sociedad', 'is_active', 'notes', 'supervisor_user_id'):
        if field in data:
            if user.role == 'supervisor' and field not in allowed_supervisor:
                continue
            setattr(a, field, data[field])

    db.session.commit()
    return jsonify({'success': True, 'data': a.to_dict(include_current=True)})


@aliados_bp.route('/<int:aliado_id>', methods=['DELETE'])
@role_required('super_admin', 'admin')
def delete_aliado(aliado_id):
    a = Aliado.query.get(aliado_id)
    if not a:
        return jsonify({'success': False, 'error': 'Aliado no encontrado'}), 404
    a.is_active = False
    db.session.commit()
    return jsonify({'success': True, 'data': {'message': 'Aliado desactivado'}})


# ─── Historia (Asignaciones) ───────────────────────────────────────────────

@aliados_bp.route('/<int:aliado_id>/history', methods=['GET'])
@jwt_required()
def list_history(aliado_id):
    user = _current_user()
    a = Aliado.query.get(aliado_id)
    if not a:
        return jsonify({'success': False, 'error': 'Aliado no encontrado'}), 404
    if user.role == 'supervisor' and a.supervisor_user_id != user.id:
        return jsonify({'success': False, 'error': 'Sin permisos'}), 403

    rows = (AliadoAssignment.query
            .filter_by(aliado_id=aliado_id)
            .order_by(AliadoAssignment.start_date.desc())
            .all())
    return jsonify({'success': True, 'data': [r.to_dict() for r in rows]})


@aliados_bp.route('/<int:aliado_id>/history', methods=['POST'])
@role_required('super_admin', 'admin', 'supervisor')
def add_history(aliado_id):
    """Crear una nueva asignación. Cierra automáticamente la anterior abierta
    (end_date) si la nueva se solapa, para mantener la línea de tiempo coherente.
    """
    user = _current_user()
    a = Aliado.query.get(aliado_id)
    if not a:
        return jsonify({'success': False, 'error': 'Aliado no encontrado'}), 404
    if user.role == 'supervisor' and a.supervisor_user_id != user.id:
        return jsonify({'success': False, 'error': 'Sin permisos sobre este aliado'}), 403

    data = request.get_json() or {}
    if not data.get('professional_name') or not data.get('start_date'):
        return jsonify({'success': False, 'error': 'professional_name y start_date son requeridos'}), 400

    try:
        start = date.fromisoformat(data['start_date'])
    except Exception:
        return jsonify({'success': False, 'error': 'start_date inválido (YYYY-MM-DD)'}), 400
    end = None
    if data.get('end_date'):
        try:
            end = date.fromisoformat(data['end_date'])
        except Exception:
            return jsonify({'success': False, 'error': 'end_date inválido (YYYY-MM-DD)'}), 400
    status = data.get('status', 'active')
    if status not in STATUSES:
        return jsonify({'success': False, 'error': f'status debe ser uno de {STATUSES}'}), 400

    # Cerrar asignación abierta previa (end_date null o end_date >= start)
    open_prev = (AliadoAssignment.query
                 .filter(AliadoAssignment.aliado_id == aliado_id)
                 .filter(or_(AliadoAssignment.end_date == None, AliadoAssignment.end_date >= start))
                 .filter(AliadoAssignment.start_date < start)
                 .order_by(AliadoAssignment.start_date.desc())
                 .first())
    if open_prev and (open_prev.end_date is None or open_prev.end_date >= start):
        from datetime import timedelta
        open_prev.end_date = start - timedelta(days=1)

    professional_user_id = data.get('professional_user_id')
    if professional_user_id:
        u = User.query.get(professional_user_id)
        if not u:
            return jsonify({'success': False, 'error': 'Usuario profesional no encontrado'}), 404

    asg = AliadoAssignment(
        aliado_id=aliado_id,
        professional_user_id=professional_user_id,
        professional_name=data['professional_name'],
        responsable_filial=data.get('responsable_filial'),
        start_date=start,
        end_date=end,
        status=status,
        notes=data.get('notes'),
        created_by_user_id=user.id,
    )
    db.session.add(asg)
    db.session.commit()
    return jsonify({'success': True, 'data': asg.to_dict()}), 201


@aliados_bp.route('/history/<int:asg_id>', methods=['PUT'])
@role_required('super_admin', 'admin', 'supervisor')
def update_history(asg_id):
    user = _current_user()
    asg = AliadoAssignment.query.get(asg_id)
    if not asg:
        return jsonify({'success': False, 'error': 'Asignación no encontrada'}), 404
    if user.role == 'supervisor' and asg.aliado.supervisor_user_id != user.id:
        return jsonify({'success': False, 'error': 'Sin permisos'}), 403

    data = request.get_json() or {}
    if 'professional_name' in data:
        asg.professional_name = data['professional_name']
    if 'professional_user_id' in data:
        asg.professional_user_id = data['professional_user_id']
    if 'responsable_filial' in data:
        asg.responsable_filial = data['responsable_filial']
    if 'start_date' in data and data['start_date']:
        asg.start_date = date.fromisoformat(data['start_date'])
    if 'end_date' in data:
        asg.end_date = date.fromisoformat(data['end_date']) if data['end_date'] else None
    if 'status' in data:
        if data['status'] not in STATUSES:
            return jsonify({'success': False, 'error': f'status debe ser uno de {STATUSES}'}), 400
        asg.status = data['status']
    if 'notes' in data:
        asg.notes = data['notes']

    db.session.commit()
    return jsonify({'success': True, 'data': asg.to_dict()})


@aliados_bp.route('/history/<int:asg_id>', methods=['DELETE'])
@role_required('super_admin', 'admin')
def delete_history(asg_id):
    asg = AliadoAssignment.query.get(asg_id)
    if not asg:
        return jsonify({'success': False, 'error': 'Asignación no encontrada'}), 404
    db.session.delete(asg)
    db.session.commit()
    return jsonify({'success': True, 'data': {'message': 'Asignación eliminada'}})


# ─── Resolver (API/ODBC consumible) ─────────────────────────────────────────

@aliados_bp.route('/resolve', methods=['GET'])
@jwt_required()
def resolve_responsable():
    """Resuelve responsable de un aliado a una fecha dada.

    Params: llave (str) | aliado_id (int) y fecha (YYYY-MM-DD).
    Devuelve professional_name, status, periodo_vigencia.
    """
    fecha_s = request.args.get('fecha')
    llave = request.args.get('llave')
    aliado_id = request.args.get('aliado_id', type=int)

    if not fecha_s:
        return jsonify({'success': False, 'error': 'fecha requerida (YYYY-MM-DD)'}), 400
    try:
        ref = date.fromisoformat(fecha_s)
    except Exception:
        return jsonify({'success': False, 'error': 'fecha inválida'}), 400

    if not llave and not aliado_id:
        return jsonify({'success': False, 'error': 'llave o aliado_id requerido'}), 400

    a = (Aliado.query.get(aliado_id) if aliado_id else
         Aliado.query.filter_by(llave=llave).first())
    if not a:
        return jsonify({'success': False, 'error': 'Aliado no encontrado'}), 404

    asg = AliadoAssignment.current_for_aliado(a.id, ref)
    if not asg:
        return jsonify({
            'success': True,
            'data': {
                'aliado': a.to_dict(),
                'fecha': fecha_s,
                'resolved': False,
                'message': 'Sin asignación vigente en la fecha consultada',
            }
        })
    return jsonify({
        'success': True,
        'data': {
            'aliado': a.to_dict(),
            'fecha': fecha_s,
            'resolved': True,
            'assignment': asg.to_dict(),
        }
    })


# ─── Importar diccionario_aliados.xlsx ──────────────────────────────────────

def _norm(v):
    if v is None:
        return None
    if isinstance(v, float) and pd.isna(v):
        return None
    s = str(v).strip()
    return s or None


def import_diccionario_dataframe(df: pd.DataFrame, default_start_date: date, created_by_user_id=None):
    """Importa filas del diccionario_aliados a Aliado + AliadoAssignment.

    Reglas:
    - Si la llave existe: actualiza datos del aliado pero preserva historia.
    - Crea/actualiza una AliadoAssignment "abierta" (end_date null) con el
      responsable actual a partir de default_start_date.
    """
    expected = {'NIT', 'BP VantiListo', 'Tipo_aliado', 'NOMBRE_FIRMA', 'sociedad',
                'Responsable oficina central', 'Responsable Filial', 'llave', 'supervisor'}
    missing = expected - set(df.columns)
    if missing:
        raise ValueError(f'Faltan columnas en Excel: {missing}')

    created_aliados = 0
    updated_aliados = 0
    created_asg = 0
    skipped = 0

    for _, row in df.iterrows():
        nombre = _norm(row.get('NOMBRE_FIRMA'))
        sociedad = _norm(row.get('sociedad'))
        if not nombre or not sociedad:
            skipped += 1
            continue
        llave = _norm(row.get('llave')) or f"{nombre}{sociedad}"

        a = Aliado.query.filter_by(llave=llave).first()
        is_new = a is None
        if is_new:
            a = Aliado(llave=llave, nombre_firma=nombre, sociedad=sociedad)
            db.session.add(a)

        a.nit = _norm(row.get('NIT'))
        a.bp_vantilisto = _norm(row.get('BP VantiListo'))
        a.tipo_aliado = _norm(row.get('Tipo_aliado'))
        a.nombre_firma = nombre
        a.sociedad = sociedad
        a.nombre_correcto = _norm(row.get('Nombre Correcto'))

        # Mapear supervisor por nombre a User (rol=supervisor)
        sup_name = _norm(row.get('supervisor'))
        if sup_name:
            sup = User.query.filter(func.lower(User.name) == sup_name.lower()).first()
            if sup:
                a.supervisor_user_id = sup.id

        db.session.flush()

        prof_name = _norm(row.get('Responsable oficina central'))
        if prof_name:
            current = AliadoAssignment.current_for_aliado(a.id)
            need_new = (current is None or
                        current.professional_name.lower() != prof_name.lower())
            if need_new:
                if current and current.end_date is None:
                    from datetime import timedelta
                    current.end_date = default_start_date - timedelta(days=1)
                # Buscar usuario profesional asociado
                prof_user = User.query.filter(
                    and_(User.role == 'professional',
                         func.lower(User.name) == prof_name.lower())).first()
                asg = AliadoAssignment(
                    aliado_id=a.id,
                    professional_user_id=prof_user.id if prof_user else None,
                    professional_name=prof_name,
                    responsable_filial=_norm(row.get('Responsable Filial')),
                    start_date=default_start_date,
                    end_date=None,
                    status='active',
                    created_by_user_id=created_by_user_id,
                )
                db.session.add(asg)
                created_asg += 1

        if is_new:
            created_aliados += 1
        else:
            updated_aliados += 1

    db.session.commit()
    return {
        'created_aliados': created_aliados,
        'updated_aliados': updated_aliados,
        'created_assignments': created_asg,
        'skipped_rows': skipped,
    }


@aliados_bp.route('/import', methods=['POST'])
@role_required('super_admin', 'admin')
def import_diccionario():
    """Sube un diccionario_aliados.xlsx (hoja Base) y carga aliados+historial."""
    user = _current_user()
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'Archivo requerido (multipart "file")'}), 400
    f = request.files['file']
    if not f.filename.lower().endswith(('.xlsx', '.xls')):
        return jsonify({'success': False, 'error': 'Se requiere archivo Excel'}), 400

    sheet = request.form.get('sheet', 'Base')
    start_s = request.form.get('start_date')
    if start_s:
        try:
            start = date.fromisoformat(start_s)
        except Exception:
            return jsonify({'success': False, 'error': 'start_date inválido'}), 400
    else:
        start = date.today().replace(day=1)

    try:
        df = pd.read_excel(f, sheet_name=sheet)
        result = import_diccionario_dataframe(df, start, created_by_user_id=user.id)
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f'Import diccionario error: {e}', exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


# ─── Stats / Resumen para Dashboard ─────────────────────────────────────────

@aliados_bp.route('/stats/summary', methods=['GET'])
@jwt_required()
def stats_summary():
    user = _current_user()
    base = Aliado.query
    base = _supervisor_filter(user, base)

    total = base.count()
    active = base.filter(Aliado.is_active == True).count()
    by_sociedad = (db.session.query(Aliado.sociedad, func.count(Aliado.id))
                   .filter(Aliado.id.in_([a.id for a in base.all()]) if user.role == 'supervisor' else True)
                   .group_by(Aliado.sociedad).all())
    by_tipo = (db.session.query(Aliado.tipo_aliado, func.count(Aliado.id))
               .filter(Aliado.id.in_([a.id for a in base.all()]) if user.role == 'supervisor' else True)
               .group_by(Aliado.tipo_aliado).all())

    # Asignaciones por estado (vigentes hoy)
    today = date.today()
    asgs = (db.session.query(AliadoAssignment.status, func.count(AliadoAssignment.id))
            .filter(AliadoAssignment.start_date <= today)
            .filter(or_(AliadoAssignment.end_date == None, AliadoAssignment.end_date >= today)))
    if user.role == 'supervisor':
        asgs = asgs.join(Aliado).filter(Aliado.supervisor_user_id == user.id)
    by_status = asgs.group_by(AliadoAssignment.status).all()

    return jsonify({'success': True, 'data': {
        'total_aliados': total,
        'active_aliados': active,
        'by_sociedad': [{'sociedad': s or 'N/A', 'count': c} for s, c in by_sociedad],
        'by_tipo': [{'tipo': t or 'N/A', 'count': c} for t, c in by_tipo],
        'assignments_by_status': [{'status': s, 'count': c} for s, c in by_status],
    }})


@aliados_bp.route('/stats/professional/<int:user_id>', methods=['GET'])
@jwt_required()
def stats_for_professional(user_id):
    """Resumen de un profesional: cantidad de aliados activos, ventas y comisiones."""
    me = _current_user()
    if me.role == 'professional' and me.id != user_id:
        return jsonify({'success': False, 'error': 'Sin permisos'}), 403

    today = date.today()
    asg_q = (AliadoAssignment.query
             .filter(AliadoAssignment.professional_user_id == user_id)
             .filter(AliadoAssignment.start_date <= today)
             .filter(or_(AliadoAssignment.end_date == None, AliadoAssignment.end_date >= today)))
    aliados_activos = asg_q.count()

    historic_total = (AliadoAssignment.query
                      .filter_by(professional_user_id=user_id).count())

    # Ventas y comisiones agregadas (si existen en el sistema)
    sales_count = (Sale.query.filter_by(professional_id=user_id).count() or 0)
    sales_value = (db.session.query(func.coalesce(func.sum(Sale.sale_value), 0))
                   .filter(Sale.professional_id == user_id).scalar() or 0)
    commission_total = (db.session.query(func.coalesce(func.sum(Sale.commission_value), 0))
                        .filter(Sale.professional_id == user_id).scalar() or 0)
    commissions_paid = (db.session.query(func.coalesce(func.sum(CommissionPayment.amount), 0))
                        .filter(CommissionPayment.professional_id == user_id,
                                CommissionPayment.status == 'paid').scalar() or 0)

    return jsonify({'success': True, 'data': {
        'aliados_activos': aliados_activos,
        'asignaciones_historicas': historic_total,
        'ventas_count': sales_count,
        'ventas_valor': float(sales_value),
        'comisiones_total': float(commission_total),
        'comisiones_pagadas': float(commissions_paid),
    }})


@aliados_bp.route('/me/assignments', methods=['GET'])
@jwt_required()
def my_assignments():
    user = _current_user()
    today = date.today()
    q = (AliadoAssignment.query
         .filter(AliadoAssignment.professional_user_id == user.id)
         .order_by(AliadoAssignment.start_date.desc()))
    rows = q.all()
    active = [r for r in rows
              if r.start_date <= today and (r.end_date is None or r.end_date >= today)]
    return jsonify({'success': True, 'data': {
        'all': [r.to_dict() for r in rows],
        'active': [r.to_dict() for r in active],
    }})


# ─── Export de la base resuelta (para reportería externa) ──────────────────

@aliados_bp.route('/export', methods=['GET'])
@jwt_required()
def export_aliados():
    """Exporta a Excel todos los aliados con su asignación vigente en una fecha."""
    user = _current_user()
    fecha_s = request.args.get('fecha')
    try:
        ref = date.fromisoformat(fecha_s) if fecha_s else date.today()
    except Exception:
        return jsonify({'success': False, 'error': 'fecha inválida'}), 400

    q = Aliado.query
    q = _supervisor_filter(user, q)
    rows = []
    for a in q.order_by(Aliado.nombre_firma).all():
        asg = AliadoAssignment.current_for_aliado(a.id, ref)
        rows.append({
            'NIT': a.nit,
            'BP VantiListo': a.bp_vantilisto,
            'Tipo_aliado': a.tipo_aliado,
            'NOMBRE_FIRMA': a.nombre_firma,
            'sociedad': a.sociedad,
            'llave': a.llave,
            'supervisor': a.supervisor.name if a.supervisor else None,
            'Responsable oficina central': asg.professional_name if asg else None,
            'Responsable Filial': asg.responsable_filial if asg else None,
            'estado': asg.status if asg else None,
            'vigencia_desde': asg.start_date.isoformat() if asg else None,
            'vigencia_hasta': asg.end_date.isoformat() if asg and asg.end_date else None,
        })

    df = pd.DataFrame(rows)
    out = BytesIO()
    with pd.ExcelWriter(out, engine='openpyxl') as w:
        df.to_excel(w, sheet_name='Base', index=False)
    out.seek(0)
    return send_file(out,
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                     as_attachment=True,
                     download_name=f'aliados_{ref.isoformat()}.xlsx')
