import React, { useState, useEffect } from 'react'
import { Store, Users, Calendar, Upload, Download, Plus, Edit2, Search, FileSpreadsheet, ShoppingBag } from 'lucide-react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Modal from '../components/Modal'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import { salesAPI, adminAPI } from '../api'
import toast from 'react-hot-toast'

const Sales = () => {
  const [activeTab, setActiveTab] = useState('ventas')
  const [loading, setLoading] = useState(false)
  const [businesses, setBusinesses] = useState([])
  const [periods, setPeriods] = useState([])

  // Filters
  const [selectedBU, setSelectedBU] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')

  // Sales tab state
  const [sales, setSales] = useState([])
  const [salesSummary, setSalesSummary] = useState({})
  const [isUploadModal, setIsUploadModal] = useState(false)
  const [isManualModal, setIsManualModal] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [saleForm, setSaleForm] = useState({
    point_of_sale_id: '', professional_id: '', product: '', client_name: '', sale_value: '', sale_date: ''
  })

  // Points of Sale tab state
  const [pointsOfSale, setPointsOfSale] = useState([])
  const [isPdvModal, setIsPdvModal] = useState(false)
  const [editingPdv, setEditingPdv] = useState(null)
  const [pdvForm, setPdvForm] = useState({
    code: '', name: '', address: '', city: '', business_unit_id: '', is_active: true
  })

  // Professionals tab state
  const [professionals, setProfessionals] = useState([])
  const [isProModal, setIsProModal] = useState(false)
  const [editingPro, setEditingPro] = useState(null)
  const [proForm, setProForm] = useState({
    code: '', name: '', email: '', status: 'active', business_unit_id: ''
  })

  // Assignments tab state
  const [assignments, setAssignments] = useState([])
  const [isAssignModal, setIsAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({
    professional_id: '', point_of_sale_id: '', period_id: '', start_date: '', end_date: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'ventas') fetchSales()
    if (activeTab === 'pdv') fetchPointsOfSale()
    if (activeTab === 'profesionales') fetchProfessionals()
    if (activeTab === 'asignaciones') fetchAssignments()
  }, [activeTab, selectedBU, selectedPeriod])

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

  const fetchSales = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (selectedBU) filters.business_unit_id = selectedBU
      if (selectedPeriod) filters.period_id = selectedPeriod
      const [salesRes, summaryRes] = await Promise.all([
        salesAPI.getSales(filters),
        salesAPI.getSalesSummary(filters)
      ])
      setSales(salesRes?.data?.data || salesRes?.data || [])
      setSalesSummary(summaryRes?.data?.data || summaryRes?.data || {})
    } catch (error) {
      setSales([])
      setSalesSummary({ total_count: 0, total_value: 0, by_status: {} })
    } finally {
      setLoading(false)
    }
  }

  const fetchPointsOfSale = async () => {
    try {
      setLoading(true)
      const res = await salesAPI.getPointsOfSale(selectedBU || undefined)
      setPointsOfSale(res?.data?.data || res?.data || [])
    } catch (error) {
      setPointsOfSale([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (selectedBU) filters.business_unit_id = selectedBU
      const res = await salesAPI.getProfessionals(filters)
      setProfessionals(res?.data?.data || res?.data || [])
    } catch (error) {
      setProfessionals([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (selectedPeriod) filters.period_id = selectedPeriod
      if (selectedBU) filters.business_unit_id = selectedBU
      const res = await salesAPI.getAssignments(filters)
      setAssignments(res?.data?.data || res?.data || [])
    } catch (error) {
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  // CSV Upload
  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast.error('Selecciona un archivo')
      return
    }
    try {
      setUploadStatus({ loading: true, message: 'Cargando archivo...' })
      const formData = new FormData()
      formData.append('file', uploadFile)
      if (selectedBU) formData.append('business_unit_id', selectedBU)
      if (selectedPeriod) formData.append('period_id', selectedPeriod)
      const response = await salesAPI.uploadSalesCSV(formData)
      const data = response?.data?.data || response?.data || {}
      setUploadStatus({
        loading: false,
        success: true,
        message: `${data.rows_imported || 0} registros importados`,
        rows: data.rows_imported,
        errors: data.errors
      })
      toast.success('Archivo cargado exitosamente')
      fetchSales()
    } catch (error) {
      setUploadStatus({
        loading: false,
        success: false,
        message: error.response?.data?.error || 'Error al cargar el archivo'
      })
      toast.error('Error al cargar el archivo')
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const buCode = businesses.find(b => String(b.id) === String(selectedBU))?.code || 'VL'
      const response = await salesAPI.getSalesTemplate(buCode)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ventas_template_${buCode}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)
      toast.success('Plantilla descargada')
    } catch (error) {
      toast.error('Error al descargar plantilla')
    }
  }

  // Manual sale
  const handleSaveSale = async () => {
    if (!saleForm.product || !saleForm.sale_value) {
      toast.error('Completa los campos requeridos')
      return
    }
    try {
      await salesAPI.createSale({ ...saleForm, business_unit_id: selectedBU, period_id: selectedPeriod })
      toast.success('Venta registrada')
      setIsManualModal(false)
      setSaleForm({ point_of_sale_id: '', professional_id: '', product: '', client_name: '', sale_value: '', sale_date: '' })
      fetchSales()
    } catch (error) {
      toast.error('Error al registrar venta')
    }
  }

  // PdV CRUD
  const handleSavePdv = async () => {
    if (!pdvForm.code || !pdvForm.name) {
      toast.error('Completa los campos requeridos')
      return
    }
    try {
      if (editingPdv) {
        await salesAPI.updatePointOfSale(editingPdv.id, pdvForm)
        toast.success('Punto de venta actualizado')
      } else {
        await salesAPI.createPointOfSale(pdvForm)
        toast.success('Punto de venta creado')
      }
      setIsPdvModal(false)
      setEditingPdv(null)
      setPdvForm({ code: '', name: '', address: '', city: '', business_unit_id: '', is_active: true })
      fetchPointsOfSale()
    } catch (error) {
      toast.error('Error al guardar punto de venta')
    }
  }

  const handleTogglePdv = async (pdv) => {
    try {
      await salesAPI.updatePointOfSale(pdv.id, { is_active: !pdv.is_active })
      toast.success(pdv.is_active ? 'Punto de venta desactivado' : 'Punto de venta activado')
      fetchPointsOfSale()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  // Professional CRUD
  const handleSavePro = async () => {
    if (!proForm.code || !proForm.name) {
      toast.error('Completa los campos requeridos')
      return
    }
    try {
      if (editingPro) {
        await salesAPI.updateProfessional(editingPro.id, proForm)
        toast.success('Profesional actualizado')
      } else {
        await salesAPI.createProfessional(proForm)
        toast.success('Profesional creado')
      }
      setIsProModal(false)
      setEditingPro(null)
      setProForm({ code: '', name: '', email: '', status: 'active', business_unit_id: '' })
      fetchProfessionals()
    } catch (error) {
      toast.error('Error al guardar profesional')
    }
  }

  // Assignment CRUD
  const handleSaveAssignment = async () => {
    if (!assignForm.professional_id || !assignForm.point_of_sale_id || !assignForm.period_id) {
      toast.error('Completa los campos requeridos')
      return
    }
    try {
      await salesAPI.createAssignment(assignForm)
      toast.success('Asignacion creada')
      setIsAssignModal(false)
      setAssignForm({ professional_id: '', point_of_sale_id: '', period_id: '', start_date: '', end_date: '' })
      fetchAssignments()
    } catch (error) {
      toast.error('Error al crear asignacion')
    }
  }

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)
  }

  const getProStatusBadge = (status) => {
    const config = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activo' },
      vacation: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Vacaciones' },
      disability: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Incapacidad' },
      inactive: { bg: 'bg-red-100', text: 'text-red-800', label: 'Inactivo' }
    }
    const c = config[status] || config.active
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
  }

  // Column definitions
  const salesColumns = [
    { key: 'sale_date', label: 'Fecha', sortable: true },
    { key: 'point_of_sale_name', label: 'Punto de Venta' },
    { key: 'professional_name', label: 'Profesional' },
    { key: 'product', label: 'Producto' },
    { key: 'client_name', label: 'Cliente' },
    { key: 'sale_value', label: 'Valor Venta', render: (val) => formatCurrency(val) },
    { key: 'status', label: 'Estado', render: (val) => <StatusBadge status={val} /> }
  ]

  const pdvColumns = [
    { key: 'code', label: 'Codigo' },
    { key: 'name', label: 'Nombre' },
    { key: 'address', label: 'Direccion' },
    { key: 'city', label: 'Ciudad' },
    { key: 'business_unit_name', label: 'Unidad de Negocio' },
    { key: 'is_active', label: 'Estado', render: (val) => <StatusBadge status={val ? 'active' : 'inactive'} /> }
  ]

  const proColumns = [
    { key: 'code', label: 'Codigo' },
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Estado', render: (val) => getProStatusBadge(val) },
    { key: 'business_unit_name', label: 'Unidad de Negocio' }
  ]

  const assignColumns = [
    { key: 'period_name', label: 'Periodo' },
    { key: 'professional_name', label: 'Profesional' },
    { key: 'point_of_sale_name', label: 'Punto de Venta' },
    { key: 'start_date', label: 'Fecha Inicio' },
    { key: 'end_date', label: 'Fecha Fin' },
    { key: 'status', label: 'Estado', render: (val) => <StatusBadge status={val || 'active'} /> }
  ]

  const tabs = [
    { id: 'ventas', label: 'Ventas', icon: ShoppingBag },
    { id: 'pdv', label: 'Puntos de Venta', icon: Store },
    { id: 'profesionales', label: 'Profesionales', icon: Users },
    { id: 'asignaciones', label: 'Asignaciones', icon: Calendar }
  ]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de Ventas</h1>
          <p className="text-gray-600 mt-1">Administra ventas, puntos de venta, profesionales y asignaciones</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de Negocio</label>
              <select
                value={selectedBU}
                onChange={(e) => setSelectedBU(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas</option>
                {businesses.map((bu) => (
                  <option key={bu.id || bu.code} value={bu.id || bu.code}>{bu.code} - {bu.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-6">
            {/* ===== VENTAS TAB ===== */}
            {activeTab === 'ventas' && (
              <div className="space-y-6">
                {/* Summary metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    icon={ShoppingBag}
                    label="Total Ventas"
                    value={salesSummary?.total_count || sales.length || 0}
                    color="blue"
                  />
                  <MetricCard
                    icon={Store}
                    label="Valor Total"
                    value={formatCurrency(salesSummary?.total_value || 0)}
                    color="green"
                  />
                  <MetricCard
                    icon={Users}
                    label="Profesionales Activos"
                    value={salesSummary?.active_professionals || '-'}
                    color="purple"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => { setUploadFile(null); setUploadStatus(null); setIsUploadModal(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    <Upload size={18} />
                    Cargar CSV
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    <Download size={18} />
                    Descargar Plantilla
                  </button>
                  <button
                    onClick={() => {
                      setSaleForm({ point_of_sale_id: '', professional_id: '', product: '', client_name: '', sale_value: '', sale_date: '' })
                      setIsManualModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Plus size={18} />
                    Registro Manual
                  </button>
                </div>

                <Table columns={salesColumns} data={sales} loading={loading} />
              </div>
            )}

            {/* ===== PUNTOS DE VENTA TAB ===== */}
            {activeTab === 'pdv' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingPdv(null)
                      setPdvForm({ code: '', name: '', address: '', city: '', business_unit_id: selectedBU, is_active: true })
                      setIsPdvModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    <Plus size={18} />
                    Nuevo Punto de Venta
                  </button>
                </div>

                <Table
                  columns={pdvColumns}
                  data={pointsOfSale}
                  loading={loading}
                  actions={(row) => (
                    <>
                      <button
                        onClick={() => {
                          setEditingPdv(row)
                          setPdvForm({
                            code: row.code, name: row.name, address: row.address || '',
                            city: row.city || '', business_unit_id: row.business_unit_id || '', is_active: row.is_active
                          })
                          setIsPdvModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleTogglePdv(row)}
                        className={`text-sm font-medium ${row.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {row.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </>
                  )}
                />
              </div>
            )}

            {/* ===== PROFESIONALES TAB ===== */}
            {activeTab === 'profesionales' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingPro(null)
                      setProForm({ code: '', name: '', email: '', status: 'active', business_unit_id: selectedBU })
                      setIsProModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    <Plus size={18} />
                    Nuevo Profesional
                  </button>
                </div>

                <Table
                  columns={proColumns}
                  data={professionals}
                  loading={loading}
                  actions={(row) => (
                    <>
                      <button
                        onClick={() => {
                          setEditingPro(row)
                          setProForm({
                            code: row.code, name: row.name, email: row.email || '',
                            status: row.status || 'active', business_unit_id: row.business_unit_id || ''
                          })
                          setIsProModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Editar
                      </button>
                    </>
                  )}
                />
              </div>
            )}

            {/* ===== ASIGNACIONES TAB ===== */}
            {activeTab === 'asignaciones' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Las asignaciones definen que profesional trabaja en cada punto de venta durante un periodo determinado.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setAssignForm({ professional_id: '', point_of_sale_id: '', period_id: selectedPeriod, start_date: '', end_date: '' })
                      setIsAssignModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    <Plus size={18} />
                    Nueva Asignacion
                  </button>
                </div>

                <Table columns={assignColumns} data={assignments} loading={loading} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Upload CSV Modal */}
      <Modal
        isOpen={isUploadModal}
        onClose={() => setIsUploadModal(false)}
        title="Cargar Ventas desde CSV"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsUploadModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleFileUpload}
              disabled={!uploadFile || uploadStatus?.loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              Cargar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
            <FileSpreadsheet size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              {uploadFile ? uploadFile.name : 'Selecciona un archivo CSV'}
            </p>
            <p className="text-xs text-gray-500 mb-3">CSV (max. 10MB)</p>
            <input
              type="file"
              onChange={(e) => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]) }}
              accept=".csv"
              className="hidden"
              id="sales-csv-input"
            />
            <label
              htmlFor="sales-csv-input"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 text-sm font-medium"
            >
              Seleccionar archivo
            </label>
          </div>

          {uploadStatus && (
            <div className={`p-4 rounded-lg border ${uploadStatus.success ? 'border-green-200 bg-green-50' : uploadStatus.loading ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
              {uploadStatus.loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <p className="text-gray-700 text-sm">{uploadStatus.message}</p>
                </div>
              ) : (
                <p className={`text-sm font-medium ${uploadStatus.success ? 'text-green-900' : 'text-red-900'}`}>
                  {uploadStatus.message}
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Manual Sale Modal */}
      <Modal
        isOpen={isManualModal}
        onClose={() => setIsManualModal(false)}
        title="Registrar Venta Manual"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsManualModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveSale}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Punto de Venta</label>
              <select
                value={saleForm.point_of_sale_id}
                onChange={(e) => setSaleForm({ ...saleForm, point_of_sale_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                {pointsOfSale.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
              <select
                value={saleForm.professional_id}
                onChange={(e) => setSaleForm({ ...saleForm, professional_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <input
              type="text"
              value={saleForm.product}
              onChange={(e) => setSaleForm({ ...saleForm, product: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nombre del producto"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input
                type="text"
                value={saleForm.client_name}
                onChange={(e) => setSaleForm({ ...saleForm, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Venta</label>
              <input
                type="number"
                value={saleForm.sale_value}
                onChange={(e) => setSaleForm({ ...saleForm, sale_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Venta</label>
            <input
              type="date"
              value={saleForm.sale_date}
              onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* Point of Sale Modal */}
      <Modal
        isOpen={isPdvModal}
        onClose={() => setIsPdvModal(false)}
        title={editingPdv ? 'Editar Punto de Venta' : 'Nuevo Punto de Venta'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsPdvModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSavePdv}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
              <input
                type="text"
                value={pdvForm.code}
                onChange={(e) => setPdvForm({ ...pdvForm, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="PDV001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={pdvForm.name}
                onChange={(e) => setPdvForm({ ...pdvForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nombre del punto de venta"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
            <input
              type="text"
              value={pdvForm.address}
              onChange={(e) => setPdvForm({ ...pdvForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Direccion"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                type="text"
                value={pdvForm.city}
                onChange={(e) => setPdvForm({ ...pdvForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ciudad"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Negocio</label>
              <select
                value={pdvForm.business_unit_id}
                onChange={(e) => setPdvForm({ ...pdvForm, business_unit_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                {businesses.map(bu => <option key={bu.id || bu.code} value={bu.id || bu.code}>{bu.code} - {bu.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Professional Modal */}
      <Modal
        isOpen={isProModal}
        onClose={() => setIsProModal(false)}
        title={editingPro ? 'Editar Profesional' : 'Nuevo Profesional'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsProModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSavePro}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
              <input
                type="text"
                value={proForm.code}
                onChange={(e) => setProForm({ ...proForm, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="PRO001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={proForm.name}
                onChange={(e) => setProForm({ ...proForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nombre completo"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={proForm.email}
                onChange={(e) => setProForm({ ...proForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={proForm.status}
                onChange={(e) => setProForm({ ...proForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Activo</option>
                <option value="vacation">Vacaciones</option>
                <option value="disability">Incapacidad</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Negocio</label>
            <select
              value={proForm.business_unit_id}
              onChange={(e) => setProForm({ ...proForm, business_unit_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccionar...</option>
              {businesses.map(bu => <option key={bu.id || bu.code} value={bu.id || bu.code}>{bu.code} - {bu.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={isAssignModal}
        onClose={() => setIsAssignModal(false)}
        title="Nueva Asignacion"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsAssignModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAssignment}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
            <select
              value={assignForm.period_id}
              onChange={(e) => setAssignForm({ ...assignForm, period_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccionar...</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
              <select
                value={assignForm.professional_id}
                onChange={(e) => setAssignForm({ ...assignForm, professional_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Punto de Venta</label>
              <select
                value={assignForm.point_of_sale_id}
                onChange={(e) => setAssignForm({ ...assignForm, point_of_sale_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                {pointsOfSale.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={assignForm.start_date}
                onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={assignForm.end_date}
                onChange={(e) => setAssignForm({ ...assignForm, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default Sales
