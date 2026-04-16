import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import Layout from '../components/Layout'
import MetricCard from '../components/MetricCard'
import Table from '../components/Table'
import { metricsAPI } from '../api'
import { mockDashboard } from '../utils/mockData'
import { formatCurrency, formatPercent } from '../utils/format'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const Dashboard = () => {
  const [data, setData] = useState(mockDashboard)
  const [period, setPeriod] = useState('Junio 2024')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const response = await metricsAPI.getDashboard()
        if (response.data?.success && response.data?.data) {
          setData({ ...mockDashboard, ...response.data.data })
        }
      } catch (error) {
        console.log('Using mock data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const recentActivityColumns = [
    { key: 'user', label: 'Usuario', sortable: true },
    { key: 'action', label: 'Acción', sortable: true },
    { key: 'entity', label: 'Entidad', sortable: true },
    { key: 'timestamp', label: 'Fecha/Hora', sortable: true }
  ]

  const kpiCoverageColumns = [
    { key: 'bu', label: 'Unidad de Negocio', sortable: true },
    {
      key: 'coverage',
      label: 'Cobertura KPI',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-xs">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className="font-medium text-sm text-gray-900 dark:text-gray-200">{value}%</span>
        </div>
      )
    }
  ]

  return (
    <Layout pendingCount={data.pending_approvals}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Bienvenido de vuelta. Aquí está tu resumen.</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option>Junio 2024</option>
            <option>Mayo 2024</option>
            <option>Abril 2024</option>
          </select>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={AlertCircle}
            label="Liquidaciones Pendientes"
            value={data.pending_liquidations}
            color="yellow"
          />
          <MetricCard
            icon={CheckCircle}
            label="Aprobaciones Pendientes"
            value={data.pending_approvals}
            color="red"
          />
          <MetricCard
            icon={TrendingUp}
            label="Promedio Cumplimiento"
            value={`${formatNumber(data.compliance_avg, 1)}%`}
            color="green"
          />
          <MetricCard
            icon={Zap}
            label="Fuentes Automatizadas"
            value={`${data.automated_sources}%`}
            color="blue"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance by BU */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cumplimiento por Unidad de Negocio</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.bu_compliance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" stroke="#e5e7eb" />
                <XAxis dataKey="name" className="stroke-gray-500 dark:stroke-gray-400" stroke="#6b7280" />
                <YAxis className="stroke-gray-500 dark:stroke-gray-400" stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="cumplimiento" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tendencia - Últimos 6 Meses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" stroke="#e5e7eb" />
                <XAxis dataKey="month" className="stroke-gray-500 dark:stroke-gray-400" stroke="#6b7280" />
                <YAxis className="stroke-gray-500 dark:stroke-gray-400" stroke="#6b7280" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status & Coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liquidation Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado de Liquidaciones</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.liquidation_status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(data.liquidation_status || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* KPI Coverage */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cobertura de KPIs por BU</h3>
            <div className="space-y-4">
              {data.kpi_coverage?.map((item) => (
                <div key={item.bu}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.bu}</span>
                    <span className="text-sm font-bold text-primary-600">{item.coverage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.coverage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actividad Reciente</h3>
          <Table columns={recentActivityColumns} data={data.recent_activity} loading={loading} />
        </div>
      </div>
    </Layout>
  )
}

function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export default Dashboard
