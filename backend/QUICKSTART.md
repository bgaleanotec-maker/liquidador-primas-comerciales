# Quick Start Guide

## 30-Second Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the app
python app.py
```

The API will be available at `http://localhost:5000`

## First Login

Use any of these credentials:

```
Email: superadmin@primax.com
Password: SuperAdmin2024!
```

## API Test

```bash
# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@primax.com","password":"SuperAdmin2024!"}'

# Response will include a token. Use it:
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/auth/me
```

## Key Endpoints to Try

### 1. Create a Period
```bash
POST /api/admin/periods
{
  "year": 2026,
  "month": 4,
  "status": "open"
}
```

### 2. List Business Units
```bash
GET /api/admin/business-units
```

### 3. Get Structure
```bash
GET /api/variables/structure/SIC
```

### 4. Calculate Liquidation
```bash
POST /api/liquidations/calculate
{
  "period_id": 1,
  "user_id": 4,
  "base_salary": 50000
}
```

### 5. List Users
```bash
GET /api/admin/users
```

## Database

Default: SQLite at `primax_dev.db`

To reset:
```bash
rm primax_dev.db
python app.py
```

## What's Included

✓ 7 test users with different roles
✓ 6 business units (VL, VM, NE, SIC, SAT, COM)
✓ Complete LLAVE/KPI structure for each business unit
✓ Sample period and data
✓ Sample liquidations and approvals

## All Test Users

| Email | Password | Role |
|-------|----------|------|
| superadmin@primax.com | SuperAdmin2024! | super_admin |
| admin@primax.com | Admin2024! | admin |
| aprobador@primax.com | Approver2024! | approver |
| analista.vl@primax.com | Analyst2024! | analyst (VL) |
| analista.sat@primax.com | Analyst2024! | analyst (SAT) |
| analista.com@primax.com | Analyst2024! | analyst (COM) |
| viewer@primax.com | Viewer2024! | viewer |

## Production Setup

See `SETUP.md` for PostgreSQL, Gunicorn, and Docker configuration.

## Documentation

- `SETUP.md` - Detailed setup and configuration
- `app.py` - Entry point
- `services/liquidation_service.py` - Premium calculation logic
- `routes/` - All API endpoints
- `models/` - Database schema

## Architecture

```
Client (React) <-> API (Flask) <-> Database (SQLite/PostgreSQL)
                       |
                    Services
                    (Liquidation)
```

## Common Tasks

### Add a new user
```bash
POST /api/admin/users
{
  "email": "newuser@company.com",
  "name": "New User",
  "password": "SecurePass123!",
  "role": "analyst",
  "business_unit_id": 1
}
```

### Upload KPI data
```bash
POST /api/data/upload-csv
(multipart form with file, period_id, business_unit_id)
```

### Export report
```bash
POST /api/reports/export
{
  "period_id": 1,
  "report_type": "summary"
}
```

### Approve liquidation
```bash
POST /api/approvals/{liquidation_id}/approve
{
  "comments": "Looks good"
}
```

## Troubleshooting

**ModuleNotFoundError: No module named 'flask'**
```bash
pip install -r requirements.txt
```

**Port 5000 already in use**
Edit `app.py` last line and change port, or:
```bash
PORT=5001 python app.py
```

**Database locked (SQLite)**
```bash
rm primax_dev.db
python app.py
```

## Next Steps

1. Connect a React frontend to the API
2. Configure PostgreSQL for production
3. Set up authentication in frontend
4. Create dashboards for metrics
5. Implement automated data ingestion
6. Set up approval workflows

## Support

For detailed information, see:
- API docs: Check route files in `routes/`
- Database schema: Check model files in `models/`
- Business logic: See `services/liquidation_service.py`
