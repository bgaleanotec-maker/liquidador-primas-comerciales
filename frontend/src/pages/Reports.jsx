import React, { useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, FileText, TrendingUp, Users } from 'lucide-react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import { reportsAPI } from '../api'
import { mockReports } from '../utils/mockData'
import { formatCurrency, formatPercent } from '../utils/format'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const Reports = () => {
  const [reportType, setReportType] = useState('monthly')
  const [filters, setFilters] = useState({
    period: 'Junio 2024',
    bu: '',
    user: '',
    months: 6
  })
  const [data, setData] = useState(mockReports.monthly_summary)
  const [loading, setLoading] = useState(false)

  const reportTypes = [
    { id: 'monthly', label: 'Resumen Mensual', icon: FileText },
    { id: 'bu', label: 'Por Unidad de Negocio', icon: PieChart },
    { id: 'user', label: 'Desempeño Individual', icon: Users },
    { id: 'trend', label: 'Tendencia', icon: TrendingUp }
  ]

  const handleExport = async (format) => {
    try {
      setLoading(true)
      const response = await reportsAPI.exportReport({
        type: reportType,
        format,
        filters
      })

      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte_${reportType}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)

      toast.success(`Reporte exportado a ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Error al exportar reporte')
    } finally {
      setLoading(false)
    }
  }

  const renderChart = () => {
    switch (reportType) {
      case 'monthly':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="liquidations" fill="#3b82f6" name="Liquidaciones" />
              <Bar dataKey="average_score" fill="#10b981" name="Score Promedio" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'bu':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={mockReports.bu_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {mockReports.bu_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'trend':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={mockReports.monthly_summary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="average_score"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Score Promedio"
                dot={{ fill: '#3b82f6', r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="liquidations"
                stroke="#10b981"
                strokeWidth={2}
                name="Liquidaciones"
                dot={{ fill: '#10b981', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'user':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Top 5 Usuarios</h4>
              <div className="space-y-2">
                {[
                  { name: 'Juan Pérez', score: 95, premium: 15000000 },
                  { name: 'María García', score: 88, premium: 12000000 },
                  { name: 'Carlos López', score: 85, premium: 11000000 },
                  { name: 'Ana Rodríguez', score: 82, premium: 10000000 },
                  { name: 'Luis Martínez', score: 80, premium: 9000000 }
                ].map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{user.name}</span>
                    <div className="flex gap-4">
                      <span className="font-medium text-sm">{user.score}%</span>
                      <span className="font-medium text-sm text-green-600">{formatCurrency(user.premium)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Distribucion Premios</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Rango 80-100%', value: 45 },
                      { name: 'Rango 60-79%', value: 35 },
                      { name: 'Rango <60%', value: 20 }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const tableColumns = [
    { key: 'month', label: 'Mes', sortable: true },
    {
      key: 'liquidations',
      label: 'Liquidaciones',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'average_score',
      label: 'Score Promedio',
      render: (value) => <span className="font-medium">{value.toFixed(1)}%</span>
    },
    {
      key: 'average_premium',
      label: 'Prima Promedio',
      render: (value) => <span className="font-medium">{formatCurrency(value)}</span>
    }
  ]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">Análisis y visualización de datos de liquidaciones</p>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  reportType === type.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Icon
                  size={28}
                  className={`mx-auto mb-2 ${
                    reportType === type.id ? 'text-primary-600' : 'text-gray-400'
                  }`}
                />
                <p className={`text-sm font-medium ${
                  reportType === type.id ? 'text-primary-600' : 'text-gray-700'
                }`}>
                  {type.label}
                </p>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <select
                value={filters.period}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option>Junio 2024</option>
                <option>Mayo 2024</option>
                <option>Abril 2024</option>
              </select>
            </div>

            {reportType !== 'monthly' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de Negocio</label>
                  <select
                    value={filters.bu}
                    onChange={(e) => setFilters({ ...filters, bu: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Todas</option>
                    <option value="VL">VL</option>
                    <option value="VM">VM</option>
                    <option value="NE">NE</option>
                  </select>
                </div>

                {reportType === 'user' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                    <select
                      value={filters.user}
                      onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Selecciona usuario</option>
                      <option value="juan">Juan Pérez</option>
                      <option value="maria">María García</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {reportType === 'trend' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meses a mostrar</label>
                <select
                  value={filters.months}
                  onChange={(e) => setFilters({ ...filters, months: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={3}>Últimos 3 meses</option>
                  <option value={6}>Últimos 6 meses</option>
                  <option value={12}>Últimos 12 meses</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Visualización</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('excel')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                <Download size={18} />
                Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                <Download size={18} />
                PDF
              </button>
            </div>
          </div>

          {renderChart()}
        </div>

        {/* Data Table */}
        {reportType === 'monthly' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Datos Detallados</h3>
            </div>
            <Table columns={tableColumns} data={data} loading={loading} />
          </div>
        )}

        {/* Auto Report */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl shadow-sm p-6 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reportes Automáticos</h3>
              <p className="text-gray-600 mt-1">Programa la generación automática de reportes</p>
            </div>
            <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
              Configurar
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Reports
