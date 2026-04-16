import React, { useState, useEffect } from 'react'
import { Download, Plus, Eye } from 'lucide-react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { liquidationsAPI } from '../api'
import { mockLiquidations } from '../utils/mockData'
import { formatCurrency, formatPercent } from '../utils/format'
import toast from 'react-hot-toast'

const Liquidations = () => {
  const [liquidations, setLiquidations] = useState(mockLiquidations)
  const [filters, setFilters] = useState({
    period: 'Junio 2024',
    bu: '',
    user: '',
    status: ''
  })
  const [isCalculateModal, setIsCalculateModal] = useState(false)
  const [isDetailModal, setIsDetailModal] = useState(false)
  const [selectedLiquidation, setSelectedLiquidation] = useState(null)
  const [calculateData, setCalculateData] = useState({
    period: 'Junio 2024',
    bu: '',
    user: '',
    base_salary: 0
  })
  const [loading, setLoading] = useState(false)

  const columns = [
    { key: 'user', label: 'Usuario', sortable: true },
    { key: 'bu', label: 'Unidad de Negocio', sortable: true },
    { key: 'period', label: 'Período', sortable: true },
    {
      key: 'score',
      label: 'Score %',
      sortable: true,
      render: (value) => <span className="font-semibold">{value}%</span>
    },
    {
      key: 'premium',
      label: 'Prima',
      sortable: true,
      render: (value) => <span className="font-semibold">{formatCurrency(value)}</span>
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value) => <StatusBadge status={value} />
    }
  ]

  const handleCalculate = async () => {
    if (!calculateData.period || !calculateData.bu || !calculateData.base_salary) {
      toast.error('Por favor completa los campos requeridos')
      return
    }

    try {
      setLoading(true)
      const response = await liquidationsAPI.calculate(calculateData)
      toast.success('Liquidación calculada exitosamente')
      setIsCalculateModal(false)
      setCalculateData({ period: 'Junio 2024', bu: '', user: '', base_salary: 0 })
    } catch (error) {
      toast.error('Error al calcular liquidación')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (liquidation) => {
    setSelectedLiquidation(liquidation)
    setIsDetailModal(true)
  }

  const handleExportPDF = () => {
    toast.success('Exportando a PDF...')
  }

  const handleSubmit = async () => {
    try {
      await liquidationsAPI.submitLiquidation(selectedLiquidation.id)
      toast.success('Liquidación enviada para aprobación')
      setIsDetailModal(false)
    } catch (error) {
      toast.error('Error al enviar liquidación')
    }
  }

  const mockLiquidationDetail = {
    id: 1,
    user: 'Juan Pérez',
    bu: 'VL',
    period: 'Junio 2024',
    llaves: [
      {
        code: 'VENTA_DIRECTA',
        name: 'Ventas Directas',
        weight: 30,
        kpis: [
          { name: 'Ventas Nuevas', meta: 50000000, actual: 48000000, cumplimiento: 96, peso: 15, score: 14.4 },
          { name: 'Ventas Existentes', meta: 70000000, actual: 65000000, cumplimiento: 92.9, peso: 15, score: 13.9 }
        ]
      },
      {
        code: 'SATISFACCION',
        name: 'Satisfacción del Cliente',
        weight: 25,
        kpis: [
          { name: 'Net Satisfaction Score', meta: 80, actual: 78, cumplimiento: 97.5, peso: 25, score: 24.4 }
        ]
      },
      {
        code: 'RETENSION',
        name: 'Retención',
        weight: 25,
        kpis: [
          { name: 'Tasa de Retención', meta: 95, actual: 93, cumplimiento: 97.9, peso: 25, score: 24.5 }
        ]
      },
      {
        code: 'CALIDAD',
        name: 'Calidad',
        weight: 20,
        kpis: [
          { name: 'Calidad de Servicio', meta: 90, actual: 87, cumplimiento: 96.7, peso: 20, score: 19.3 }
        ]
      }
    ],
    final_score: 92,
    base_salary: 5000000,
    premium: 15000000
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Liquidaciones</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona liquidaciones de primas</p>
          </div>
          <button
            onClick={() => setIsCalculateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Calcular Nueva
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
              <select
                value={filters.period}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option>Junio 2024</option>
                <option>Mayo 2024</option>
                <option>Abril 2024</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unidad de Negocio</label>
              <select
                value={filters.bu}
                onChange={(e) => setFilters({ ...filters, bu: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas</option>
                <option value="VL">VL</option>
                <option value="VM">VM</option>
                <option value="NE">NE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Usuario</label>
              <select
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                <option value="juan">Juan Pérez</option>
                <option value="maria">María García</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                <option value="draft">Borrador</option>
                <option value="submitted">Enviado</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table
            columns={columns}
            data={liquidations}
            loading={loading}
            actions={(row) => [
              <button
                key="view"
                onClick={() => handleViewDetail(row)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
              >
                <Eye size={16} />
                Ver
              </button>
            ]}
          />
        </div>
      </div>

      {/* Calculate Modal */}
      <Modal
        isOpen={isCalculateModal}
        onClose={() => setIsCalculateModal(false)}
        title="Calcular Nueva Liquidación"
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsCalculateModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              Calcular
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
            <select
              value={calculateData.period}
              onChange={(e) => setCalculateData({ ...calculateData, period: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option>Junio 2024</option>
              <option>Mayo 2024</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unidad de Negocio *</label>
            <select
              value={calculateData.bu}
              onChange={(e) => setCalculateData({ ...calculateData, bu: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecciona UB</option>
              <option value="VL">VL</option>
              <option value="VM">VM</option>
              <option value="NE">NE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Usuario (opcional)</label>
            <select
              value={calculateData.user}
              onChange={(e) => setCalculateData({ ...calculateData, user: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los usuarios</option>
              <option value="juan">Juan Pérez</option>
              <option value="maria">María García</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Salario Base *</label>
            <input
              type="number"
              value={calculateData.base_salary}
              onChange={(e) => setCalculateData({ ...calculateData, base_salary: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
            />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModal}
        onClose={() => setIsDetailModal(false)}
        title="Detalle de Liquidación"
        size="2xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsDetailModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cerrar
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium flex items-center gap-2 justify-center"
            >
              <Download size={18} />
              Exportar PDF
            </button>
            {selectedLiquidation?.status === 'draft' && (
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Enviar para Aprobación
              </button>
            )}
          </div>
        }
      >
        {mockLiquidationDetail && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Score Final</p>
                <p className="text-2xl font-bold text-blue-900">{mockLiquidationDetail.final_score}%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Salario Base</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(mockLiquidationDetail.base_salary)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">Prima Total</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(mockLiquidationDetail.premium)}</p>
              </div>
            </div>

            {/* Llaves */}
            <div className="space-y-4">
              {mockLiquidationDetail.llaves.map((llave) => (
                <div key={llave.code} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{llave.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{llave.code}</p>
                    </div>
                    <span className="text-lg font-bold text-primary-600">{llave.weight}%</span>
                  </div>

                  <div className="space-y-2">
                    {llave.kpis.map((kpi, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 text-sm">
                        <div className="col-span-2">{kpi.name}</div>
                        <div className="text-right">{formatCurrency(kpi.meta)}</div>
                        <div className="text-right font-medium">{kpi.cumplimiento}%</div>
                        <div className="text-right font-bold text-green-600">{kpi.score}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Subtotal LLAVE</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {llave.kpis.reduce((sum, kpi) => sum + kpi.score, 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}

export default Liquidations
