import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { approvalsAPI } from '../api'
import { formatCurrency, formatDate } from '../utils/format'
import toast from 'react-hot-toast'

const Approvals = () => {
  const [activeTab, setActiveTab] = useState('pending')
  const [pending, setPending] = useState([
    {
      id: 1,
      user: 'Juan Pérez',
      bu: 'VL',
      period: 'Junio 2024',
      score: 92,
      premium: 15000000,
      submitted_at: '2024-06-15'
    },
    {
      id: 2,
      user: 'María García',
      bu: 'VM',
      period: 'Junio 2024',
      score: 78,
      premium: 8500000,
      submitted_at: '2024-06-14'
    }
  ])
  const [history, setHistory] = useState([
    {
      id: 3,
      user: 'Carlos López',
      bu: 'NE',
      period: 'Mayo 2024',
      score: 85,
      premium: 12000000,
      decision: 'approved',
      approver: 'Ana Rodríguez',
      date: '2024-05-20',
      comments: 'Aprobado'
    }
  ])
  const [selectedLiquidation, setSelectedLiquidation] = useState(null)
  const [isDetailModal, setIsDetailModal] = useState(false)
  const [isDecisionModal, setIsDecisionModal] = useState(false)
  const [decision, setDecision] = useState('approve')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)

  const pendingColumns = [
    { key: 'user', label: 'Usuario', sortable: true },
    { key: 'bu', label: 'UB', sortable: true },
    { key: 'period', label: 'Período', sortable: true },
    {
      key: 'score',
      label: 'Score',
      render: (value) => <span className="font-semibold">{value}%</span>
    },
    {
      key: 'premium',
      label: 'Prima',
      render: (value) => <span className="font-semibold">{formatCurrency(value)}</span>
    },
    {
      key: 'submitted_at',
      label: 'Enviado',
      render: (value) => formatDate(value)
    }
  ]

  const historyColumns = [
    { key: 'user', label: 'Usuario', sortable: true },
    { key: 'bu', label: 'UB', sortable: true },
    { key: 'period', label: 'Período', sortable: true },
    {
      key: 'decision',
      label: 'Decisión',
      render: (value) => <StatusBadge status={value} />
    },
    { key: 'approver', label: 'Aprobador' },
    {
      key: 'date',
      label: 'Fecha',
      render: (value) => formatDate(value)
    }
  ]

  const handleViewDetail = (liquidation) => {
    setSelectedLiquidation(liquidation)
    setIsDetailModal(true)
  }

  const handleOpenDecision = (liquidation) => {
    setSelectedLiquidation(liquidation)
    setDecision('approve')
    setComments('')
    setIsDecisionModal(true)
  }

  const handleSubmitDecision = async () => {
    if (!comments.trim()) {
      toast.error('Por favor ingresa comentarios')
      return
    }

    try {
      setLoading(true)
      if (decision === 'approve') {
        await approvalsAPI.approve(selectedLiquidation.id, comments)
        toast.success('Liquidación aprobada')
        setPending(pending.filter((l) => l.id !== selectedLiquidation.id))
      } else {
        await approvalsAPI.reject(selectedLiquidation.id, comments)
        toast.success('Liquidación rechazada')
        setPending(pending.filter((l) => l.id !== selectedLiquidation.id))
      }
      setIsDecisionModal(false)
    } catch (error) {
      toast.error('Error al procesar la decisión')
    } finally {
      setLoading(false)
    }
  }

  const mockLiquidationDetail = {
    id: 1,
    user: 'Juan Pérez',
    bu: 'VL',
    period: 'Junio 2024',
    email: 'juan@example.com',
    submitted_at: '2024-06-15 10:30',
    llaves: [
      {
        name: 'Ventas Directas',
        weight: 30,
        score: 28.5,
        cumplimiento: 95
      },
      {
        name: 'Satisfacción',
        weight: 25,
        score: 24.4,
        cumplimiento: 97.5
      },
      {
        name: 'Retención',
        weight: 25,
        score: 24.5,
        cumplimiento: 97.9
      },
      {
        name: 'Calidad',
        weight: 20,
        score: 19.3,
        cumplimiento: 96.7
      }
    ],
    final_score: 96.7,
    premium: 15000000
  }

  return (
    <Layout pendingCount={pending.length}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Aprobaciones de Liquidaciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Revisa y aprueba liquidaciones pendientes</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'pending', label: `Pendientes (${pending.length})` },
              { id: 'history', label: `Historial (${history.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'pending' && (
              <>
                {pending.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">No hay liquidaciones pendientes</p>
                    <p className="text-gray-600 dark:text-gray-400">Todas las liquidaciones han sido procesadas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pending.map((liquidation) => (
                      <div key={liquidation.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{liquidation.user}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>UB: {liquidation.bu}</span>
                              <span>Período: {liquidation.period}</span>
                              <span>Score: <span className="font-medium text-gray-900 dark:text-white">{liquidation.score}%</span></span>
                              <span>Prima: <span className="font-medium text-gray-900">{formatCurrency(liquidation.premium)}</span></span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDetail(liquidation)}
                              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm"
                            >
                              <Eye size={16} />
                              Ver
                            </button>
                            <button
                              onClick={() => handleOpenDecision(liquidation)}
                              className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
                            >
                              <CheckCircle size={16} />
                              Decidir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <Table columns={historyColumns} data={history} loading={loading} />
            )}
          </div>
        </div>
      </div>

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
              onClick={() => {
                setIsDetailModal(false)
                handleOpenDecision(selectedLiquidation)
              }}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Tomar Decisión
            </button>
          </div>
        }
      >
        {mockLiquidationDetail && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Usuario</p>
                  <p className="text-lg font-semibold text-gray-900">{mockLiquidationDetail.user}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{mockLiquidationDetail.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Unidad de Negocio</p>
                  <p className="text-lg font-semibold text-gray-900">{mockLiquidationDetail.bu}</p>
                </div>
              </div>
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Score Final</p>
                <p className="text-2xl font-bold text-blue-900">{mockLiquidationDetail.final_score}%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Prima Total</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(mockLiquidationDetail.premium)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">Período</p>
                <p className="text-lg font-bold text-purple-900">{mockLiquidationDetail.period}</p>
              </div>
            </div>

            {/* Llaves Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Desglose por Llave</h4>
              {mockLiquidationDetail.llaves.map((llave, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{llave.name}</p>
                    <p className="text-xs text-gray-600">{llave.cumplimiento}% cumplimiento</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{llave.score}</p>
                    <p className="text-xs text-gray-600">{llave.weight}% peso</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Decision Modal */}
      <Modal
        isOpen={isDecisionModal}
        onClose={() => setIsDecisionModal(false)}
        title="Tomar Decisión"
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsDecisionModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitDecision}
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${
                decision === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {decision === 'approve' ? 'Aprobar' : 'Rechazar'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Decisión</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="approve"
                  checked={decision === 'approve'}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Aprobar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={decision === 'reject'}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Rechazar</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comentarios *</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ingresa tus comentarios..."
            />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default Approvals
