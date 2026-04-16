# Quick Start Guide

## 1. Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit: `http://localhost:5173`

## 2. Login

Demo credentials:
- Email: `admin@primax.com`
- Password: `admin123`

## 3. Key Features Overview

### Dashboard
- View key metrics (pending liquidations, approvals, compliance)
- See compliance by business unit
- Check 6-month trends
- Review recent activity

### Variables Governance (Admin only)
- Manage LLAVE hierarchy
- Set weights (must sum to 100%)
- Define source types (automatic, semi-automatic, manual)
- Auto-normalize weights

### Data Entry
- Upload CSV/Excel files with KPI data
- Manual entry for individual KPIs
- Integration with external data sources (BigQuery coming soon)

### Liquidations
- Calculate new liquidations for periods and users
- View detailed breakdown by LLAVE
- Submit for approval
- Export to PDF

### Approvals (Approver role)
- Review pending liquidations
- Approve or reject with comments
- View approval history

### Reports
- Monthly summaries
- Business unit performance
- Individual user performance
- Trend analysis
- Export to Excel/PDF

### Admin Panel
- User management
- Period management
- Data source configuration
- Audit log
- System settings

## 4. File Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components (one per route)
├── contexts/       # React Context (Auth)
├── hooks/          # Custom hooks (useApi)
├── utils/          # Format functions & mock data
├── api.js          # API client
└── App.jsx         # Router configuration
```

## 5. Authentication

- JWT token stored in localStorage as `primax_token`
- Automatically sent with all API requests
- User info also stored as `primax_user`
- Cleared on logout or 401 error

## 6. Role-Based Access

- **admin**: All pages + admin panel
- **approver**: Dashboard, liquidations, approvals, reports
- **analyst**: Dashboard, data entry, reports, liquidations

## 7. Styling

- Tailwind CSS for all styling
- Primary color: blue-600
- Responsive design (mobile-friendly)
- Spanish language throughout

## 8. API Integration

All API calls go through `/api/` proxy (configured in vite.config.js).

Example endpoints:
```javascript
POST   /api/auth/login
GET    /api/auth/me
GET    /api/admin/users
GET    /api/variables/llaves
POST   /api/data/upload
GET    /api/liquidations
POST   /api/liquidations/calculate
GET    /api/approvals/pending
POST   /api/approvals/{id}/approve
```

## 9. Build for Production

```bash
npm run build      # Creates dist/ folder
npm run preview    # Preview production build locally
```

## 10. Troubleshooting

**API not connecting?**
- Ensure backend is running on `http://localhost:5000`
- Check browser console for errors

**Mock data not showing?**
- Add `?mock=true` to test with mock data (if implemented)
- Check `src/utils/mockData.js` for sample data

**Token expired?**
- App automatically redirects to login
- Clear browser cache if issues persist

**Form not submitting?**
- Check required fields are filled
- Look for toast notifications for error messages
- Check browser console for API errors

## 11. Component Reference

### Modal
```jsx
<Modal
  isOpen={true}
  onClose={() => {}}
  title="Title"
  size="md"
  footer={<div>Footer content</div>}
>
  Modal content
</Modal>
```

### Table
```jsx
<Table
  columns={columns}
  data={data}
  loading={false}
  actions={(row) => [<button>Action</button>]}
/>
```

### StatusBadge
```jsx
<StatusBadge status="approved" />
<StatusBadge status="pending" />
```

### MetricCard
```jsx
<MetricCard
  icon={IconComponent}
  label="Label"
  value="123"
  change={+5}
  color="blue"
/>
```

## 12. Next Steps

- Run `npm install` to install all dependencies
- Start with `npm run dev`
- Explore each page to understand functionality
- Check API responses in Network tab (DevTools)
- Modify mock data in `src/utils/mockData.js` as needed
- Customize colors in `tailwind.config.js`
