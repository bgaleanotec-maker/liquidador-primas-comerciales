import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'primax-secret-2024-dev')
    _db_uri = os.environ.get('DATABASE_URL', 'sqlite:///primax_dev.db')
    if _db_uri and _db_uri.startswith('postgres://'):
        _db_uri = _db_uri.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = _db_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Use 'primax' schema to coexist with other apps on the same PostgreSQL instance
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'options': '-csearch_path=primax'
        }
    } if _db_uri and _db_uri.startswith('postgresql') else {}
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-primax-secret-2024')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # Validate that secrets are explicitly set in production (not using defaults)
    if os.environ.get('FLASK_ENV') == 'production':
        if not os.environ.get('SECRET_KEY'):
            raise RuntimeError("SECRET_KEY environment variable must be set in production")
        if not os.environ.get('JWT_SECRET_KEY'):
            raise RuntimeError("JWT_SECRET_KEY environment variable must be set in production")
