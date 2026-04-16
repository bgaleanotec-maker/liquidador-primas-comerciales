# Liquidador de Primas Comerciales - Frontend Index

## Location
```
/sessions/wizardly-fervent-franklin/mnt/liquidador_primax/liquidador-primas/frontend/
```

## Quick Navigation

### Documentation Files
- **[START HERE] QUICK_START.md** - Quick start guide with basic setup
- **SETUP.md** - Complete setup guide with API reference
- **BUILD_SUMMARY.txt** - Detailed build and feature checklist
- **FILES_MANIFEST.txt** - Complete file inventory and specifications
- **INDEX.md** - This file

### Configuration
- **package.json** - Dependencies and npm scripts
- **vite.config.js** - Vite build configuration with API proxy
- **tailwind.config.js** - Tailwind CSS customization
- **postcss.config.js** - PostCSS configuration
- **.env.example** - Environment variables template
- **.gitignore** - Git ignore rules
- **index.html** - HTML entry point

### Source Code

#### Main Files
```
src/
├── main.jsx              - React entry point
├── App.jsx               - Main router (8 routes)
├── api.js                - Axios instance + 40+ endpoints
└── index.css             - Global styles
```

#### Authentication
```
src/contexts/
├── AuthContext.jsx       - JWT auth context
src/hooks/
├── useApi.js             - API call hooks
```

#### Components (Reusable)
```
src/components/
├── Layout.jsx            - Main sidebar & header
├── ProtectedRoute.jsx    - Route protection
├── LoadingSpinner.jsx    - Loading indicator
├── Modal.jsx             - Dialog component
├── Table.jsx             - Data table
├── MetricCard.jsx        - Metric card
└── StatusBadge.jsx       - Status badge
```

#### Pages (8 Full Pages)
```
src/pages/
├── Login.jsx             - Authentication
├── Dashboard.jsx         - Main dashboard (4 charts)
├── Variables.jsx         - LLAVE governance
├── DataEntry.jsx         - CSV + manual + sources
├── Liquidations.jsx      - Liquidation management
├── Approvals.jsx         - Approval workflow
├── Reports.jsx           - Report generation (4 types)
└── Admin.jsx             - Admin panel (5 tabs)
```

#### Utilities
```
src/utils/
├── format.js             - Formatting functions
└── mockData.js           - Mock data for development
```

## Key Features

### Authentication
- JWT-based login
- Protected routes by role
- Auto token refresh
- Session persistence

### Dashboard
- 4 metric cards
- 3 interactive charts
- Activity feed
- KPI coverage

### Variable Governance
- LLAVE hierarchy tree
- Weight validation
- Auto-normalize
- CRUD operations

### Data Entry
- CSV/Excel upload (drag-drop)
- Manual entry
- Template download
- BigQuery Phase 2 ready

### Liquidations
- Calculate liquidations
- Detailed breakdown
- PDF export
- 5 status types

### Approvals
- Pending review
- Decision workflow
- Approval history

### Reports
- Monthly summary
- BU distribution
- User performance
- Trend analysis
- Excel/PDF export

### Admin
- User management
- Period management
- Audit log
- System settings

## Technology Stack

- **React** 18.3.1
- **Vite** 5.3.1
- **React Router** v6
- **Tailwind CSS** 3.4.4
- **Axios** 1.7.2
- **Recharts** 2.12.7
- **Lucide React** 0.400.0
- **React Hot Toast** 2.4.1

## Getting Started

1. **Install**: `npm install`
2. **Develop**: `npm run dev` (http://localhost:5173)
3. **Build**: `npm run build`
4. **Preview**: `npm run preview`

## Login Credentials

```
Email: admin@primax.com
Password: admin123
```

## API Integration

- **Base URL**: `/api` (proxied to http://localhost:5000)
- **Authentication**: Bearer token in Authorization header
- **Token Storage**: localStorage as `primax_token`
- **Fallback**: Mock data when API returns 404

## Styling

- **Primary**: blue-600
- **Success**: green-500
- **Warning**: amber-500
- **Danger**: red-500
- **Framework**: Tailwind CSS 3.4.4

## File Statistics

- **Total Files**: 33
- **Configuration**: 5
- **Source Code**: 23
- **Documentation**: 5
- **Total Size**: 196 KB
- **Lines of Code**: 4000+

## User Roles

| Role | Access |
|------|--------|
| **admin** | All pages + admin panel |
| **approver** | Dashboard, liquidations, approvals, reports |
| **analyst** | Dashboard, data entry, reports, liquidations |

## Database/API Endpoints (40+)

### Auth (3)
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Admin (8)
- CRUD users
- Get audit log
- Period management
- Data sources

### Variables (7)
- CRUD LLAVEs
- CRUD KPIs
- Structure & validation

### Data (6)
- Upload CSV
- Get/update results
- Get/upload targets
- Download template

### Liquidations (4)
- List/get liquidations
- Calculate
- Submit

### Approvals (4)
- Get pending
- Approve/reject
- Get history

### Reports (5)
- Monthly summary
- BU report
- User performance
- Trend
- Export

### Metrics (4)
- Dashboard
- KPI compliance
- Period progress
- Source coverage

## Development Notes

### Mock Data
Located in `src/utils/mockData.js`:
- Dashboard metrics & charts
- LLAVE structures (6 BUs)
- Users, periods, liquidations
- Audit log entries
- Reports data

### Custom Hooks
- `useApi()` - Execute API calls
- `useApiEffect()` - Fetch data on mount
- `useAuth()` - Access auth context

### Reusable Components
All components accept standard props and follow React conventions:
- Modal: isOpen, onClose, title, size, children, footer
- Table: columns, data, loading, actions
- StatusBadge: status, label

## Production Deployment

1. Run: `npm run build`
2. Deploy `dist/` folder
3. Configure backend URL in environment
4. Test with real API
5. Monitor errors and performance

## Support

Refer to documentation files:
- **QUICK_START.md** for basic questions
- **SETUP.md** for detailed information
- **BUILD_SUMMARY.txt** for feature list
- Code comments for implementation details

---

**Status**: Production Ready  
**Build Date**: April 15, 2026  
**Version**: 1.0.0
