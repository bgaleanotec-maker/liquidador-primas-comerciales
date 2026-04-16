import React, { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { variablesAPI, adminAPI } from '../api'
import { mockLlaves } from '../utils/mockData'
import toast from 'react-hot-toast'

const Variables = () => {
  const [buCode, setBuCode] = useState('VL')
  const [llaves, setLlaves] = useState(mockLlaves.VL)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [businesses, setBusinesses] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLlave, setEditingLlave] = useState(null)
  const [formData, setFormData] = useState({ code: '', name: '', weight: 0, source_type: 'automatico' })
  const [totalWeight, setTotalWeight] = useState(100)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await adminAPI.getBusinessUnits()
        setBusinesses(response)
      } catch (error) {
        setBusinesses([
          { code: 'VL', name: 'Ventas Línea' },
          { code: 'VM', name: 'Ventas Mayorista' },
          { code: 'NE', name: 'Negocios Especiales' },
          { code: 'SIC', name: 'SIC' },
          { code: 'SAT', name: 'Soluciones AT' },
          { code: 'COM', name: 'Comercial' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    calculateTotalWeight()
  }, [llaves])

  const calculateTotalWeight = () => {
    const total = llaves.reduce((sum, llave) => sum + (llave.weight || 0), 0)
    setTotalWeight(total)
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

  const handleAddLlave = () => {
    setEditingLlave(null)
    setFormData({ code: '', name: '', weight: 0, source_type: 'automatico' })
    setIsModalOpen(true)
  }

  const handleSaveLlave = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Por favor completa todos los campos')
      return
    }

    try {
      if (editingLlave) {
        await variablesAPI.updateLlave(editingLlave.id, formData)
        toast.success('Llave actualizada')
      } else {
        await variablesAPI.createLlave({ ...formData, bu_code: buCode })
        toast.success('Llave creada')
      }
      setIsModalOpen(false)
      setFormData({ code: '', name: '', weight: 0, source_type: 'automatico' })
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  const handleAutoNormalize = async () => {
    try {
      await variablesAPI.validateWeights(buCode)
      toast.success('Pesos normalizados correctamente')
    } catch (error) {
      toast.error('Error al normalizar pesos')
    }
  }

  const getSourceBadge = (source_type) => {
    const config = {
      automatico: { color: 'bg-green-100 text-green-800', label: '🟢 Automático' },
      semiautomatico: { color: 'bg-yellow-100 text-yellow-800', label: '🟡 Semi-automático' },
      manual: { color: 'bg-red-100 text-red-800', label: '🔴 Manual' }
    }
    const c = config[source_type] || config.manual
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>
  }

  const LlaveTreeNode = ({ llave, level = 0 }) => {
    const hasChildren = llave.children && llave.children.length > 0
    const isExpanded = expandedNodes.has(llave.id)

    return (
      <div key={llave.id} className={`ml-${level * 4}`}>
        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 mb-2">
          {hasChildren && (
            <button onClick={() => toggleExpanded(llave.id)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
          {!hasChildren && <div className="w-6"></div>}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-gray-900 dark:text-gray-200">{llave.code}</code>
              <span className="font-medium text-gray-900 dark:text-white">{llave.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getSourceBadge(llave.source_type)}
            <span className="font-semibold text-gray-900 dark:text-white min-w-12 text-right">{llave.weight}%</span>
            <button
              onClick={() => {
                setEditingLlave(llave)
                setFormData(llave)
                setIsModalOpen(true)
              }}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Editar
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-6 space-y-2">
            {llave.children.map((child) => (
              <LlaveTreeNode key={child.id} llave={child} level={level + 1} />
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gobernanza de Variables</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Administra las llaves y KPIs por unidad de negocio</p>
          </div>
          <button
            onClick={handleAddLlave}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Añadir Llave
          </button>
        </div>

        {/* BU Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Unidad de Negocio</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {businesses.map((bu) => (
              <button
                key={bu.code}
                onClick={() => setBuCode(bu.code)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  buCode === bu.code
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {bu.code}
              </button>
            ))}
          </div>
        </div>

        {/* Weight Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resumen de Pesos</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total de pesos asignados: {totalWeight}%</p>
            </div>
            {totalWeight === 100 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={24} />
                <span className="font-medium">Válido</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={24} />
                <span className="font-medium">Inválido ({totalWeight}%)</span>
              </div>
            )}
          </div>
          <button
            onClick={handleAutoNormalize}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium"
          >
            <Zap size={18} />
            Auto-normalizar pesos
          </button>
        </div>

        {/* LLAVE Tree */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estructura de Llaves - {buCode}</h3>
          <div className="space-y-2">
            {llaves.map((llave) => (
              <LlaveTreeNode key={llave.id} llave={llave} />
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLlave ? 'Editar Llave' : 'Crear Nueva Llave'}
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveLlave}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="CÓDIGO_LLAVE"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nombre de la Llave"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso (%)</label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="0"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Fuente</label>
            <select
              value={formData.source_type}
              onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="automatico">Automático</option>
              <option value="semiautomatico">Semi-automático</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default Variables
