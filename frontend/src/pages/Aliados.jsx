import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Upload, Download, RefreshCw, Plus, Calendar, History, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import Table from '../components/Table'
import StatusBadge from '../components/StatusBadge'
import { aliadosAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

const SOCIEDADES = ['VANTI', 'GNCB', 'GOR', 'GNC']

const Aliados = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [loading, setLoading] = useState(true)
  const [aliados, setAliados] = useState([])
  const [pagination, setPagination] = useState({ page: 1, per_page: 50, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ sociedad: '', search: '', tipo_aliado: '' })
  const [pendingSearch, setPendingSearch] = useState('')
  const [showResolve, setShowResolve] = useState(false)
  const [resolveForm, setResolveForm] = useState({ llave: '', fecha: new Date().toISOString().slice(0, 10) })
  const [resolveResult, setResolveResult] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importStartDate, setImportStartDate] = useState(new Date().toISOString().slice(0, 10))

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, per_page: pagination.per_page, ...filters }
      Object.keys(params).forEach((k) => params[k] === '' && delete params[k])
      const res = await aliadosAPI.list(params)
      const d = res.data?.data || {}
      setAliados(d.aliados || [])
      setPagination(d.pagination || { page: 1, per_page: 50, total: 0, pages: 1 })
    } catch (e) {
      toast.error('Error cargando aliados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [filters.sociedad, filters.tipo_aliado])

  const onSearch = (e) => {
    e.preventDefault()
    setFilters({ ...filters, search: pendingSearch })
    setTimeout(() => load(1), 0)
  }

  const handleResolve = async () => {
    try {
      const res = await aliadosAPI.resolve({ llave: resolveForm.llave, fecha: resolveForm.fecha })
      setResolveResult(res.data?.data)
    } catch {
      toast.error('Error en resolver')
    }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    if (!importFile) return toast.error('Selecciona un archivo')
    const fd = new FormData()
    fd.append('file', importFile)
    fd.append('start_date', importStartDate)
    fd.append('sheet', 'Base')
    try {
      const res = await aliadosAPI.importFile(fd)
      toast.success(`Importado: ${JSON.stringify(res.data?.data)}`)
      setShowImport(false)
      setImportFile(null)
      load(1)
    } catch (err) {
      toast.error('Error en importación: ' + (err.response?.data?.error || ''))
    }
  }

  const handleExport = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await aliadosAPI.exportXlsx(today)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `aliados_${today}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al exportar')
    }
  }

  const columns = useMemo(() => [
    { key: 'nombre_firma', label: 'Aliado', sortable: true, render: (v, row) => (
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{v}</div>
        <div className="text-xs text-gray-500">{row.nit} • {row.bp_vantilisto}</div>
      </div>
    ) },
    { key: 'sociedad', label: 'Sociedad', sortable: true, render: (v) => (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{v}</span>
    ) },
    { key: 'tipo_aliado', label: 'Tipo', sortable: true },
    { key: 'supervisor_name', label: 'Supervisor', sortable: true },
    { key: 'current_assignment', label: 'Responsable hoy', render: (v) => (
      v ? (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">{v.professional_name}</div>
          <div className="text-xs text-gray-500">desde {v.start_date}</div>
        </div>
      ) : <span className="text-xs text-red-600">Sin asignación</span>
    ) },
    { key: 'current_status', label: 'Estado', render: (_, row) => (
      <StatusBadge status={row.current_assignment?.status || 'sin_asignar'} />
    ) },
    { key: 'actions', label: 'Acciones', render: (_, row) => (
      <button
        onClick={() => navigate(`/aliados/${row.id}/historia`)}
        className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
      >
        <History size={14} /> Historia
      </button>
    ) },
  ], [navigate])

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Aliados</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Maestro de firmas/aliados con historia temporal de Responsable de Oficina Central.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowResolve(true)} className="btn-secondary flex items-center gap-2">
              <Calendar size={16} /> Resolver responsable
            </button>
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
              <Download size={16} /> Exportar
            </button>
            {isAdmin && (
              <button onClick={() => setShowImport(true)} className="btn-primary flex items-center gap-2">
                <Upload size={16} /> Importar diccionario
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <form onSubmit={onSearch} className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[260px]">
              <label className="text-xs text-gray-500 dark:text-gray-400">Búsqueda libre</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  placeholder="NIT, BP, nombre, llave..."
                  className="pl-9 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Sociedad</label>
              <select
                value={filters.sociedad}
                onChange={(e) => setFilters({ ...filters, sociedad: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas</option>
                {SOCIEDADES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Filter size={16} /> Filtrar
            </button>
            <button type="button" onClick={() => { setPendingSearch(''); setFilters({ sociedad: '', search: '', tipo_aliado: '' }) }} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={16} /> Limpiar
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            {pagination.total} aliados — página {pagination.page} de {pagination.pages}
          </div>
          <Table columns={columns} data={aliados} loading={loading} />
          <div className="flex justify-between items-center p-3 border-t border-gray-200 dark:border-gray-700">
            <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="btn-secondary disabled:opacity-50">
              ← Anterior
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">{pagination.page} / {pagination.pages}</span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)} className="btn-secondary disabled:opacity-50">
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={showResolve} onClose={() => { setShowResolve(false); setResolveResult(null) }} title="Resolver responsable por (llave, fecha)">
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Consulta puntual: dado un aliado y una fecha, ¿quién era el responsable de oficina central?
          </p>
          <div>
            <label className="text-xs text-gray-500">Llave (NOMBRE_FIRMA + sociedad)</label>
            <input
              type="text"
              value={resolveForm.llave}
              onChange={(e) => setResolveForm({ ...resolveForm, llave: e.target.value })}
              placeholder="ej. 4 EN MOVIMIENTO SASVANTI"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Fecha de venta</label>
            <input
              type="date"
              value={resolveForm.fecha}
              onChange={(e) => setResolveForm({ ...resolveForm, fecha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button onClick={handleResolve} className="btn-primary w-full">Resolver</button>
          {resolveResult && (
            <div className={`p-3 rounded text-sm ${resolveResult.resolved ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'}`}>
              {resolveResult.resolved ? (
                <div>
                  <div><strong>Aliado:</strong> {resolveResult.aliado.nombre_firma} ({resolveResult.aliado.sociedad})</div>
                  <div><strong>Responsable:</strong> {resolveResult.assignment.professional_name}</div>
                  <div><strong>Estado:</strong> {resolveResult.assignment.status}</div>
                  <div><strong>Vigencia:</strong> {resolveResult.assignment.start_date} → {resolveResult.assignment.end_date || 'indefinido'}</div>
                </div>
              ) : (
                <div>{resolveResult.message}</div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Importar diccionario_aliados.xlsx">
        <form onSubmit={handleImport} className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sube un archivo con la hoja <code>Base</code> y columnas: NIT, BP VantiListo, Tipo_aliado,
            NOMBRE_FIRMA, sociedad, Responsable oficina central, Responsable Filial, llave, supervisor.
          </p>
          <div>
            <label className="text-xs text-gray-500">Archivo (.xlsx)</label>
            <input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} className="block w-full text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Fecha de inicio para nuevas asignaciones</label>
            <input type="date" value={importStartDate} onChange={(e) => setImportStartDate(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <button type="submit" className="btn-primary w-full">Importar</button>
        </form>
      </Modal>
    </Layout>
  )
}

export default Aliados
