import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Upload, Download, RefreshCw, Calendar, History, Filter,
  Users, ChevronLeft, ChevronRight, AlertCircle, FileSpreadsheet,
  CheckCircle2, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
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
  const [pagination, setPagination] = useState({ page: 1, per_page: 25, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ sociedad: '', search: '', tipo_aliado: '' })
  const [pendingSearch, setPendingSearch] = useState('')

  const [showResolve, setShowResolve] = useState(false)
  const [resolveForm, setResolveForm] = useState({ llave: '', fecha: new Date().toISOString().slice(0, 10) })
  const [resolveResult, setResolveResult] = useState(null)
  const [resolving, setResolving] = useState(false)

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
      setPagination(d.pagination || { page: 1, per_page: 25, total: 0, pages: 1 })
    } catch {
      toast.error('Error cargando aliados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [filters.sociedad, filters.tipo_aliado, filters.search])

  const onSearch = (e) => {
    e.preventDefault()
    setFilters({ ...filters, search: pendingSearch })
  }

  const handleResolve = async () => {
    if (!resolveForm.llave) return toast.error('Ingresa una llave')
    setResolving(true)
    try {
      const res = await aliadosAPI.resolve({ llave: resolveForm.llave, fecha: resolveForm.fecha })
      setResolveResult(res.data?.data)
    } catch {
      toast.error('Error en resolver')
    } finally {
      setResolving(false)
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
      const d = res.data?.data
      toast.success(`${d.created_aliados} nuevos · ${d.updated_aliados} actualizados · ${d.created_assignments} asignaciones`)
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
      a.href = url; a.download = `aliados_${today}.xlsx`; a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al exportar')
    }
  }

  return (
    <Layout>
      <div className="px-8 py-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
              Beta · Trazabilidad temporal
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Aliados</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm max-w-2xl">
              Maestro de firmas con historia de Responsable de Oficina Central. Cada venta puede liquidarse contra quien era responsable en su fecha exacta.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowResolve(true)} className="btn-secondary">
              <Calendar size={15} /> Resolver responsable
            </button>
            <button onClick={handleExport} className="btn-secondary">
              <Download size={15} /> Exportar
            </button>
            {isAdmin && (
              <button onClick={() => setShowImport(true)} className="btn-primary">
                <Upload size={15} /> Importar diccionario
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={onSearch} className="card p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[260px]">
            <label className="label">Búsqueda libre</label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder="NIT, BP, nombre, llave…"
                className="input-base pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-44">
            <label className="label">Sociedad</label>
            <select
              value={filters.sociedad}
              onChange={(e) => setFilters({ ...filters, sociedad: e.target.value })}
              className="input-base"
            >
              <option value="">Todas</option>
              {SOCIEDADES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary"><Filter size={15} /> Filtrar</button>
            <button type="button" onClick={() => { setPendingSearch(''); setFilters({ sociedad: '', search: '', tipo_aliado: '' }) }} className="btn-secondary">
              <RefreshCw size={15} /> Limpiar
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {pagination.total.toLocaleString('es-CO')} aliados
              </span>
              {filters.search && <span className="badge-blue">"{filters.search}"</span>}
              {filters.sociedad && <span className="badge-violet">{filters.sociedad}</span>}
            </div>
            <span className="text-xs text-slate-500">Página {pagination.page} de {pagination.pages}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Aliado</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sociedad</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Supervisor</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Responsable hoy</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Historia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400">Cargando aliados…</td></tr>
                ) : aliados.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400">Sin resultados</td></tr>
                ) : aliados.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-white">{row.nombre_firma}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{row.nit || '—'} · BP {row.bp_vantilisto || '—'}</div>
                    </td>
                    <td className="px-5 py-3.5"><span className="badge-violet">{row.sociedad}</span></td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{row.tipo_aliado}</td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{row.supervisor_name || '—'}</td>
                    <td className="px-5 py-3.5">
                      {row.current_assignment ? (
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{row.current_assignment.professional_name}</div>
                          <div className="text-[11px] text-slate-500">desde {row.current_assignment.start_date}</div>
                        </div>
                      ) : <span className="text-xs text-rose-600 italic">Sin asignar</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={row.current_assignment?.status || 'sin_asignar'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/aliados/${row.id}/historia`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      >
                        <History size={13} /> Ver historia
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-700">
            <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="btn-secondary">
              <ChevronLeft size={15} /> Anterior
            </button>
            <span className="text-sm text-slate-500">{pagination.page} / {pagination.pages}</span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)} className="btn-secondary">
              Siguiente <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Resolver Modal */}
      <Modal
        isOpen={showResolve}
        onClose={() => { setShowResolve(false); setResolveResult(null) }}
        title="Resolver responsable"
        subtitle="Dado un aliado y una fecha, ¿quién era responsable?"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="label">Llave (NOMBRE_FIRMA + sociedad)</label>
              <input
                type="text"
                value={resolveForm.llave}
                onChange={(e) => setResolveForm({ ...resolveForm, llave: e.target.value })}
                placeholder="ej. 4 EN MOVIMIENTO SASVANTI"
                className="input-base"
              />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                value={resolveForm.fecha}
                onChange={(e) => setResolveForm({ ...resolveForm, fecha: e.target.value })}
                className="input-base"
              />
            </div>
          </div>
          <button onClick={handleResolve} disabled={resolving} className="btn-primary w-full">
            {resolving ? 'Buscando…' : 'Resolver'}
          </button>
          {resolveResult && (
            <div className={`rounded-xl p-4 border ${resolveResult.resolved
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-start gap-3">
                {resolveResult.resolved
                  ? <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={20} />
                  : <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={20} />}
                <div className="flex-1 text-sm">
                  {resolveResult.resolved ? (
                    <div className="space-y-2">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {resolveResult.aliado.nombre_firma}
                        <span className="ml-2 badge-violet">{resolveResult.aliado.sociedad}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-slate-500">Responsable:</span> <span className="font-medium text-slate-900 dark:text-white">{resolveResult.assignment.professional_name}</span></div>
                        <div><span className="text-slate-500">Estado:</span> <StatusBadge status={resolveResult.assignment.status} /></div>
                        <div><span className="text-slate-500">Vigente desde:</span> <span className="font-medium">{resolveResult.assignment.start_date}</span></div>
                        <div><span className="text-slate-500">Hasta:</span> <span className="font-medium">{resolveResult.assignment.end_date || 'indefinido'}</span></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-amber-800 dark:text-amber-200">{resolveResult.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Importar diccionario"
        subtitle="Sube un Excel con la hoja Base del diccionario_aliados"
        size="lg"
      >
        <form onSubmit={handleImport} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Columnas esperadas:</p>
            <code className="text-[11px]">NIT · BP VantiListo · Tipo_aliado · NOMBRE_FIRMA · sociedad · Responsable oficina central · Responsable Filial · llave · supervisor</code>
          </div>
          <div>
            <label className="label">Archivo Excel (.xlsx)</label>
            <label className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-primary-400 dark:hover:border-primary-600 cursor-pointer transition-all">
              <FileSpreadsheet size={28} className="text-slate-400 mb-2" />
              {importFile ? (
                <span className="text-sm font-medium text-slate-900 dark:text-white">{importFile.name}</span>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Click para seleccionar archivo</span>
                  <span className="text-xs text-slate-500 mt-0.5">o arrastra aquí</span>
                </>
              )}
              <input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} className="hidden" />
            </label>
          </div>
          <div>
            <label className="label">Fecha de inicio para nuevas asignaciones</label>
            <input type="date" value={importStartDate} onChange={(e) => setImportStartDate(e.target.value)} className="input-base" />
          </div>
          <button type="submit" className="btn-primary w-full">Importar diccionario</button>
        </form>
      </Modal>
    </Layout>
  )
}

export default Aliados
