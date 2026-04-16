import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Settings } from 'lucide-react'
import Layout from '../components/Layout'
import Table from '../components/Table'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { adminAPI } from '../api'
import { mockUsers, mockPeriods, mockAuditLog } from '../utils/mockData'
import { formatDate, formatDateTime } from '../utils/format'
import toast from 'react-hot-toast'

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState(mockUsers)
  const [periods, setPeriods] = useState(mockPeriods)
  const [auditLog, setAuditLog] = useState(mockAuditLog)
  const [isUserModal, setIsUserModal] = useState(false)
  const [isPeriodModal, setIsPeriodModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'analyst', bu: '' })
  const [loading, setLoading] = useState(false)

  const usersColumns = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Rol',
      render: (value) => <StatusBadge status={value} />
    },
    { key: 'bu', label: 'UB' },
    {
      key: 'active',
      label: 'Estado',
      render: (value) => <StatusBadge status={value ? 'active' : 'inactive'} />
    },
    { key: 'last_login', label: 'Última sesión' }
  ]

  const periodsColumns = [
    { key: 'year', label: 'Año', sortable: true },
    { key: 'month', label: 'Mes', sortable: true },
    {
      key: 'status',
      label: 'Estado',
      render: (value) => <StatusBadge status={value} />
    }
  ]

  const auditColumns = [
    { key: 'date', label: 'Fecha', sortable: true, render: (value) => formatDate(value) },
    { key: 'user', label: 'Usuario', sortable: true },
    { key: 'action', label: 'Acción', sortable: true },
    { key: 'entity', label: 'Entidad', sortable: true },
    { key: 'detail', label: 'Detalle' }
  ]

  const handleAddUser = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', role: 'analyst', bu: '' })
    setIsUserModal(true)
  }

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Por favor completa todos los campos')
      return
    }

    try {
      setLoading(true)
      if (editingUser) {
        await adminAPI.updateUser(editingUser.id, formData)
        toast.success('Usuario actualizado')
      } else {
        await adminAPI.createUser(formData)
        toast.success('Usuario creado')
      }
      setIsUserModal(false)
    } catch (error) {
      toast.error('Error al guardar usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Estás seguro?')) return

    try {
      await adminAPI.deleteUser(id)
      setUsers(users.filter((u) => u.id !== id))
      toast.success('Usuario eliminado')
    } catch (error) {
      toast.error('Error al eliminar usuario')
    }
  }

  const handleAddPeriod = () => {
    setIsPeriodModal(true)
  }

  const handleExportAudit = () => {
    const csv = [
      ['Fecha', 'Usuario', 'Acción', 'Entidad', 'Detalle'],
      ...auditLog.map((log) => [log.date, log.user, log.action, log.entity, log.detail])
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'audit.csv')
    document.body.appendChild(link)
    link.click()
    link.parentElement.removeChild(link)
    toast.success('Auditoría exportada')
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Administración</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona usuarios, períodos y configuración del sistema</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'users', label: 'Usuarios' },
              { id: 'periods', label: 'Períodos' },
              { id: 'datasources', label: 'Fuentes de Datos' },
              { id: 'audit', label: 'Auditoría' },
              { id: 'settings', label: 'Configuración' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
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
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <button
                  onClick={handleAddUser}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  <Plus size={20} />
                  Añadir Usuario
                </button>
                <Table
                  columns={usersColumns}
                  data={users}
                  loading={loading}
                  actions={(row) => [
                    <button
                      key="edit"
                      onClick={() => {
                        setEditingUser(row)
                        setFormData(row)
                        setIsUserModal(true)
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>,
                    <button
                      key="delete"
                      onClick={() => handleDeleteUser(row.id)}
                      className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  ]}
                />
              </div>
            )}

            {/* Periods Tab */}
            {activeTab === 'periods' && (
              <div className="space-y-4">
                <button
                  onClick={handleAddPeriod}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  <Plus size={20} />
                  Crear Período
                </button>
                <Table columns={periodsColumns} data={periods} loading={loading} />
              </div>
            )}

            {/* Data Sources Tab */}
            {activeTab === 'datasources' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Gestiona las fuentes de datos disponibles. Fase 1: CSV. Fase 2: BigQuery (Próximamente)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: 'CSV Upload',
                      type: 'CSV',
                      bu: 'Todas',
                      status: 'active',
                      last_sync: '2024-06-15 10:30'
                    },
                    {
                      name: 'BigQuery',
                      type: 'BigQuery',
                      bu: 'Todas',
                      status: 'inactive',
                      last_sync: '-'
                    }
                  ].map((source) => (
                    <div key={source.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{source.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{source.type}</p>
                        </div>
                        <StatusBadge status={source.status} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Última sincronización: {source.last_sync}</p>
                      <button className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2 justify-center">
                        <Settings size={16} />
                        Configurar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <button
                  onClick={handleExportAudit}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium"
                >
                  Exportar a CSV
                </button>
                <Table columns={auditColumns} data={auditLog} loading={loading} />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* General Settings */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuración General</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de la Aplicación</label>
                      <input
                        type="text"
                        value="Liquidador Primas Comerciales"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo URL</label>
                      <input
                        type="text"
                        value="💰"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Premium Calculation */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Parámetros de Cálculo de Prima</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Umbral Mínimo (%)</label>
                      <input
                        type="number"
                        defaultValue={50}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prima Máxima (%)</label>
                      <input
                        type="number"
                        defaultValue={30}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notificaciones por Email</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600" />
                      <span className="text-gray-700 dark:text-gray-300">Notificar al enviar liquidación</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600" />
                      <span className="text-gray-700 dark:text-gray-300">Notificar al aprobar/rechazar</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 text-primary-600" />
                      <span className="text-gray-700 dark:text-gray-300">Resumen diario (Próximamente)</span>
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3">
                  <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                    Guardar Configuración
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Modal */}
      <Modal
        isOpen={isUserModal}
        onClose={() => setIsUserModal(false)}
        title={editingUser ? 'Editar Usuario' : 'Crear Usuario'}
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsUserModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveUser}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="analyst">Analista</option>
              <option value="approver">Aprobador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad de Negocio</label>
            <select
              value={formData.bu}
              onChange={(e) => setFormData({ ...formData, bu: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecciona UB</option>
              <option value="VL">VL</option>
              <option value="VM">VM</option>
              <option value="NE">NE</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Period Modal */}
      <Modal
        isOpen={isPeriodModal}
        onClose={() => setIsPeriodModal(false)}
        title="Crear Período"
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsPeriodModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                toast.success('Período creado')
                setIsPeriodModal(false)
              }}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Crear
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Año</label>
            <input
              type="number"
              defaultValue={2024}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mes</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default Admin
