import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit3, AlertTriangle, User, Calendar, FileText, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { aliadosAPI, adminAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

const STATUSES = [
  { value: 'active',     label: 'Activo' },
  { value: 'vacation',   label: 'Vacaciones' },
  { value: 'disability', label: 'Incapacidad' },
  { value: 'leave',      label: 'Permiso' },
  { value: 'reassigned', label: 'Reasignado' },
  { value: 'inactive',   label: 'Inactivo' },
]

const AliadoHistoria = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [aliado, setAliado] = useState(null)
  const [history, setHistory] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const empty = {
    professional_user_id: '', professional_name: '', responsable_filial: '',
    start_date: new Date().toISOString().slice(0, 10), end_date: '',
    status: 'active', notes: '',
  }
  const [form, setForm] = useState(empty)

  const isAdmin = ['admin', 'super_admin'].includes(user?.role)
  const canEdit = isAdmin || user?.role === 'supervisor'

  const load = async () => {
    setLoading(true)
    try {
      const [a, h] = await Promise.all([aliadosAPI.get(id), aliadosAPI.history(id)])
      setAliado(a.data?.data); setHistory(h.data?.data || [])
    } catch {
      toast.error('Error cargando aliado/historia')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    if (canEdit) {
      adminAPI.getUsers().then((r) => {
        const list = r.data?.data?.users || r.data?.data || []
        setUsers(list.filter((u) => u.role === 'professional'))
      }).catch(() => {})
    }
  }, [id])

  const startNew = () => { setEditing(null); setForm(empty); setShowAdd(true) }
  const startEdit = (h) => {
    setEditing(h)
    setForm({
      professional_user_id: h.professional_user_id || '',
      professional_name: h.professional_name || '',
      responsable_filial: h.responsable_filial || '',
      start_date: h.start_date,
      end_date: h.end_date || '',
      status: h.status,
      notes: h.notes || '',
    })
    setShowAdd(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      professional_user_id: form.professional_user_id || null,
      end_date: form.end_date || null,
    }
    try {
      if (editing) {
        await aliadosAPI.updateHistory(editing.id, payload)
        toast.success('Asignación actualizada')
      } else {
        await aliadosAPI.addHistory(id, payload)
        toast.success('Asignación creada')
      }
      setShowAdd(false); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar') }
  }

  const handleDelete = async (asgId) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return
    try {
      await aliadosAPI.deleteHistory(asgId)
      toast.success('Asignación eliminada'); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error al eliminar') }
  }

  const onSelectUser = (uid) => {
    const u = users.find((x) => String(x.id) === String(uid))
    setForm({ ...form, professional_user_id: uid, professional_name: u ? u.name : form.professional_name })
  }

  if (loading) return <Layout><div className="p-12 text-center text-slate-400">Cargando…</div></Layout>
  if (!aliado) return <Layout><div className="p-12 text-center text-slate-400">Aliado no encontrado</div></Layout>

  const current = aliado.current_assignment

  return (
    <Layout>
      <div className="px-8 py-6 space-y-6 max-w-[1400px] mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft size={15} /> Volver
        </button>

        {/* Hero card */}
        <div className="card p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary-500/20">
                <Building2 size={26} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="badge-violet">{aliado.sociedad}</span>
                  {aliado.tipo_aliado && <span className="badge-slate">{aliado.tipo_aliado}</span>}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{aliado.nombre_firma}</h1>
                <p className="text-xs text-slate-500 mt-1 font-mono">Llave: {aliado.llave}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                  <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500">NIT</p>
                    <p className="font-medium text-slate-900 dark:text-white">{aliado.nit || '—'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500">BP VantiListo</p>
                    <p className="font-medium text-slate-900 dark:text-white">{aliado.bp_vantilisto || '—'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500">Supervisor</p>
                    <p className="font-medium text-slate-900 dark:text-white">{aliado.supervisor_name || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
            {canEdit && (
              <button onClick={startNew} className="btn-primary">
                <Plus size={15} /> Nueva asignación
              </button>
            )}
          </div>

          {current && (
            <div className="mt-5 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <User size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Responsable vigente hoy</p>
                  <p className="text-base font-semibold text-emerald-900 dark:text-emerald-200">{current.professional_name}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Desde {current.start_date} {current.end_date ? `· hasta ${current.end_date}` : '· indefinido'}
                  </p>
                </div>
                <StatusBadge status={current.status} />
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Línea de tiempo</h2>
              <p className="text-xs text-slate-500 mt-0.5">{history.length} asignaciones registradas</p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Este aliado no tiene historia registrada todavía.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-4">
                {history.map((h) => (
                  <div key={h.id} className="relative flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 ${
                      h.is_open
                        ? 'bg-emerald-500 border-emerald-100 dark:border-emerald-900/40 ring-2 ring-emerald-300/40'
                        : 'bg-slate-300 dark:bg-slate-600 border-slate-100 dark:border-slate-800'
                    }`}>
                      <User size={16} className="text-white" />
                    </div>
                    <div className={`flex-1 rounded-xl p-4 border ${
                      h.is_open
                        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{h.professional_name}</h3>
                            <StatusBadge status={h.status} />
                            {h.is_open && <span className="badge-green">vigente</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1"><Calendar size={11} /> {h.start_date} → {h.end_date || 'indefinido'}</span>
                            {h.responsable_filial && <span>· Filial: {h.responsable_filial}</span>}
                          </div>
                          {h.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-start gap-1.5">
                              <FileText size={11} className="mt-0.5 shrink-0" /> {h.notes}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEdit(h)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg" title="Editar">
                              <Edit3 size={14} />
                            </button>
                            {isAdmin && (
                              <button onClick={() => handleDelete(h.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg" title="Eliminar">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title={editing ? 'Editar asignación' : 'Nueva asignación'}
        subtitle="Al crear una nueva, la anterior abierta se cerrará automáticamente"
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Usuario profesional <span className="text-slate-400 font-normal">(opcional)</span></label>
              <select value={form.professional_user_id} onChange={(e) => onSelectUser(e.target.value)} className="input-base">
                <option value="">— Solo nombre libre —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nombre del responsable *</label>
              <input type="text" value={form.professional_name} required
                     onChange={(e) => setForm({ ...form, professional_name: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="label">Responsable filial</label>
              <input type="text" value={form.responsable_filial}
                     onChange={(e) => setForm({ ...form, responsable_filial: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="label">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-base">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha inicio *</label>
              <input type="date" required value={form.start_date}
                     onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="label">Fecha fin <span className="text-slate-400 font-normal">(vacía = indefinido)</span></label>
              <input type="date" value={form.end_date}
                     onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-base" />
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Motivo del cambio, observaciones, etc." className="input-base resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{editing ? 'Guardar cambios' : 'Crear asignación'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}

export default AliadoHistoria
