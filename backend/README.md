# Liquidador de Primas Comerciales - Backend

A complete, production-ready Flask backend for managing commercial premium calculations with hierarchical KPI systems, multi-step approvals, and comprehensive reporting.

## What's Included

✅ **Complete Flask API** with 40+ endpoints
✅ **11 Database Models** with full relationships
✅ **8 API Route Modules** organized by function
✅ **Core Calculation Engine** for premium calculations
✅ **Authentication & Authorization** with JWT and role-based access
✅ **Data Ingestion Pipeline** with CSV/Excel support
✅ **Multi-step Approval Workflow**
✅ **Reporting & Analytics** with metrics dashboards
✅ **6 Business Units** with customizable structures
✅ **7 Test Users** with different roles
✅ **Comprehensive Documentation** with setup guides

## Quick Start (3 steps)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the application
python app.py

# 3. Login with test credentials
# Email: superadmin@primax.com
# Password: SuperAdmin2024!
```

**That's it!** The API is ready at `http://localhost:5000/api`

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 30-second setup guide
- **[SETUP.md](SETUP.md)** - Comprehensive setup and configuration
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete feature overview
- **[INDEX.md](INDEX.md)** - File-by-file reference

## Key Features

### Premium Calculation
- Hierarchical LLAVE (KEY) system
- Weighted KPI scoring
- Automatic weight normalization
- Compliance threshold logic (80%+ = full credit)
- Support for 6 business units

### Authentication
- JWT-based stateless auth
- 5 role levels (super_admin, admin, approver, analyst, viewer)
- Password hashing with Werkzeug
- 8-hour token expiration

### Data Management
- CSV/Excel upload support
- Bulk operations (create/update 1000s of records)
- KPI targets and actual results
- Source tracking (manual, API, CSV, email)

### Workflows
- Multi-step approval process
- Step ordering and role requirements
- Comment tracking and feedback
- Complete audit trail

### Reporting
- Monthly summaries
- Business unit analysis
- User performance tracking
- Trend analysis
- Excel export

## API Endpoints (40+)

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info
- `PUT /api/auth/change-password` - Change password

### Administration
- User, business unit, period, and data source management
- Audit log access

### Variables/Governance
- LLAVE CRUD and hierarchy management
- KPI management
- Structure retrieval
- Weight validation

### Data Ingestion
- CSV/Excel upload
- Result and target management
- Template generation

### Liquidations
- Calculate premiums
- Create and save liquidations
- Submit for approval
- Track status

### Approvals
- Get pending approvals
- Approve/reject with comments
- Approval history

### Reports
- Monthly summaries
- Business unit details
- User performance
- Trend analysis
- Excel export

### Metrics
- Dashboard metrics
- KPI compliance
- Period progress
- Data source coverage

## Test Data Included

### Users (7)
```
superadmin@primax.com / SuperAdmin2024! (super_admin)
admin@primax.com / Admin2024! (admin)
aprobador@primax.com / Approver2024! (approver)
analista.vl@primax.com / Analyst2024! (analyst - VL)
analista.sat@primax.com / Analyst2024! (analyst - SAT)
analista.com@primax.com / Analyst2024! (analyst - COM)
viewer@primax.com / Viewer2024! (viewer)
```

### Business Units (6)
- VL (Vanti Listo)
- VM (Vanti Max)
- NE (Nueva Edificación)
- SIC (Negociaciones)
- SAT (Saturación/Contratistas)
- COM (Comercial)

### Pre-seeded Data
- Current month period in 'open' status
- Complete LLAVE/KPI structures for SIC, SAT, COM, VL
- Sample KPI targets and results
- Draft liquidations
- Pending approval workflows

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Flask | 3.0.3 |
| ORM | SQLAlchemy | 3.1.1 |
| Auth | Flask-JWT-Extended | 4.6.0 |
| Database | SQLite/PostgreSQL | - |
| Data | Pandas | 2.2.2 |
| Server | Gunicorn | 22.0.0 |
| Python | 3.11+ | - |

## File Structure

```
backend/
├── app.py                    # Flask app factory
├── config.py                 # Configuration
├── extensions.py             # Flask extensions
├── decorators.py             # Custom decorators
├── seed.py                   # Database seeding
├── wsgi.py                   # WSGI entry
│
├── models/                   # 11 database models
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
├── routes/                   # 8 route modules
│   ├── auth.py
│   ├── admin.py
│   ├── variables.py
│   ├── data_ingestion.py
│   ├── liquidations.py
│   ├── approvals.py
│   ├── reports.py
│   └── metrics.py
│
├── services/
│   └── liquidation_service.py  # Core calculation engine
│
├── requirements.txt          # Dependencies
├── .env.example              # Environment template
├── .gitignore                # Git ignore
│
└── docs/
    ├── README.md             # This file
    ├── SETUP.md              # Setup guide
    ├── QUICKSTART.md         # Quick start
    ├── PROJECT_SUMMARY.md    # Feature overview
    └── INDEX.md              # File reference
```

## Configuration

### Development (Default)
```
DATABASE_URL=sqlite:///primax_dev.db
FLASK_ENV=development
```

### Production
```
DATABASE_URL=postgresql://user:pass@host:5432/db
FLASK_ENV=production
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
```

See `.env.example` for all options.

## Deployment

### Local Development
```bash
python app.py
```

### Production with Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

### With PostgreSQL
```bash
createdb liquidador_primax
# Update DATABASE_URL in .env
python app.py
```

## API Response Format

Success:
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Database Models

- **User** - Accounts with roles and business unit assignment
- **BusinessUnit** - 6 business units (VL, VM, NE, SIC, SAT, COM)
- **Llave** - Hierarchical KEY system with weights
- **KPI** - Key Performance Indicators with sources
- **Period** - Monthly periods with status tracking
- **KPITarget** - Target values per KPI/period/user
- **KPIResult** - Actual KPI results with compliance calculation
- **Liquidation** - Premium calculations with breakdown
- **ApprovalStep** - Multi-step approval workflow
- **DataSource** - Data source configurations
- **AuditLog** - Complete audit trail

## Calculation Algorithm

```
For each LLAVE in business unit:
  For each KPI in LLAVE:
    cumplimiento = (actual / target) * 100
    if cumplimiento >= 80%:
      kpi_score = 1.0
    elif cumplimiento >= 50%:
      kpi_score = (cumplimiento - 50) / 30 * 0.5
    else:
      kpi_score = 0.0
    
    weighted_kpi_score = kpi_score * (kpi_weight / sum_weights)
  
  llave_score = sum(weighted_kpi_scores)
  weighted_llave_score = llave_score * (llave_weight / sum_weights)

total_score = sum(weighted_llave_scores)
premium = base_salary * total_score
```

## Environment Variables

```
FLASK_ENV              # development, testing, production
SECRET_KEY             # Flask secret key
JWT_SECRET_KEY         # JWT signing secret
DATABASE_URL           # Database connection string
CORS_ORIGINS           # CORS allowed origins
MAX_CONTENT_LENGTH     # Max upload size (16MB default)
```

## Common Tasks

### Add a User
```bash
POST /api/admin/users
{
  "email": "user@company.com",
  "name": "User Name",
  "password": "SecurePass123!",
  "role": "analyst",
  "business_unit_id": 1
}
```

### Upload KPI Data
```bash
POST /api/data/upload-csv
(multipart form with file, period_id, business_unit_id)
```

### Calculate Liquidation
```bash
POST /api/liquidations/calculate
{
  "period_id": 1,
  "user_id": 4,
  "base_salary": 50000
}
```

### Approve Liquidation
```bash
POST /api/approvals/1/approve
{
  "comments": "Approved"
}
```

## Troubleshooting

### Port Already in Use
```bash
# Use a different port (change in app.py or use environment variable)
PORT=5001 python app.py
```

### Database Error
```bash
# Reset database (development only)
rm primax_dev.db
python app.py
```

### Import Error
```bash
# Reinstall requirements
pip install --force-reinstall -r requirements.txt
```

### PostgreSQL Connection
- Verify PostgreSQL is running
- Check connection string in `.env`
- Ensure database exists: `createdb liquidador_primax`

## Performance

For production:
1. Use PostgreSQL instead of SQLite
2. Use Gunicorn with multiple workers
3. Place behind Nginx reverse proxy
4. Enable gzip compression
5. Configure proper CORS
6. Set secure JWT secrets
7. Use connection pooling

## Security Features

- JWT authentication
- Password hashing (bcrypt via Werkzeug)
- Role-based access control
- SQL injection prevention (SQLAlchemy)
- Input validation
- CORS configuration
- Audit logging

## Support & Documentation

For detailed information, see:
- **SETUP.md** - Installation and configuration
- **QUICKSTART.md** - Quick reference guide
- **PROJECT_SUMMARY.md** - Complete feature overview
- **INDEX.md** - File-by-file reference
- Route files - API endpoint documentation
- Model files - Database schema documentation

## Status

✅ **Production Ready**
- All features implemented
- Error handling comprehensive
- Security best practices applied
- Documentation complete
- Test data included
- Ready for PostgreSQL deployment

## Next Steps

1. Read [QUICKSTART.md](QUICKSTART.md) for setup
2. Login with test credentials
3. Explore API endpoints
4. Connect frontend
5. Configure PostgreSQL for production
6. Set up data ingestion pipelines

---

**Created:** 2026
**Version:** 1.0.0
**Status:** Production Ready
