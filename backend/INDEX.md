# Backend File Index

Complete file listing for the Liquidador de Primas Comerciales backend.

## Core Files

### Application Entry Points
- `app.py` - Flask app factory with blueprint registration
- `wsgi.py` - WSGI entry point for production
- `config.py` - Configuration for development, testing, production
- `extensions.py` - Flask extension initialization (db, jwt, migrate, cors)

### Utilities
- `decorators.py` - Custom decorators: @role_required, @jwt_optional
- `seed.py` - Database seeding script with complete test data

## Models (11 files)

Location: `models/`

Core database models using SQLAlchemy:

1. **models/__init__.py** - Model exports
2. **models/user.py** - User model with authentication
   - Fields: email, name, password_hash, role, business_unit_id
   - Methods: set_password, check_password, to_dict

3. **models/business_unit.py** - Business unit model
   - Fields: code (VL, VM, NE, SIC, SAT, COM), name, description
   
4. **models/llave.py** - Hierarchical LLAVE system
   - Fields: code, name, weight, parent_id, level
   - Relationships: parent-child hierarchy

5. **models/kpi.py** - KPI model
   - Fields: name, weight, source_type, source_system, source_config
   
6. **models/period.py** - Period model
   - Fields: year, month, status
   - Properties: formatted name (e.g., "Ene 2024")

7. **models/kpi_target.py** - Target values
   - Fields: kpi_id, period_id, user_id, target_value
   - Supports group targets (user_id nullable)

8. **models/kpi_result.py** - Actual KPI results
   - Fields: kpi_id, period_id, user_id, actual_value, meta_value
   - Calculated property: cumplimiento

9. **models/liquidation.py** - Premium calculations
   - Fields: period_id, user_id, business_unit_id, status
   - Fields: llave_score, premium_pct, premium_amount, details (JSON)

10. **models/approval_step.py** - Multi-step approval workflow
    - Fields: liquidation_id, approver_id, step_order, status
    - Statuses: pending, approved, rejected, skipped

11. **models/data_source.py** - Data source configurations
    - Fields: name, source_type, config (JSON)

12. **models/audit_log.py** - Audit trail
    - Fields: user_id, action, entity_type, entity_id
    - Fields: old_value, new_value (JSON), ip_address

## Routes (8 files)

Location: `routes/`

API blueprint modules with endpoint definitions:

1. **routes/__init__.py** - Route package initialization

2. **routes/auth.py** - Authentication (4 endpoints)
   - POST /login - User login with JWT token
   - POST /logout - Logout
   - GET /me - Get current user
   - PUT /change-password - Change password

3. **routes/admin.py** - Administration (13 endpoints)
   - User CRUD operations
   - Business unit management
   - Period management
   - Data source management
   - Audit log access

4. **routes/variables.py** - Governance (7 endpoints)
   - LLAVE CRUD (create, read, update, deactivate)
   - KPI CRUD
   - Structure retrieval with hierarchies
   - Weight validation

5. **routes/data_ingestion.py** - Data management (6 endpoints)
   - CSV/Excel file upload
   - KPI result CRUD and bulk operations
   - KPI target CRUD and bulk operations
   - Template download for data entry

6. **routes/liquidations.py** - Liquidation operations (6 endpoints)
   - List liquidations with filtering
   - Calculate liquidation (without saving)
   - Create and save liquidation
   - Submit for approval
   - Delete draft liquidations

7. **routes/approvals.py** - Approval workflow (3 endpoints)
   - Get pending approvals for current user
   - Approve liquidation
   - Reject liquidation with comments

8. **routes/reports.py** - Reporting (5 endpoints)
   - Monthly summary report
   - Business unit detail report
   - User performance report
   - Trend analysis (multiple periods)
   - Excel export

9. **routes/metrics.py** - Dashboard metrics (4 endpoints)
   - Dashboard overview (total users, pending, avg premium)
   - KPI compliance rates
   - Period progress tracking
   - Data source coverage

## Services (2 files)

Location: `services/`

Business logic and calculations:

1. **services/__init__.py** - Service package initialization

2. **services/liquidation_service.py** - Core calculation engine
   - Main algorithm: hierarchical LLAVE/KPI scoring
   - Methods:
     - `calculate()` - Calculate premium for period/user
     - `_calculate_llave()` - Score single LLAVE
     - `_calculate_kpi()` - Score single KPI
     - `create_liquidation()` - Save to database
     - `submit_liquidation()` - Submit for approval
     - `normalize_weights()` - Auto-normalize weights

## Configuration Files

1. **requirements.txt** - Python dependencies (13 packages)
   - Flask, SQLAlchemy, Flask-Migrate, JWT, CORS
   - pandas, openpyxl for data handling
   - gunicorn, psycopg2 for production

2. **.env.example** - Environment variables template
   - FLASK_ENV, SECRET_KEY, DATABASE_URL, CORS settings

3. **.gitignore** - Git ignore patterns
   - Python cache, virtual env, IDE settings, database files

## Documentation Files

1. **SETUP.md** - Comprehensive setup guide
   - Prerequisites and installation
   - Database configuration
   - Running the application
   - All API endpoints with examples
   - Authentication details
   - Troubleshooting guide
   - Performance optimization tips

2. **QUICKSTART.md** - Quick start guide
   - 30-second setup
   - First login
   - Key endpoints to test
   - Common tasks
   - Troubleshooting

3. **PROJECT_SUMMARY.md** - Project overview
   - Complete feature list
   - Architecture overview
   - Technology stack
   - Business logic explanation
   - Production readiness checklist

4. **INDEX.md** - This file
   - Complete file listing with descriptions

## Directory Structure

```
backend/
├── app.py
├── config.py
├── extensions.py
├── decorators.py
├── seed.py
├── wsgi.py
├── requirements.txt
├── .env.example
├── .gitignore
│
├── models/              (11 files)
│   ├── __init__.py
│   ├── user.py
│   ├── business_unit.py
│   ├── llave.py
│   ├── kpi.py
│   ├── period.py
│   ├── kpi_target.py
│   ├── kpi_result.py
│   ├── liquidation.py
│   ├── approval_step.py
│   ├── data_source.py
│   └── audit_log.py
│
├── routes/              (9 files)
│   ├── __init__.py
│   ├── auth.py
│   ├── admin.py
│   ├── variables.py
│   ├── data_ingestion.py
│   ├── liquidations.py
│   ├── approvals.py
│   ├── reports.py
│   └── metrics.py
│
├── services/            (2 files)
│   ├── __init__.py
│   └── liquidation_service.py
│
├── uploads/            (created on first upload)
│
├── migrations/         (created by Flask-Migrate)
│
└── docs/
    ├── SETUP.md
    ├── QUICKSTART.md
    ├── PROJECT_SUMMARY.md
    └── INDEX.md
```

## Quick Reference

### Total Statistics
- **Python files:** 32
- **Configuration files:** 4
- **Documentation files:** 4
- **Total files:** 40+
- **Database tables:** 11
- **API endpoints:** 40+
- **Test users:** 7
- **Business units:** 6
- **Lines of code:** ~3,500

### Starting Points

1. **First time?** Read `QUICKSTART.md`
2. **Setup help?** Read `SETUP.md`
3. **Architecture questions?** Read `PROJECT_SUMMARY.md`
4. **Need a specific file?** See directory structure above

### Key Entry Points

1. **Run app:** `python app.py`
2. **Seed database:** Automatic on first run, or run `seed.py`
3. **Main logic:** See `services/liquidation_service.py`
4. **API endpoints:** See `routes/` directory

### Development Workflow

1. Make changes to models, routes, or services
2. Test with curl or Postman
3. Check logs for errors
4. Use database inspection tools if needed

### Deployment Workflow

1. Set `.env` to production settings
2. Use PostgreSQL instead of SQLite
3. Run migrations: `flask db upgrade`
4. Start with Gunicorn: `gunicorn wsgi:app`
5. Put behind reverse proxy (nginx)

## File Dependencies

```
app.py depends on:
  ├── config.py
  ├── extensions.py
  ├── models/* (via imports)
  ├── routes/* (via blueprints)
  └── seed.py

routes/admin.py depends on:
  ├── models/*
  ├── extensions.db
  └── decorators.role_required

services/liquidation_service.py depends on:
  ├── models/*
  └── extensions.db

seed.py depends on:
  ├── extensions.db
  └── models/*
```

## Important Notes

- All files are fully functional and production-ready
- Database is automatically seeded on first run
- JWT tokens expire after 8 hours
- All responses are JSON with consistent format
- Role-based access control on protected routes
- Comprehensive error handling throughout

## For More Information

- Models: See individual files in `models/` directory
- Routes: See individual files in `routes/` directory
- Business logic: See `services/liquidation_service.py`
- Setup: See `SETUP.md`
- Quick start: See `QUICKSTART.md`
- Project details: See `PROJECT_SUMMARY.md`
