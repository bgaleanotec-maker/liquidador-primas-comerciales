import React, { useState } from 'react'
import { Upload, Download, Settings, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { dataAPI } from '../api'
import toast from 'react-hot-toast'

const DataEntry = () => {
  const [activeTab, setActiveTab] = useState('csv')
  const [period, setPeriod] = useState('Junio 2024')
  const [buCode, setBuCode] = useState('VL')
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [isConfigModal, setIsConfigModal] = useState(false)

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file) => {
    try {
      setUploadStatus({ loading: true, message: 'Cargando archivo...' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('period', period)
      formData.append('bu_code', buCode)

      const response = await dataAPI.uploadCSV(formData)

      setUploadStatus({
        loading: false,
        success: true,
        rows: response.rows_imported,
        errors: response.errors,
        warnings: response.warnings
      })

      toast.success('Archivo cargado exitosamente')
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
      const response = await dataAPI.downloadTemplate(buCode)
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `template_${buCode}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)
      toast.success('Plantilla descargada')
    } catch (error) {
      toast.error('Error al descargar plantilla')
    }
  }

  const manualDataColumns = [
    { key: 'kpi_name', label: 'KPI' },
    { key: 'meta', label: 'Meta' },
    { key: 'resultado', label: 'Resultado' },
    {
      key: 'cumplimiento',
      label: 'Cumplimiento %',
      render: (value) => {
        let color = 'text-green-600'
        if (value < 60) color = 'text-red-600'
        else if (value < 80) color = 'text-yellow-600'
        return <span className={`font-medium ${color}`}>{value}%</span>
      }
    },
    { key: 'source', label: 'Fuente' },
    { key: 'notes', label: 'Notas' }
  ]

  const mockManualData = [
    {
      id: 1,
      kpi_name: 'Ventas Directas',
      meta: 100000000,
      resultado: 92000000,
      cumplimiento: 92,
      source: 'SAP',
      notes: 'En línea'
    },
    {
      id: 2,
      kpi_name: 'Retención',
      meta: 95,
      resultado: 88,
      cumplimiento: 92.6,
      source: 'Manual',
      notes: 'Última actualización'
    }
  ]

  const dataSources = [
    {
      id: 1,
      name: 'CSV Upload',
      type: 'csv',
      bu: 'Todas',
      status: 'active',
      last_sync: '2024-06-15 10:30',
      phase: 1
    },
    {
      id: 2,
      name: 'BigQuery Integration',
      type: 'bigquery',
      bu: 'Todas',
      status: 'inactive',
      last_sync: '-',
      phase: 2
    }
  ]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ingesta de Datos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Carga y gestiona datos de KPIs</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'csv', label: 'Carga CSV/Excel' },
              { id: 'manual', label: 'Entrada Manual' },
              { id: 'auto', label: 'Fuentes Automáticas' }
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
            {/* CSV Upload Tab */}
            {activeTab === 'csv' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
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
                      value={buCode}
                      onChange={(e) => setBuCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="VL">VL - Ventas Línea</option>
                      <option value="VM">VM - Ventas Mayorista</option>
                      <option value="NE">NE - Negocios Especiales</option>
                    </select>
                  </div>
                </div>

                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    dragActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">Arrastra tu archivo aquí</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">o haz clic para seleccionar</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">CSV o XLSX (máx. 10MB)</p>
                  <input
                    type="file"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700">
                    Seleccionar archivo
                  </label>
                </div>

                {uploadStatus && (
                  <div className={`p-4 rounded-lg border ${uploadStatus.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    {uploadStatus.loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        <p className="text-gray-700">{uploadStatus.message}</p>
                      </div>
                    ) : (
                      <div>
                        <p className={uploadStatus.success ? 'text-green-900 font-medium' : 'text-red-900 font-medium'}>
                          {uploadStatus.message}
                        </p>
                        {uploadStatus.success && (
                          <div className="mt-2 text-sm text-green-800">
                            <p>Filas importadas: {uploadStatus.rows}</p>
                            {uploadStatus.warnings > 0 && <p>Advertencias: {uploadStatus.warnings}</p>}
                            {uploadStatus.errors > 0 && <p>Errores: {uploadStatus.errors}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium"
                >
                  <Download size={18} />
                  Descargar Plantilla
                </button>
              </div>
            )}

            {/* Manual Entry Tab */}
            {activeTab === 'manual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>Junio 2024</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unidad de Negocio</label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>VL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Usuario</label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>Todos</option>
                    </select>
                  </div>
                </div>

                <Table columns={manualDataColumns} data={mockManualData} loading={false} />

                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                  Guardar Cambios
                </button>
              </div>
            )}

            {/* Automatic Sources Tab */}
            {activeTab === 'auto' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-gap-2">
                  <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Las fuentes automáticas permiten la integración con sistemas externos. Fase 1 (CSV) está disponible. Fase 2 (BigQuery) próximamente.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dataSources.map((source) => (
                    <div key={source.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{source.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{source.type.toUpperCase()}</p>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          source.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {source.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">Última sincronización: {source.last_sync}</p>

                      <div className="space-y-2 mb-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          source.phase === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          Fase {source.phase} {source.phase === 2 ? '(Próximamente)' : ''}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {source.status === 'active' && (
                          <button className="flex-1 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 font-medium text-sm">
                            Sincronizar Ahora
                          </button>
                        )}
                        <button
                          onClick={() => setIsConfigModal(true)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm flex items-center gap-2 justify-center"
                        >
                          <Settings size={16} />
                          Config
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Config Modal */}
      <Modal
        isOpen={isConfigModal}
        onClose={() => setIsConfigModal(false)}
        title="Configurar Fuente de Datos"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsConfigModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setIsConfigModal(false)
                toast.success('Configuración guardada')
              }}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">Configuración de BigQuery (Fase 2 - Próximamente)</p>
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Conectar con OAuth
            </button>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Se abrirá una ventana para autenticar con tu cuenta de Google Cloud</p>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default DataEntry
