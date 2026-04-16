import React, { useState, useEffect } from 'react'
import {
  Briefcase, TrendingUp, AlertTriangle, Clock, DollarSign, FileText,
  ChevronDown, ChevronRight, Plus, Send, BarChart3, Award, Target, Calendar
} from 'lucide-react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Modal from '../components/Modal'
import MetricCard from '../components/MetricCard'
import { portalAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const ProfessionalPortal = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('liquidacion')
  const [loading, setLoading] = useState(false)

  // Liquidation data
  const [liquidation, setLiquidation] = useState(null)
  const [commissionDetail, setCommissionDetail] = useState([])

  // Sales data
  const [sales, setSales] = useState([])
  const [salesFilters, setSalesFilters] = useState({ week: '', product_type: '' })

  // Objections data
  const [objections, setObjections] = useState([])
  const [isObjectionModal, setIsObjectionModal] = useState(false)
  const [objectionForm, setObjectionForm] = useState({
    type: '', description: '', reference_type: '', reference_value: ''
  })

  // Historical data
  const [history, setHistory] = useState([])
  const [expandedPeriod, setExpandedPeriod] = useState(null)
  const [expandedDetail, setExpandedDetail] = useState([])

  // Weekly progress
  const [weeklyProgress, setWeeklyProgress] = useState([])

  useEffect(() => {
    fetchLiquidation()
    fetchWeeklyProgress()
  }, [])

  useEffect(() => {
    if (activeTab === 'liquidacion') fetchLiquidation()
    if (activeTab === 'ventas') fetchSales()
    if (activeTab === 'objeciones') fetchObjections()
    if (activeTab === 'historico') fetchHistory()
  }, [activeTab])

  const fetchLiquidation = async () => {
    try {
      setLoading(true)
      const res = await portalAPI.getMyLiquidations()
      const data = res?.data?.data || res?.data || null
      setLiquidation(data)
      if (data?.id) {
        const detailRes = await portalAPI.getCommissionDetail(data.id)
        setCommissionDetail(detailRes?.data?.data || detailRes?.data || [])
      }
    } catch (error) {
      setLiquidation(null)
      setCommissionDetail([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSales = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (salesFilters.week) filters.week = salesFilters.week
      if (salesFilters.product_type) filters.product_type = salesFilters.product_type
      const res = await portalAPI.getMySales(filters)
      setSales(res?.data?.data || res?.data || [])
    } catch (error) {
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  const fetchObjections = async () => {
    try {
      setLoading(true)
      const res = await portalAPI.getObjections()
      setObjections(res?.data?.data || res?.data || [])
    } catch (error) {
      setObjections([])
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const res = await portalAPI.getMyCommissions()
      setHistory(res?.data?.data || res?.data || [])
    } catch (error) {
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeklyProgress = async () => {
    try {
      const res = await portalAPI.getWeeklyProgress()
      setWeeklyProgress(res?.data?.data || res?.data || [])
    } catch (error) {
      setWeeklyProgress([])
    }
  }

  const handleExpandPeriod = async (period) => {
    if (expandedPeriod === period.id) {
      setExpandedPeriod(null)
      setExpandedDetail([])
      return
    }
    try {
      const res = await portalAPI.getCommissionDetail(period.id)
      setExpandedDetail(res?.data?.data || res?.data || [])
      setExpandedPeriod(period.id)
    } catch (error) {
      setExpandedDetail([])
      setExpandedPeriod(period.id)
    }
  }

  const handleSubmitObjection = async () => {
    if (!objectionForm.type || !objectionForm.description) {
      toast.error('Completa los campos requeridos')
      return
    }
    try {
      await portalAPI.createObjection(objectionForm)
      toast.success('Objecion enviada exitosamente')
      setIsObjectionModal(false)
      setObjectionForm({ type: '', description: '', reference_type: '', reference_value: '' })
      fetchObjections()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al enviar objecion')
    }
  }

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)
  }

  const getStatusBadge = (status) => {
    const config = {
      calculada: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Calculada' },
      calculated: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Calculada' },
      aprobada: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobada' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobada' },
      pagada: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Pagada' },
      paid: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Pagada' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Borrador' },
    }
    const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'N/A' }
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
  }

  const getObjectionStatusBadge = (status) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      under_review: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Revision' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aceptada' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expirada' },
    }
    const c = config[status] || config.pending
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
  }

  const getSaleStatusBadge = (status) => {
    const config = {
      validated: { bg: 'bg-green-100', text: 'text-green-800', label: 'Validada' },
      registered: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Registrada' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activa' },
    }
    const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'N/A' }
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
  }

  const isClaimPeriodActive = liquidation?.claim_deadline
    ? new Date(liquidation.claim_deadline) > new Date()
    : false

  const getClaimCountdown = () => {
    if (!liquidation?.claim_deadline) return null
    const deadline = new Date(liquidation.claim_deadline)
    const now = new Date()
    const diff = deadline - now
    if (diff <= 0) return null
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}d ${hours}h restantes`
  }

  // Weekly progress mini bar chart
  const maxWeekValue = Math.max(...weeklyProgress.map(w => w.total || 0), 1)

  const WeeklyProgressChart = () => (
    <div className="flex items-end gap-2 h-16">
      {weeklyProgress.length > 0 ? weeklyProgress.map((week, idx) => (
        <div key={idx} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full bg-blue-500 rounded-t-sm min-h-[4px] transition-all"
            style={{ height: `${Math.max((week.total / maxWeekValue) * 100, 6)}%` }}
            title={`Semana ${week.week || idx + 1}: ${formatCurrency(week.total || 0)}`}
          />
          <span className="text-[10px] text-gray-500">S{week.week || idx + 1}</span>
        </div>
      )) : (
        <p className="text-xs text-gray-400">Sin datos</p>
      )}
    </div>
  )

  // Column definitions
  const detailColumns = [
    { key: 'sale_date', label: 'Fecha', sortable: true },
    { key: 'point_of_sale_name', label: 'PdV' },
    { key: 'product', label: 'Producto' },
    { key: 'sale_value', label: 'Valor Venta', render: (val) => formatCurrency(val) },
    { key: 'commission_value', label: 'Comision', render: (val) => formatCurrency(val) },
  ]

  const salesColumns = [
    { key: 'sale_date', label: 'Fecha', sortable: true },
    { key: 'point_of_sale_name', label: 'Punto de Venta' },
    { key: 'product', label: 'Producto' },
    { key: 'client_name', label: 'Cliente' },
    { key: 'sale_value', label: 'Valor', render: (val) => formatCurrency(val) },
    { key: 'status', label: 'Estado', render: (val) => getSaleStatusBadge(val) },
  ]

  const objectionColumns = [
    { key: 'created_at', label: 'Fecha', render: (val) => val ? new Date(val).toLocaleDateString('es-CO') : '-' },
    { key: 'type', label: 'Tipo' },
    { key: 'description', label: 'Descripcion', render: (val) => <span className="max-w-xs truncate block">{val}</span> },
    { key: 'reference_type', label: 'Referencia' },
    { key: 'reference_value', label: 'Valor Ref.' },
    { key: 'status', label: 'Estado', render: (val) => getObjectionStatusBadge(val) },
    { key: 'resolution_notes', label: 'Resolucion', render: (val) => val || '-' },
  ]

  const historyColumns = [
    { key: 'period_name', label: 'Periodo', sortable: true },
    { key: 'total_sales', label: 'Total Ventas', render: (val) => formatCurrency(val) },
    { key: 'commission_amount', label: 'Comision', render: (val) => formatCurrency(val) },
    { key: 'llave_score', label: 'Score LLAVE', render: (val) => {
      if (!val && val !== 0) return '-'
      let color = 'text-green-600'
      if (val < 60) color = 'text-red-600'
      else if (val < 80) color = 'text-yellow-600'
      return <span className={`font-medium ${color}`}>{val}%</span>
    }},
    { key: 'bonus_amount', label: 'Prima', render: (val) => formatCurrency(val) },
    { key: 'status', label: 'Estado', render: (val) => getStatusBadge(val) },
  ]

  const tabs = [
    { id: 'liquidacion', label: 'Mi Liquidacion', icon: DollarSign },
    { id: 'ventas', label: 'Mis Ventas', icon: TrendingUp },
    { id: 'objeciones', label: 'Objeciones', icon: AlertTriangle },
    { id: 'historico', label: 'Historico', icon: FileText },
  ]

  const salesTotals = sales.reduce((acc, s) => {
    acc.count += 1
    acc.value += s.sale_value || 0
    return acc
  }, { count: 0, value: 0 })

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Briefcase size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Bienvenido, {user?.name || 'Profesional'}</h1>
                <p className="text-blue-100 text-sm mt-1">Portal del Profesional Comercial</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {liquidation?.period_name && (
                <div className="text-right">
                  <p className="text-blue-200 text-xs font-medium">Periodo Actual</p>
                  <p className="text-lg font-semibold">{liquidation.period_name}</p>
                </div>
              )}
              <div className="bg-white/10 rounded-lg p-3 min-w-[140px]">
                <p className="text-blue-200 text-xs font-medium mb-1">Progreso Semanal</p>
                <WeeklyProgressChart />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-6">
            {/* ===== MI LIQUIDACION TAB ===== */}
            {activeTab === 'liquidacion' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <MetricCard
                    icon={TrendingUp}
                    label="Total Ventas"
                    value={formatCurrency(liquidation?.total_sales || 0)}
                    color="blue"
                  />
                  <MetricCard
                    icon={DollarSign}
                    label="Total Comision"
                    value={formatCurrency(liquidation?.commission_amount || 0)}
                    color="green"
                  />
                  <MetricCard
                    icon={Award}
                    label="Score LLAVE"
                    value={liquidation?.llave_score ? `${liquidation.llave_score}%` : '-'}
                    color="purple"
                  />
                  <MetricCard
                    icon={Target}
                    label="Prima Estimada"
                    value={formatCurrency(liquidation?.bonus_amount || 0)}
                    color="yellow"
                  />
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Estado</p>
                        <div className="mt-3">
                          {getStatusBadge(liquidation?.status)}
                        </div>
                      </div>
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                        <FileText size={24} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim deadline countdown */}
                {liquidation?.claim_deadline && (
                  <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                    isClaimPeriodActive
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <Clock size={20} className={isClaimPeriodActive ? 'text-amber-600' : 'text-gray-400'} />
                    <div>
                      <p className={`text-sm font-medium ${isClaimPeriodActive ? 'text-amber-800' : 'text-gray-600'}`}>
                        {isClaimPeriodActive
                          ? `Periodo de reclamacion abierto - ${getClaimCountdown()}`
                          : 'Periodo de reclamacion finalizado'
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Fecha limite: {new Date(liquidation.claim_deadline).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment info */}
                {(liquidation?.status === 'approved' || liquidation?.status === 'paid' ||
                  liquidation?.status === 'aprobada' || liquidation?.status === 'pagada') && liquidation?.payment_info && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={18} className="text-green-600" />
                      <p className="text-sm font-semibold text-green-800">Informacion de Pago</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      {liquidation.payment_info.payment_date && (
                        <div>
                          <p className="text-green-600 text-xs">Fecha de Pago</p>
                          <p className="font-medium text-green-900">{liquidation.payment_info.payment_date}</p>
                        </div>
                      )}
                      {liquidation.payment_info.payment_method && (
                        <div>
                          <p className="text-green-600 text-xs">Metodo</p>
                          <p className="font-medium text-green-900">{liquidation.payment_info.payment_method}</p>
                        </div>
                      )}
                      {liquidation.payment_info.reference && (
                        <div>
                          <p className="text-green-600 text-xs">Referencia</p>
                          <p className="font-medium text-green-900">{liquidation.payment_info.reference}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detail breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detalle de Comisiones</h3>
                  <Table columns={detailColumns} data={commissionDetail} loading={loading} />
                </div>
              </div>
            )}

            {/* ===== MIS VENTAS TAB ===== */}
            {activeTab === 'ventas' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semana</label>
                    <select
                      value={salesFilters.week}
                      onChange={(e) => {
                        setSalesFilters({ ...salesFilters, week: e.target.value })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Todas</option>
                      <option value="1">Semana 1</option>
                      <option value="2">Semana 2</option>
                      <option value="3">Semana 3</option>
                      <option value="4">Semana 4</option>
                      <option value="5">Semana 5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Producto</label>
                    <select
                      value={salesFilters.product_type}
                      onChange={(e) => {
                        setSalesFilters({ ...salesFilters, product_type: e.target.value })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Todos</option>
                      <option value="seguros">Seguros</option>
                      <option value="credito">Credito</option>
                      <option value="inversion">Inversion</option>
                      <option value="ahorro">Ahorro</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={fetchSales}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  <TrendingUp size={18} />
                  Filtrar
                </button>

                <Table columns={salesColumns} data={sales} loading={loading} />

                {/* Summary totals */}
                {sales.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Total Registros</p>
                          <p className="text-lg font-bold text-blue-900">{salesTotals.count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Valor Total</p>
                          <p className="text-lg font-bold text-blue-900">{formatCurrency(salesTotals.value)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== OBJECIONES TAB ===== */}
            {activeTab === 'objeciones' && (
              <div className="space-y-6">
                {/* Claim period info */}
                {isClaimPeriodActive ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <Clock size={18} className="text-amber-600" />
                      <p className="text-sm text-amber-800 font-medium">
                        Periodo de reclamacion abierto - {getClaimCountdown()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setObjectionForm({ type: '', description: '', reference_type: '', reference_value: '' })
                        setIsObjectionModal(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      <Plus size={18} />
                      Nueva Objecion
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Periodo de reclamacion finalizado</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">No es posible crear nuevas objeciones en este momento.</p>
                    </div>
                  </div>
                )}

                {/* Objections list */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mis Objeciones</h3>
                  <Table columns={objectionColumns} data={objections} loading={loading} />
                </div>
              </div>
            )}

            {/* ===== HISTORICO TAB ===== */}
            {activeTab === 'historico' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Periodos Anteriores</h3>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No hay datos historicos para mostrar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((period) => (
                      <div key={period.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <button
                          onClick={() => handleExpandPeriod(period)}
                          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                              <Calendar size={20} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">{period.period_name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {period.total_sales_count || '-'} ventas
                              </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-6 text-sm">
                              <div className="text-right">
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Ventas</p>
                                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(period.total_sales)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Comision</p>
                                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(period.commission_amount)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Score</p>
                                <p className="font-medium text-gray-900">{period.llave_score ? `${period.llave_score}%` : '-'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Prima</p>
                                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(period.bonus_amount)}</p>
                              </div>
                              <div>{getStatusBadge(period.status)}</div>
                            </div>
                          </div>
                          {expandedPeriod === period.id
                            ? <ChevronDown size={20} className="text-gray-400 ml-3" />
                            : <ChevronRight size={20} className="text-gray-400 ml-3" />
                          }
                        </button>

                        {/* Mobile summary */}
                        <div className="sm:hidden px-5 pb-3 flex flex-wrap gap-3 text-xs">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{formatCurrency(period.total_sales)}</span>
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded">{formatCurrency(period.commission_amount)}</span>
                          {getStatusBadge(period.status)}
                        </div>

                        {/* Expanded detail */}
                        {expandedPeriod === period.id && (
                          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-5">
                            <Table columns={detailColumns} data={expandedDetail} loading={false} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== OBJECTION MODAL ===== */}
      <Modal
        isOpen={isObjectionModal}
        onClose={() => setIsObjectionModal(false)}
        title="Nueva Objecion"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsObjectionModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitObjection}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              <Send size={16} />
              Enviar Objecion
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Objecion *</label>
            <select
              value={objectionForm.type}
              onChange={(e) => setObjectionForm({ ...objectionForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccionar...</option>
              <option value="Venta faltante">Venta faltante</option>
              <option value="Valor incorrecto">Valor incorrecto</option>
              <option value="Asignacion incorrecta">Asignacion incorrecta</option>
              <option value="Disputa PQR">Disputa PQR</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion *</label>
            <textarea
              value={objectionForm.description}
              onChange={(e) => setObjectionForm({ ...objectionForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              placeholder="Describe tu objecion con el mayor detalle posible..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Referencia</label>
              <select
                value={objectionForm.reference_type}
                onChange={(e) => setObjectionForm({ ...objectionForm, reference_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                <option value="PQR">PQR</option>
                <option value="Venta">Venta</option>
                <option value="Contrato">Contrato</option>
                <option value="KPI">KPI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor de Referencia</label>
              <input
                type="text"
                value={objectionForm.reference_value}
                onChange={(e) => setObjectionForm({ ...objectionForm, reference_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ej: PQR-12345"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default ProfessionalPortal
