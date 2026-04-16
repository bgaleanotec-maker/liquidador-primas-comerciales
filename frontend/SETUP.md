# Liquidador Primas Comerciales - Frontend Setup

## Project Overview

A professional React-based commercial premium liquidation management system with real-time calculations, approval workflows, and comprehensive reporting.

## Tech Stack

- React 18.3.1
- Vite 5.3.1
- Tailwind CSS 3.4.4
- React Router v6
- Axios for API calls
- Recharts for data visualization
- React Hook Form for form management
- React Hot Toast for notifications
- Lucide React for icons

## Prerequisites

- Node.js >= 16.x
- npm >= 8.x or yarn >= 3.x
- Backend API running at http://localhost:5000

## Installation

1. Navigate to the frontend directory:
```bash
cd /sessions/wizardly-fervent-franklin/mnt/liquidador_primax/liquidador-primas/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update .env if needed:
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Liquidador Primas Comerciales
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

The dev server includes:
- Hot module replacement (HMR)
- API proxy to `http://localhost:5000` for `/api` routes
- Source maps for debugging

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx       # Main sidebar and header layout
│   │   ├── ProtectedRoute.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── MetricCard.jsx
│   │   ├── StatusBadge.jsx
│   ├── pages/               # Page components (one per route)
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Variables.jsx
│   │   ├── DataEntry.jsx
│   │   ├── Liquidations.jsx
│   │   ├── Approvals.jsx
│   │   ├── Reports.jsx
│   │   ├── Admin.jsx
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.jsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useApi.js
│   ├── utils/               # Utility functions
│   │   ├── format.js        # Currency, date formatting
│   │   ├── mockData.js      # Mock data for development
│   ├── api.js               # Axios instance & API endpoints
│   ├── App.jsx              # Main app router
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind imports
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

## Features

### Authentication
- Login with email/password
- JWT token stored in localStorage
- Protected routes with role-based access
- Automatic logout on 401 responses

### Dashboard
- Summary metrics (pending liquidations, approvals, compliance)
- Charts for compliance by business unit
- 6-month trend analysis
- Liquidation status distribution
- KPI coverage percentage by BU
- Recent activity feed

### Variable Governance (Admin)
- Hierarchical tree view of LLAVES (variables)
- Weight management with auto-normalization
- Source type badges (automatic, semi-automatic, manual)
- CRUD operations for LLAVEs and KPIs
- Multi-business unit support

### Data Entry
- CSV/Excel file upload with drag-and-drop
- Manual KPI data entry with inline editing
- Automatic compliance percentage calculation
- Template download
- Integration with external data sources (BigQuery - Phase 2)

### Liquidations
- Calculate new liquidations
- View detailed liquidation breakdowns
- Submit for approval
- Export to PDF
- Status tracking (draft, submitted, approved, rejected, paid)

### Approvals
- Pending liquidations review
- Approve/reject with comments
- Approval history
- Decision audit trail

### Reports
- Multiple report types:
  - Monthly summary with metrics
  - Business unit distribution
  - Individual user performance
  - 6-month trend analysis
- Export to Excel/PDF
- Configurable report scheduling

### Administration
- User management (create, edit, delete)
- Period management (create, open/close)
- Data source configuration
- Audit log with full action history
- Application settings

## Authentication

### Demo Credentials

Email: `admin@primax.com`
Password: `admin123`

User roles:
- **admin**: Full access to all features
- **approver**: Can review and approve liquidations
- **analyst**: Can enter data and view reports

### JWT Token

The token is stored in `localStorage` as `primax_token`. It's automatically:
- Sent with every API request in the Authorization header
- Cleared on 401 responses
- Decoded to extract user information

## API Integration

The frontend communicates with the Flask backend via `/api` routes. Key API functions:

```javascript
// Authentication
authAPI.login(email, password)
authAPI.logout()
authAPI.me()

// Admin
adminAPI.getUsers()
adminAPI.createUser(data)
adminAPI.getBusinessUnits()
adminAPI.getPeriods()

// Variables
variablesAPI.getLlaves(bu_code)
variablesAPI.createLlave(data)
variablesAPI.validateWeights(bu_code)

// Data
dataAPI.uploadCSV(formData)
dataAPI.getResults(filters)
dataAPI.downloadTemplate(bu_code)

// Liquidations
liquidationsAPI.getLiquidations(filters)
liquidationsAPI.calculate(data)

// Approvals
approvalsAPI.getPending()
approvalsAPI.approve(liquidationId, comments)

// Reports
reportsAPI.getMonthlySummary(period_id)
reportsAPI.exportReport(data)

// Metrics
metricsAPI.getDashboard()
metricsAPI.getKPICompliance()
```

## Mock Data

For development when the API is unavailable, mock data is automatically used. This includes:
- Dashboard metrics
- LLAVE structures for each business unit
- User list
- Periods
- Liquidation samples
- Audit logs

To disable mock data fallback, modify the `try-catch` blocks in individual pages.

## Styling

The application uses Tailwind CSS with custom configuration:

```
Primary color: blue-600
Success: green-500
Warning: amber-500
Danger: red-500
```

All UI components use semantic color classes and responsive design patterns.

## Formatting

The application uses Colombian formatting standards:
- Currency: Colombian Pesos (COP) with $ prefix
- Date: DD de MMMM de YYYY (Spanish)
- Numbers: . as decimal separator, , as thousands

## Development Tips

1. **Redux DevTools**: Not used. State management is via React Context and component state.

2. **API Testing**: Use browser DevTools Network tab to inspect API requests.

3. **Component Reusability**: 
   - Modal.jsx for all dialogs
   - Table.jsx for data tables
   - StatusBadge.jsx for status displays

4. **Error Handling**: Toast notifications appear for all API errors. Check console for full error details.

5. **Performance**: 
   - Code splitting with React Router
   - Charts lazy-loaded via Recharts
   - Memoization used for expensive calculations

## Common Issues

**Issue**: API requests fail with CORS errors
**Solution**: Ensure backend is running on http://localhost:5000 and vite.config.js proxy is configured

**Issue**: Charts not displaying
**Solution**: ResponsiveContainer requires a defined height. Check parent element sizing.

**Issue**: Modal won't open/close
**Solution**: Ensure Modal's isOpen and onClose props are properly managed in parent component state

**Issue**: Forms not submitting
**Solution**: Ensure all required fields are populated. Check toast notifications for error messages.

## Building for Production

```bash
npm run build
```

Output is in the `dist/` directory. Deploy these files to your web server.

For Docker deployment:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Support

For issues or questions about the frontend implementation, check:
1. Browser console for error messages
2. Network tab for API requests
3. Mock data in src/utils/mockData.js for expected data structure
4. Component prop definitions for usage examples

## License

Proprietary - Liquidador de Primas Comerciales
