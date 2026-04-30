from flask import Flask, send_from_directory, jsonify
import os
import logging
from datetime import datetime

def create_app(config_name=None):
    """Create and configure Flask app"""
    # Disable Flask's built-in static handler to avoid conflicts with SPA catch-all
    _static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.environ.get('STATIC_FOLDER', '../frontend/dist'))
    app = Flask(__name__, static_folder=None)

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
    from routes.sales import sales_bp
    from routes.payments import payments_bp
    from routes.config import config_bp
    from routes.professional_portal import portal_bp
    from routes.aliados import aliados_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(variables_bp, url_prefix='/api/variables')
    app.register_blueprint(data_bp, url_prefix='/api/data')
    app.register_blueprint(liquidations_bp, url_prefix='/api/liquidations')
    app.register_blueprint(approvals_bp, url_prefix='/api/approvals')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(metrics_bp, url_prefix='/api/metrics')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(config_bp, url_prefix='/api/config')
    app.register_blueprint(portal_bp, url_prefix='/api/portal')
    app.register_blueprint(aliados_bp, url_prefix='/api/aliados')

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

        if path and os.path.exists(os.path.join(_static_dir, path)):
            return send_from_directory(_static_dir, path)

        # Serve index.html for all SPA routes (React Router handles client-side routing)
        return send_from_directory(_static_dir, 'index.html')

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
        from models import User, PointOfSale, Aliado
        if User.query.first() is None:
            from seed import seed
            seed()
        # Seed new sales data if tables are empty or professional users missing (added in v2)
        elif PointOfSale.query.first() is None or User.query.filter_by(role='professional').first() is None:
            try:
                from seed import seed_sales_data
                seed_sales_data()
                app.logger.info("Seeded new sales data")
            except Exception as e:
                app.logger.warning(f"Sales seed note: {e}")

        # Beta: cargar diccionario_aliados a tabla aliados (idempotente)
        try:
            if Aliado.query.first() is None:
                from seed_aliados import seed_aliados_from_file
                res = seed_aliados_from_file()
                if res:
                    app.logger.info(f"Seeded aliados: {res}")
        except Exception as e:
            app.logger.warning(f"Aliados seed note: {e}")

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
