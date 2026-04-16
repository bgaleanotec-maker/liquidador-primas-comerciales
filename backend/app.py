from flask import Flask, send_from_directory, jsonify
import os
import logging
from datetime import datetime

def create_app(config_name=None):
    """Create and configure Flask app"""
    app = Flask(__name__, static_folder=os.environ.get('STATIC_FOLDER', '../frontend/dist'), static_url_path='/')

    # Load configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    if config_name == 'testing':
        from config import TestingConfig
        app.config.from_object(TestingConfig)
    elif config_name == 'production':
        from config import ProductionConfig
        app.config.from_object(ProductionConfig)
    else:
        from config import DevelopmentConfig
        app.config.from_object(DevelopmentConfig)

    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Initialize extensions
    from extensions import db, jwt, migrate, cors

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    allowed_origins = app.config.get('CORS_ORIGINS', '*')
    origins = allowed_origins if allowed_origins == '*' else [o.strip() for o in allowed_origins.split(',')]
    cors.init_app(app, resources={r"/api/*": {"origins": origins}})

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({'success': False, 'error': 'Token has expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'success': False, 'error': 'Invalid token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'success': False, 'error': 'Missing authorization token'}), 401

    # Register blueprints
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.variables import variables_bp
    from routes.data_ingestion import data_bp
    from routes.liquidations import liquidations_bp
    from routes.approvals import approvals_bp
    from routes.reports import reports_bp
    from routes.metrics import metrics_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(variables_bp, url_prefix='/api/variables')
    app.register_blueprint(data_bp, url_prefix='/api/data')
    app.register_blueprint(liquidations_bp, url_prefix='/api/liquidations')
    app.register_blueprint(approvals_bp, url_prefix='/api/approvals')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(metrics_bp, url_prefix='/api/metrics')

    # Serve static docs (proposal, flows, etc.)
    @app.route('/static/<path:filename>', methods=['GET'])
    def serve_docs(filename):
        docs_folder = os.path.join(os.path.dirname(__file__), 'static')
        return send_from_directory(docs_folder, filename, as_attachment=True)

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'success': True,
            'data': {
                'status': 'ok',
                'timestamp': datetime.utcnow().isoformat()
            }
        }), 200

    # Serve React app for all non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path and path.startswith('api/'):
            return jsonify({'success': False, 'error': 'Not found'}), 404

        if path and os.path.exists(os.path.join(app.static_folder or '.', path)):
            return send_from_directory(app.static_folder or '.', path)

        # Serve index.html for all other routes
        return send_from_directory(app.static_folder or '.', 'index.html')

    # Initialize database and seed if needed
    with app.app_context():
        # Create 'primax' schema if using PostgreSQL (to coexist with other apps)
        from sqlalchemy import text
        try:
            with db.engine.connect() as conn:
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS primax"))
                conn.commit()
        except Exception as e:
            app.logger.warning(f"Schema creation note: {e}")

        # Create tables (safe: only adds new tables/columns, never drops)
        try:
            db.create_all()
        except Exception as e:
            app.logger.error(f"Failed to create tables: {e}")
            raise

        # Check if we need to seed
        from models import User
        if User.query.first() is None:
            from seed import seed
            seed()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
