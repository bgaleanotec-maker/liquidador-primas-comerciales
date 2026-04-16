import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('primax_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('primax_token')
      localStorage.removeItem('primax_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
}

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAuditLog: () => api.get('/admin/audit'),
  getBusinessUnits: () => api.get('/admin/business-units'),
  createPeriod: (data) => api.post('/admin/periods', data),
  getPeriods: () => api.get('/admin/periods'),
  getDataSources: () => api.get('/admin/data-sources'),
  createDataSource: (data) => api.post('/admin/data-sources', data)
}

export const variablesAPI = {
  getLlaves: (bu_code) => api.get('/variables/llaves', { params: { bu_code } }),
  createLlave: (data) => api.post('/variables/llaves', data),
  updateLlave: (id, data) => api.put(`/variables/llaves/${id}`, data),
  deleteLlave: (id) => api.delete(`/variables/llaves/${id}`),
  getKPIs: (llave_id) => api.get('/variables/kpis', { params: { llave_id } }),
  createKPI: (data) => api.post('/variables/kpis', data),
  updateKPI: (id, data) => api.put(`/variables/kpis/${id}`, data),
  getStructure: (bu_code) => api.get(`/variables/structure/${bu_code}`),
  validateWeights: (bu_code) => api.post(`/variables/validate-weights/${bu_code}`)
}

export const dataAPI = {
  uploadCSV: (formData) => api.post('/data/upload-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getResults: (filters) => api.get('/data/results', { params: filters }),
  updateResult: (id, data) => api.put(`/data/results/${id}`, data),
  getTargets: (filters) => api.get('/data/targets', { params: filters }),
  uploadTargets: (data) => api.post('/data/targets/bulk', data),
  downloadTemplate: (bu_code) => api.get(`/data/template/${bu_code}`, {
    responseType: 'blob'
  })
}

export const liquidationsAPI = {
  getLiquidations: (filters) => api.get('/liquidations', { params: filters }),
  calculate: (data) => api.post('/liquidations/calculate', data),
  getLiquidation: (id) => api.get(`/liquidations/${id}`),
  submitLiquidation: (id) => api.put(`/liquidations/${id}/submit`)
}

export const approvalsAPI = {
  getPending: () => api.get('/approvals/pending'),
  approve: (liquidationId, comments) => api.post(`/approvals/${liquidationId}/approve`, { comments }),
  reject: (liquidationId, comments) => api.post(`/approvals/${liquidationId}/reject`, { comments }),
  getHistory: () => api.get('/approvals/history')
}

export const reportsAPI = {
  getMonthlySummary: (period_id) => api.get('/reports/monthly-summary', { params: { period_id } }),
  getBUReport: (period_id, bu) => api.get('/reports/bu-report', { params: { period_id, bu } }),
  getUserPerformance: (period_id, user_id) => api.get('/reports/user-performance', { params: { period_id, user_id } }),
  getTrend: (months) => api.get('/reports/trend', { params: { months } }),
  exportReport: (data) => api.post('/reports/export', data, { responseType: 'blob' })
}

export const metricsAPI = {
  getDashboard: () => api.get('/metrics/dashboard'),
  getKPICompliance: () => api.get('/metrics/kpi-compliance'),
  getPeriodProgress: (period_id) => api.get('/metrics/period-progress', { params: { period_id } }),
  getSourceCoverage: () => api.get('/metrics/source-coverage')
}

export const salesAPI = {
  // Points of Sale
  getPointsOfSale: (bu_id) => api.get('/sales/points-of-sale', { params: { business_unit_id: bu_id } }),
  createPointOfSale: (data) => api.post('/sales/points-of-sale', data),
  updatePointOfSale: (id, data) => api.put(`/sales/points-of-sale/${id}`, data),

  // Professionals
  getProfessionals: (filters) => api.get('/sales/professionals', { params: filters }),
  createProfessional: (data) => api.post('/sales/professionals', data),
  updateProfessional: (id, data) => api.put(`/sales/professionals/${id}`, data),

  // Assignments
  getAssignments: (filters) => api.get('/sales/assignments', { params: filters }),
  createAssignment: (data) => api.post('/sales/assignments', data),
  updateAssignment: (id, data) => api.put(`/sales/assignments/${id}`, data),

  // Sales
  getSales: (filters) => api.get('/sales', { params: filters }),
  uploadSalesCSV: (formData) => api.post('/sales/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSalesTemplate: (bu_code) => api.get(`/sales/template/${bu_code}`, { responseType: 'blob' }),
  createSale: (data) => api.post('/sales/manual', data),
  updateSale: (id, data) => api.put(`/sales/${id}`, data),
  getSalesSummary: (filters) => api.get('/sales/summary', { params: filters }),
}

export const paymentsAPI = {
  getPayments: (filters) => api.get('/payments', { params: filters }),
  calculateCommissions: (data) => api.post('/payments/calculate', data),
  approvePayment: (id) => api.post(`/payments/${id}/approve`),
  markPaid: (id, data) => api.post(`/payments/${id}/mark-paid`, data),
  getHistory: () => api.get('/payments/history'),
}

export const configAPI = {
  getLlaveConfig: (bu_code, period_id) => api.get(`/config/llaves/${bu_code}`, { params: { period_id } }),
  saveLlaveConfig: (data) => api.post('/config/llaves', data),
  getConfigHistory: () => api.get('/config/llaves/history'),
}

export default api
