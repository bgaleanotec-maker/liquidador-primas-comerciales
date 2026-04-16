from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password"""
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'error': 'Email and password required'}), 400

        user = User.query.filter_by(email=data['email']).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

        if not user.is_active:
            return jsonify({'success': False, 'error': 'User account is inactive'}), 401

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Create JWT token
        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'success': True,
            'data': {
                'token': access_token,
                'user': user.to_dict()
            }
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    try:
        # JWT is stateless, so logout is just a client-side operation
        # But we can log it for audit purposes
        user_id = get_jwt_identity()
        logger.info(f"User {user_id} logged out")

        return jsonify({'success': True, 'data': {'message': 'Logged out successfully'}}), 200

    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        return jsonify({'success': True, 'data': user.to_dict()}), 200

    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        data = request.get_json()

        if not data or not data.get('old_password') or not data.get('new_password'):
            return jsonify({'success': False, 'error': 'Old and new password required'}), 400

        if not user.check_password(data['old_password']):
            return jsonify({'success': False, 'error': 'Old password is incorrect'}), 401

        new_pw = data['new_password']
        if len(new_pw) < 8 or not any(c.isupper() for c in new_pw) or not any(c.isdigit() for c in new_pw):
            return jsonify({'success': False, 'error': 'Password must be at least 8 characters with uppercase and number'}), 400

        user.set_password(data['new_password'])
        db.session.commit()

        logger.info(f"User {user_id} changed password")

        return jsonify({'success': True, 'data': {'message': 'Password changed successfully'}}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Change password error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
