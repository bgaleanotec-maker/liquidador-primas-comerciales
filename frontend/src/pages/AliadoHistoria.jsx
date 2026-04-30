import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit3, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { aliadosAPI, adminAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

const STATUSES = [
  { value: 'active', label: 'Activo' },
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'disability', label: 'Incapacidad' },
  { value: 'leave', label: 'Permiso' },
  { value: 'reassigned', label: 'Reasignado' },
  { value: 'inactive', label: 'Inactivo' },
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
    professional_user_id: '',
    professional_name: '',
    responsable_filial: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    status: 'active',
    notes: '',
  }
  const [form, setForm] = useState(empty)

  const canEdit = ['admin', 'super_admin', 'supervisor'].includes(user?.role)

  const load = async () => {
    setLoading(true)
    try {
      const [a, h] = await Promise.all([
        aliadosAPI.get(id),
        aliadosAPI.history(id),
      ])
      setAliado(a.data?.data)
      setHistory(h.data?.data || [])
    } catch {
      toast.error('Error cargando aliado/historia')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // load users only for admins/supervisors
    if (canEdit) {
      adminAPI.getUsers().then((r) => {
        const list = r.data?.data?.users || r.data?.data || []
        setUsers(list.filter((u) => u.role === 'professional'))
      }).catch(() => {})
    }
  }, [id])

  const startNew = () => {
    setEditing(null)
    setForm(empty)
    setShowAdd(true)
  }

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
      setShowAdd(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    }
  }

  const handleDelete = async (asgId) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return
    try {
      await aliadosAPI.deleteHistory(asgId)
      toast.success('Asignación eliminada')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar')
    }
  }

  const onSelectUser = (uid) => {
    const u = users.find((x) => String(x.id) === String(uid))
    setForm({ ...form, professional_user_id: uid, professional_name: u ? u.name : form.professional_name })
  }

  if (loading) return <Layout><div className="p-6">Cargando…</div></Layout>
  if (!aliado) return <Layout><div className="p-6">Aliado no encontrado</div></Layout>

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <button onClick={() => navigate('/aliados')} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft size={16} /> Volver a Aliados
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{aliado.nombre_firma}</h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {aliado.tipo_aliado} • {aliado.sociedad} • Llave: <code>{aliado.llave}</code>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                NIT: {aliado.nit || '—'} • BP: {aliado.bp_vantilisto || '—'} • Supervisor: {aliado.supervisor_name || '—'}
              </div>
            </div>
            {canEdit && (
              <button onClick={startNew} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Nueva asignación
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Línea de tiempo</h2>
          {history.length === 0 ? (
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
              <AlertTriangle size={16} /> Este aliado no tiene historia registrada todavía.
            </div>
          ) : (
            <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-4">
              {history.map((h) => (
                <li key={h.id} className="ml-4">
                  <div className={`absolute -left-2 mt-2 w-4 h-4 rounded-full ${h.is_open ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-3 items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{h.professional_name}</div>
                        <div className="text-xs text-gray-500">
                          {h.start_date} → {h.end_date || 'Indefinido'} {h.is_open && <span className="ml-2 text-green-600">(vigente)</span>}
                        </div>
                        {h.responsable_filial && (
                          <div className="text-xs text-gray-500 mt-1">Filial: {h.responsable_filial}</div>
                        )}
                        {h.notes && <div className="text-xs text-gray-500 mt-1">📝 {h.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={h.status} />
                        {canEdit && (
                          <>
                            <button onClick={() => startEdit(h)} className="text-blue-600 hover:text-blue-700 p-1" title="Editar">
                              <Edit3 size={14} />
                            </button>
                            {user?.role === 'admin' || user?.role === 'super_admin' ? (
                              <button onClick={() => handleDelete(h.id)} className="text-red-600 hover:text-red-700 p-1" title="Eliminar">
                                <Trash2 size={14} />
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={editing ? 'Editar asignación' : 'Nueva asignación'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Usuario profesional (opcional)</label>
              <select value={form.professional_user_id} onChange={(e) => onSelectUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">— Solo nombre libre —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Nombre del responsable *</label>
              <input type="text" value={form.professional_name} required
                     onChange={(e) => setForm({ ...form, professional_name: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Responsable filial</label>
              <input type="text" value={form.responsable_filial}
                     onChange={(e) => setForm({ ...form, responsable_filial: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Fecha inicio *</label>
              <input type="date" required value={form.start_date}
                     onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Fecha fin (vacía = indefinido)</label>
              <input type="date" value={form.end_date}
                     onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Notas</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <p className="text-xs text-gray-500 italic">
            Al crear una nueva asignación, la anterior se cerrará automáticamente para mantener
            la coherencia temporal.
          </p>
          <button type="submit" className="btn-primary w-full">{editing ? 'Guardar cambios' : 'Crear asignación'}</button>
        </form>
      </Modal>
    </Layout>
  )
}

export default AliadoHistoria
