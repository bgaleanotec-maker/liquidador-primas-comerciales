import React, { useState, useEffect } from 'react'
import { DollarSign, Calculator, CheckCircle, CreditCard, Download, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import { paymentsAPI, adminAPI } from '../api'
import toast from 'react-hot-toast'

const Payments = () => {
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [periods, setPeriods] = useState([])
  const [selectedBU, setSelectedBU] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [calculating, setCalculating] = useState(false)

  // Summary
  const [summary, setSummary] = useState({
    total_calculated: 0,
    total_approved: 0,
    total_paid: 0
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [selectedBU, selectedPeriod])

  const fetchInitialData = async () => {
    try {
      const [buRes, periodRes] = await Promise.all([
        adminAPI.getBusinessUnits(),
        adminAPI.getPeriods()
      ])
      setBusinesses(buRes?.data?.data || buRes?.data || buRes || [])
      setPeriods(periodRes?.data?.data || periodRes?.data || periodRes || [])
    } catch (error) {
      setBusinesses([
        { id: 1, code: 'VL', name: 'Ventas Linea' },
        { id: 2, code: 'VM', name: 'Ventas Mayorista' },
        { id: 3, code: 'NE', name: 'Negocios Especiales' },
        { id: 4, code: 'SIC', name: 'SIC' },
        { id: 5, code: 'SAT', name: 'Soluciones AT' },
        { id: 6, code: 'COM', name: 'Comercial' }
      ])
      setPeriods([
        { id: 1, name: 'Junio 2024' },
        { id: 2, name: 'Mayo 2024' },
        { id: 3, name: 'Abril 2024' }
      ])
    }
  }

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (selectedBU) filters.business_unit_id = selectedBU
      if (selectedPeriod) filters.period_id = selectedPeriod
      const res = await paymentsAPI.getPayments(filters)
      const data = res?.data?.data || res?.data || []
      setPayments(data)
      calculateSummary(data)
    } catch (error) {
      setPayments([])
      setSummary({ total_calculated: 0, total_approved: 0, total_paid: 0 })
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (data) => {
    const totals = data.reduce((acc, p) => {
      acc.total_calculated += p.commission_amount || 0
      if (p.status === 'approved' || p.status === 'paid') acc.total_approved += p.commission_amount || 0
      if (p.status === 'paid') acc.total_paid += p.commission_amount || 0
      return acc
    }, { total_calculated: 0, total_approved: 0, total_paid: 0 })
    setSummary(totals)
  }

  const handleCalculateCommissions = async () => {
    if (!selectedPeriod || !selectedBU) {
      toast.error('Selecciona un periodo y una unidad de negocio')
      return
    }
    try {
      setCalculating(true)
      await paymentsAPI.calculateCommissions({
        period_id: selectedPeriod,
        business_unit_id: selectedBU
      })
      toast.success('Comisiones calculadas exitosamente')
      fetchPayments()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al calcular comisiones')
    } finally {
      setCalculating(false)
    }
  }

  const handleApprove = async (payment) => {
    try {
      await paymentsAPI.approvePayment(payment.id)
      toast.success('Pago aprobado')
      fetchPayments()
    } catch (error) {
      toast.error('Error al aprobar pago')
    }
  }

  const handleMarkPaid = async (payment) => {
    try {
      await paymentsAPI.markPaid(payment.id, { paid_date: new Date().toISOString().split('T')[0] })
      toast.success('Pago marcado como pagado')
      fetchPayments()
    } catch (error) {
      toast.error('Error al marcar como pagado')
    }
  }

  const handleExport = async () => {
    try {
      const res = await paymentsAPI.getHistory()
      const data = res?.data?.data || res?.data || []
      const csv = [
        ['Periodo', 'Profesional', 'BU', 'Total Ventas', 'Comision', 'Score LLAVE', 'Prima', 'Estado'].join(','),
        ...data.map(p => [
          p.period_name, p.professional_name, p.business_unit_code,
          p.total_sales, p.commission_amount, p.llave_score, p.bonus_amount, p.status
        ].join(','))
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'comisiones_export.csv')
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)
      toast.success('Exportado exitosamente')
    } catch (error) {
      toast.error('Error al exportar')
    }
  }

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)
  }

  const getPaymentStatusBadge = (status) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      calculated: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Calculado' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
      paid: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Pagado' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' }
    }
    const c = config[status] || config.pending
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
  }

  const columns = [
    { key: 'period_name', label: 'Periodo', sortable: true },
    { key: 'professional_name', label: 'Profesional', sortable: true },
    { key: 'business_unit_code', label: 'BU' },
    { key: 'total_sales', label: 'Total Ventas', render: (val) => formatCurrency(val) },
    { key: 'commission_amount', label: 'Comision', render: (val) => formatCurrency(val) },
    {
      key: 'llave_score',
      label: 'Score LLAVE',
      render: (val) => {
        if (!val && val !== 0) return '-'
        let color = 'text-green-600'
        if (val < 60) color = 'text-red-600'
        else if (val < 80) color = 'text-yellow-600'
        return <span className={`font-medium ${color}`}>{val}%</span>
      }
    },
    { key: 'bonus_amount', label: 'Prima', render: (val) => formatCurrency(val) },
    { key: 'status', label: 'Estado', render: (val) => getPaymentStatusBadge(val) }
  ]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comisiones y Pagos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Calcula, aprueba y gestiona pagos de comisiones</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium"
          >
            <Download size={18} />
            Exportar
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            icon={Calculator}
            label="Total Calculado"
            value={formatCurrency(summary.total_calculated)}
            color="blue"
          />
          <MetricCard
            icon={CheckCircle}
            label="Total Aprobado"
            value={formatCurrency(summary.total_approved)}
            color="green"
          />
          <MetricCard
            icon={CreditCard}
            label="Total Pagado"
            value={formatCurrency(summary.total_paid)}
            color="purple"
          />
        </div>

        {/* Filters + Calculate */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unidad de Negocio</label>
              <select
                value={selectedBU}
                onChange={(e) => setSelectedBU(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas</option>
                {businesses.map((bu) => (
                  <option key={bu.id || bu.code} value={bu.id || bu.code}>{bu.code} - {bu.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Periodo</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={handleCalculateCommissions}
                disabled={calculating || !selectedPeriod || !selectedBU}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                {calculating ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator size={18} />
                    Calcular Comisiones
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <Table
              columns={columns}
              data={payments}
              loading={loading}
              actions={(row) => (
                <>
                  {(row.status === 'calculated' || row.status === 'pending') && (
                    <button
                      onClick={() => handleApprove(row)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Aprobar
                    </button>
                  )}
                  {row.status === 'approved' && (
                    <button
                      onClick={() => handleMarkPaid(row)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Marcar Pagado
                    </button>
                  )}
                </>
              )}
            />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Payments
