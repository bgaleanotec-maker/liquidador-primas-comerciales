import React, { useState, useEffect } from 'react'
import { Sliders, Save, AlertCircle, CheckCircle, Zap, History, ChevronDown, ChevronRight } from 'lucide-react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import { configAPI, adminAPI } from '../api'
import toast from 'react-hot-toast'

const ConfigLlaves = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [businesses, setBusinesses] = useState([])
  const [periods, setPeriods] = useState([])
  const [selectedBU, setSelectedBU] = useState('VL')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [llaves, setLlaves] = useState([])
  const [editedWeights, setEditedWeights] = useState({})
  const [totalWeight, setTotalWeight] = useState(0)
  const [history, setHistory] = useState([])
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedBU) fetchLlaveConfig()
  }, [selectedBU, selectedPeriod])

  useEffect(() => {
    recalculateTotal()
  }, [llaves, editedWeights])

  const fetchInitialData = async () => {
    try {
      const [buRes, periodRes] = await Promise.all([
        adminAPI.getBusinessUnits(),
        adminAPI.getPeriods()
      ])
      setBusinesses(buRes?.data?.data || buRes?.data || buRes || [])
      const pList = periodRes?.data?.data || periodRes?.data || periodRes || []
      setPeriods(pList)
      if (pList.length > 0) setSelectedPeriod(pList[0]?.id || '')
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

  const fetchLlaveConfig = async () => {
    try {
      setLoading(true)
      const res = await configAPI.getLlaveConfig(selectedBU, selectedPeriod || undefined)
      const data = res?.data?.data || res?.data || []
      setLlaves(data)
      setEditedWeights({})
    } catch (error) {
      setLlaves([])
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await configAPI.getConfigHistory()
      setHistory(res?.data?.data || res?.data || [])
    } catch (error) {
      setHistory([])
    }
  }

  const recalculateTotal = () => {
    const total = llaves.reduce((sum, llave) => {
      const weight = editedWeights[llave.id] !== undefined
        ? parseFloat(editedWeights[llave.id]) || 0
        : llave.weight || 0
      return sum + weight
    }, 0)
    setTotalWeight(Math.round(total * 100) / 100)
  }

  const handleWeightChange = (llaveId, value) => {
    setEditedWeights(prev => ({
      ...prev,
      [llaveId]: value
    }))
  }

  const handleAutoNormalize = () => {
    const topLevel = llaves.filter(l => !l.parent_id)
    if (topLevel.length === 0) return

    const currentTotal = topLevel.reduce((sum, l) => {
      const w = editedWeights[l.id] !== undefined ? parseFloat(editedWeights[l.id]) || 0 : l.weight || 0
      return sum + w
    }, 0)

    if (currentTotal === 0) return

    const factor = 100 / currentTotal
    const normalized = {}
    topLevel.forEach(l => {
      const currentW = editedWeights[l.id] !== undefined ? parseFloat(editedWeights[l.id]) || 0 : l.weight || 0
      normalized[l.id] = Math.round(currentW * factor * 100) / 100
    })
    setEditedWeights(prev => ({ ...prev, ...normalized }))
    toast.success('Pesos normalizados a 100%')
  }

  const handleSave = async () => {
    if (Object.keys(editedWeights).length === 0) {
      toast.error('No hay cambios para guardar')
      return
    }

    try {
      setSaving(true)
      const overrides = Object.entries(editedWeights).map(([llave_id, weight]) => ({
        llave_id: parseInt(llave_id),
        weight: parseFloat(weight)
      }))
      await configAPI.saveLlaveConfig({
        bu_code: selectedBU,
        period_id: selectedPeriod,
        overrides
      })
      toast.success('Configuracion guardada exitosamente')
      setEditedWeights({})
      fetchLlaveConfig()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar configuracion')
    } finally {
      setSaving(false)
    }
  }

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNodes(newExpanded)
  }

  const getEffectiveWeight = (llave) => {
    return editedWeights[llave.id] !== undefined
      ? parseFloat(editedWeights[llave.id]) || 0
      : llave.weight || 0
  }

  const isWeightChanged = (llave) => {
    return editedWeights[llave.id] !== undefined && parseFloat(editedWeights[llave.id]) !== llave.weight
  }

  const historyColumns = [
    { key: 'changed_at', label: 'Fecha' },
    { key: 'bu_code', label: 'BU' },
    { key: 'period_name', label: 'Periodo' },
    { key: 'llave_name', label: 'Llave' },
    { key: 'old_weight', label: 'Peso Anterior', render: (val) => `${val}%` },
    { key: 'new_weight', label: 'Peso Nuevo', render: (val) => `${val}%` },
    { key: 'changed_by', label: 'Usuario' }
  ]

  const LlaveConfigNode = ({ llave, level = 0 }) => {
    const hasChildren = llave.children && llave.children.length > 0
    const isExpanded = expandedNodes.has(llave.id)
    const weight = getEffectiveWeight(llave)
    const changed = isWeightChanged(llave)

    return (
      <div className={level > 0 ? 'ml-6' : ''}>
        <div className={`flex items-center gap-3 p-3 rounded-lg border mb-2 ${
          changed ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
        }`}>
          {hasChildren ? (
            <button onClick={() => toggleExpanded(llave.id)} className="text-gray-600 hover:text-gray-900">
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="w-6"></div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{llave.code}</code>
              <span className="font-medium text-gray-900">{llave.name}</span>
            </div>
            {llave.source_type && (
              <span className="text-xs text-gray-500 mt-1">{llave.source_type}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editedWeights[llave.id] !== undefined ? editedWeights[llave.id] : llave.weight || 0}
                onChange={(e) => handleWeightChange(llave.id, e.target.value)}
                className={`w-20 px-2 py-1 border rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  changed ? 'border-primary-400 bg-white' : 'border-gray-300'
                }`}
                min="0"
                max="100"
                step="0.1"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            {changed && (
              <span className="text-xs text-primary-600 font-medium">Modificado</span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {llave.children.map((child) => (
              <LlaveConfigNode key={child.id} llave={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuracion de LLAVEs</h1>
            <p className="text-gray-600 mt-1">Configura los pesos de las llaves y KPIs por unidad de negocio y periodo</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(editedWeights).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar Configuracion
              </>
            )}
          </button>
        </div>

        {/* Selectors */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de Negocio</label>
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {businesses.map((bu) => (
                  <button
                    key={bu.id || bu.code}
                    onClick={() => setSelectedBU(bu.code)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      selectedBU === bu.code
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {bu.code}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sin periodo (base)</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Weight Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resumen de Pesos</h3>
              <p className="text-gray-600 text-sm">Total de pesos asignados: {totalWeight}%</p>
            </div>
            <div className="flex items-center gap-4">
              {totalWeight === 100 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={24} />
                  <span className="font-medium">Valido</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={24} />
                  <span className="font-medium">Invalido ({totalWeight}%)</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                totalWeight === 100 ? 'bg-green-500' : totalWeight > 100 ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(totalWeight, 100)}%` }}
            ></div>
          </div>

          <button
            onClick={handleAutoNormalize}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            <Zap size={18} />
            Auto-normalizar pesos
          </button>
        </div>

        {/* LLAVE Tree */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estructura de Llaves - {selectedBU}
          </h3>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : llaves.length === 0 ? (
            <div className="text-center py-12">
              <Sliders size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No hay llaves configuradas para esta unidad de negocio</p>
            </div>
          ) : (
            <div className="space-y-2">
              {llaves.map((llave) => (
                <LlaveConfigNode key={llave.id} llave={llave} />
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory && history.length === 0) fetchHistory()
            }}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-2">
              <History size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Historial de Cambios</h3>
            </div>
            {showHistory ? <ChevronDown size={20} className="text-gray-600" /> : <ChevronRight size={20} className="text-gray-600" />}
          </button>

          {showHistory && (
            <div className="px-6 pb-6">
              <Table columns={historyColumns} data={history} loading={false} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ConfigLlaves
