# Liquidador de Primas Comerciales - Backend Setup

## Prerequisites

- Python 3.11+
- PostgreSQL 12+ (optional, SQLite used by default for development)
- pip (Python package manager)

## Initial Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

Default `.env` settings use SQLite for local development.

### 4. Initialize Database

```bash
# Create database and tables
python app.py

# This will automatically seed the database with test data on first run
```

Alternatively, to manually initialize:

```bash
# Using Flask-Migrate
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Seed with test data
python -c "from app import create_app; from seed import seed; app = create_app(); app.app_context().push(); seed()"
```

## Running the Application

### Development Server

```bash
python app.py
```

The server will start at `http://localhost:5000`

### Production with Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

## Database Configuration

### SQLite (Default - Development)

No configuration needed. Uses `primax_dev.db` in the project root.

### PostgreSQL (Recommended for Production)

Update `.env`:

```
DATABASE_URL=postgresql://username:password@localhost:5432/liquidador_primax
FLASK_ENV=production
```

Create the PostgreSQL database:

```bash
createdb liquidador_primax
```

Then initialize:

```bash
python app.py
```

## Test Credentials

After initial seed, these users are created:

| Email | Password | Role | Business Unit |
|-------|----------|------|---------------|
| superadmin@primax.com | SuperAdmin2024! | super_admin | - |
| admin@primax.com | Admin2024! | admin | - |
| aprobador@primax.com | Approver2024! | approver | - |
| analista.vl@primax.com | Analyst2024! | analyst | VL |
| analista.sat@primax.com | Analyst2024! | analyst | SAT |
| analista.com@primax.com | Analyst2024! | analyst | COM |
| viewer@primax.com | Viewer2024! | viewer | - |

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current user
- `PUT /auth/change-password` - Change password
- `POST /auth/logout` - Logout

### Administration
- `GET /admin/users` - List users
- `POST /admin/users` - Create user
- `GET /admin/users/{id}` - Get user
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Deactivate user
- `GET /admin/business-units` - List business units
- `POST /admin/business-units` - Create business unit
- `GET /admin/periods` - List periods
- `POST /admin/periods` - Create period
- `GET /admin/audit-log` - Get audit log

### Variables (Governance)
- `GET /variables/llaves` - List LLAVEs
- `POST /variables/llaves` - Create LLAVE
- `PUT /variables/llaves/{id}` - Update LLAVE
- `GET /variables/kpis` - List KPIs
- `POST /variables/kpis` - Create KPI
- `PUT /variables/kpis/{id}` - Update KPI
- `GET /variables/structure/{business_unit_code}` - Get full structure
- `POST /variables/validate-weights` - Validate weights sum to 1.0

### Data Ingestion
- `POST /data/upload-csv` - Upload CSV/Excel with KPI data
- `GET /data/results` - List KPI results
- `PUT /data/results/{id}` - Update result
- `POST /data/results/bulk` - Bulk create/update results
- `GET /data/targets` - List KPI targets
- `POST /data/targets/bulk` - Bulk create/update targets
- `GET /data/template/{business_unit_code}` - Download template

### Liquidations
- `GET /liquidations` - List liquidations
- `POST /liquidations/calculate` - Calculate liquidation
- `POST /liquidations/create-and-save` - Create and save liquidation
- `GET /liquidations/{id}` - Get liquidation detail
- `PUT /liquidations/{id}/submit` - Submit for approval
- `DELETE /liquidations/{id}` - Delete draft

### Approvals
- `GET /approvals/pending` - Get pending approvals
- `POST /approvals/{liquidation_id}/approve` - Approve
- `POST /approvals/{liquidation_id}/reject` - Reject
- `GET /approvals/history` - Get approval history

### Reports
- `GET /reports/monthly-summary` - Monthly summary
- `GET /reports/business-unit` - Business unit report
- `GET /reports/user-performance` - User performance
- `GET /reports/trend` - Trend analysis
- `POST /reports/export` - Export to Excel

### Metrics
- `GET /metrics/dashboard` - Dashboard metrics
- `GET /metrics/kpi-compliance` - KPI compliance
- `GET /metrics/period-progress` - Period progress
- `GET /metrics/source-coverage` - Data source coverage

### Health
- `GET /api/health` - Health check

## Authentication

All endpoints except `/auth/login` require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## File Structure

```
backend/
├── app.py                 # Flask app factory
├── config.py              # Configuration
├── extensions.py          # Flask extensions
├── decorators.py          # Custom decorators
├── seed.py               # Database seed script
├── wsgi.py               # WSGI entry point
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variables template
├── models/
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
├── routes/
│   ├── __init__.py
│   ├── auth.py
│   ├── admin.py
│   ├── variables.py
│   ├── data_ingestion.py
│   ├── liquidations.py
│   ├── approvals.py
│   ├── reports.py
│   └── metrics.py
├── services/
│   ├── __init__.py
│   └── liquidation_service.py
└── uploads/              # User uploaded files
```

## Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Roles: super_admin, admin, approver, analyst, viewer

### Premium Calculation Engine
- Hierarchical LLAVE system with weighted KPIs
- Automatic weight normalization
- Compliance thresholds (80%+ = full credit)
- Detailed breakdown tracking

### Data Management
- CSV/Excel upload support
- Manual and automated data sources
- Data validation and error tracking
- Bulk operations support

### Workflow Management
- Multi-step approval process
- Liquidation status tracking
- Audit logging for compliance

### Reporting
- Monthly summaries
- Business unit analysis
- User performance tracking
- Trend analysis
- Excel export capability

## Troubleshooting

### Database Issues
```bash
# Reset database (development only)
rm primax_dev.db
python app.py
```

### Port Already in Use
```bash
# Change port in app.py or use:
python app.py --port 5001
```

### Import Errors
```bash
# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

### PostgreSQL Connection Issues
- Verify PostgreSQL is running
- Check connection string in `.env`
- Ensure database exists: `createdb liquidador_primax`

## Performance Optimization

For production deployment:

1. Use PostgreSQL instead of SQLite
2. Set `FLASK_ENV=production`
3. Use connection pooling
4. Enable caching headers
5. Configure CORS properly
6. Use Gunicorn with multiple workers
7. Set up reverse proxy (Nginx)
8. Enable gzip compression

## Development Notes

- Database models use SQLAlchemy ORM
- Migrations managed by Flask-Migrate
- All routes return JSON with consistent format: `{success: bool, data: ..., error: str}`
- Error handling with proper HTTP status codes
- Logging for audit trail
- CORS enabled for frontend development

## API Response Format

Success response:
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message"
}
```
