from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask import jsonify
from models import User


def role_required(*roles):
    """Decorator to check if user has required role"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 401

            if not user.is_active:
                return jsonify({'success': False, 'error': 'User account is inactive'}), 401

            if user.role not in roles:
                return jsonify({'success': False, 'error': f'Requires one of these roles: {", ".join(roles)}'}), 403

            return fn(*args, **kwargs)

        return wrapper
    return decorator


def jwt_optional(fn):
    """Make JWT optional - user_id will be None if not authenticated"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
        except Exception:
            user_id = None

        return fn(*args, user_id=user_id, **kwargs)

    return wrapper
