export const mockDashboard = {
  pending_liquidations: 12,
  pending_approvals: 3,
  compliance_avg: 87.5,
  automated_sources: 65,
  bu_compliance: [
    { name: 'VL', cumplimiento: 92 },
    { name: 'VM', cumplimiento: 85 },
    { name: 'NE', cumplimiento: 78 },
    { name: 'SIC', cumplimiento: 88 },
    { name: 'SAT', cumplimiento: 81 },
    { name: 'COM', cumplimiento: 75 }
  ],
  trend: [
    { month: 'Ene', compliance: 82 },
    { month: 'Feb', compliance: 84 },
    { month: 'Mar', compliance: 86 },
    { month: 'Abr', compliance: 85 },
    { month: 'May', compliance: 87 },
    { month: 'Jun', compliance: 88 }
  ],
  liquidation_status: [
    { name: 'Borrador', value: 5 },
    { name: 'Enviado', value: 4 },
    { name: 'Aprobado', value: 15 },
    { name: 'Rechazado', value: 2 },
    { name: 'Pagado', value: 8 }
  ],
  kpi_coverage: [
    { bu: 'VL', coverage: 100 },
    { bu: 'VM', coverage: 95 },
    { bu: 'NE', coverage: 85 },
    { bu: 'SIC', coverage: 100 },
    { bu: 'SAT', coverage: 90 },
    { bu: 'COM', coverage: 80 }
  ],
  recent_activity: [
    { id: 1, user: 'Juan Pérez', action: 'Liquidación aprobada', entity: 'VL - Junio 2024', timestamp: '2024-06-15 10:30' },
    { id: 2, user: 'María García', action: 'Datos cargados', entity: 'VM - Junio 2024', timestamp: '2024-06-15 09:15' },
    { id: 3, user: 'Carlos López', action: 'Liquidación rechazada', entity: 'NE - Mayo 2024', timestamp: '2024-06-14 16:45' },
    { id: 4, user: 'Ana Rodríguez', action: 'Período creado', entity: 'Junio 2024', timestamp: '2024-06-01 08:00' }
  ]
}

export const mockLlaves = {
  VL: [
    {
      id: 1,
      code: 'VENTA_DIRECTA',
      name: 'Ventas Directas',
      weight: 30,
      source_type: 'automatico',
      parent_id: null,
      children: [
        { id: 2, code: 'VENTA_NUEVA', name: 'Ventas Nuevas', weight: 15, source_type: 'automatico' },
        { id: 3, code: 'VENTA_EXISTENTE', name: 'Ventas Existentes', weight: 15, source_type: 'semiautomatico' }
      ]
    },
    {
      id: 4,
      code: 'SATISFACCION',
      name: 'Satisfacción del Cliente',
      weight: 25,
      source_type: 'manual',
      parent_id: null,
      children: [
        { id: 5, code: 'NSAT', name: 'Net Satisfaction', weight: 25, source_type: 'manual' }
      ]
    },
    {
      id: 6,
      code: 'RETENSION',
      name: 'Retención',
      weight: 25,
      source_type: 'semiautomatico',
      parent_id: null,
      children: []
    },
    {
      id: 7,
      code: 'CALIDAD',
      name: 'Calidad',
      weight: 20,
      source_type: 'manual',
      parent_id: null,
      children: []
    }
  ]
}

export const mockUsers = [
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com', role: 'analyst', bu: 'VL', active: true, last_login: '2024-06-15 10:30' },
  { id: 2, name: 'María García', email: 'maria@example.com', role: 'approver', bu: 'VM', active: true, last_login: '2024-06-15 09:15' },
  { id: 3, name: 'Carlos López', email: 'carlos@example.com', role: 'analyst', bu: 'NE', active: true, last_login: '2024-06-14 16:45' },
  { id: 4, name: 'Ana Rodríguez', email: 'ana@example.com', role: 'admin', bu: null, active: true, last_login: '2024-06-15 08:00' }
]

export const mockPeriods = [
  { id: 1, year: 2024, month: 6, status: 'open' },
  { id: 2, year: 2024, month: 5, status: 'closed' },
  { id: 3, year: 2024, month: 4, status: 'closed' }
]

export const mockLiquidations = [
  {
    id: 1,
    user: 'Juan Pérez',
    bu: 'VL',
    period: 'Junio 2024',
    score: 92,
    premium: 15000000,
    status: 'approved'
  },
  {
    id: 2,
    user: 'María García',
    bu: 'VM',
    period: 'Junio 2024',
    score: 78,
    premium: 8500000,
    status: 'submitted'
  },
  {
    id: 3,
    user: 'Carlos López',
    bu: 'NE',
    period: 'Junio 2024',
    score: 85,
    premium: 12000000,
    status: 'draft'
  }
]

export const mockAuditLog = [
  { id: 1, date: '2024-06-15', user: 'Ana Rodríguez', action: 'create', entity: 'Período', detail: 'Período Junio 2024 creado' },
  { id: 2, date: '2024-06-15', user: 'Juan Pérez', action: 'update', entity: 'Liquidación', detail: 'Liquidación actualizada' },
  { id: 3, date: '2024-06-14', user: 'María García', action: 'upload', entity: 'Datos', detail: 'Archivo CSV cargado' }
]

export const mockReports = {
  monthly_summary: [
    { month: 'Enero', liquidations: 45, average_score: 82, average_premium: 10500000 },
    { month: 'Febrero', liquidations: 48, average_score: 84, average_premium: 11200000 },
    { month: 'Marzo', liquidations: 52, average_score: 86, average_premium: 12100000 },
    { month: 'Abril', liquidations: 50, average_score: 85, average_premium: 11800000 },
    { month: 'Mayo', liquidations: 55, average_score: 87, average_premium: 12500000 },
    { month: 'Junio', liquidations: 58, average_score: 88, average_premium: 13000000 }
  ],
  bu_distribution: [
    { name: 'VL', value: 35 },
    { name: 'VM', value: 25 },
    { name: 'NE', value: 15 },
    { name: 'SIC', value: 12 },
    { name: 'SAT', value: 8 },
    { name: 'COM', value: 5 }
  ]
}
