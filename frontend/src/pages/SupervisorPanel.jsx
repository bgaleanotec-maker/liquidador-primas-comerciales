import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, History, Activity, Clock, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import MetricCard from '../components/MetricCard'
import { aliadosAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const SupervisorPanel = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [aliados, setAliados] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, a] = await Promise.all([
        aliadosAPI.stats(),
        aliadosAPI.list({ per_page: 500 }),
      ])
      setStats(s.data?.data || null)
      setAliados(a.data?.data?.aliados || [])
    } catch {}
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const byProfessional = (() => {
    const m = {}
    aliados.forEach((a) => {
      const k = a.current_assignment?.professional_name || 'Sin asignar'
      m[k] = (m[k] || 0) + 1
    })
    return Object.entries(m).map(([name, count]) => ({ name, count }))
  })()

  const sinAsignacion = aliados.filter((a) => !a.current_assignment)

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Equipo</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Hola {user?.name}. Estos son los aliados bajo tu supervisión.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard icon={Users} label="Aliados a cargo" value={aliados.length} color="blue" />
          <MetricCard icon={Activity} label="Activos" value={stats?.active_aliados || 0} color="green" />
          <MetricCard icon={AlertCircle} label="Sin asignación" value={sinAsignacion.length} color="red" />
          <MetricCard icon={Clock} label="Asignaciones vigentes" value={(stats?.assignments_by_status || []).reduce((acc, s) => acc + s.count, 0)} color="yellow" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Carga por profesional</h3>
            {byProfessional.length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byProfessional} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estados de asignaciones</h3>
            {(stats?.assignments_by_status || []).length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats.assignments_by_status} dataKey="count" nameKey="status"
                       label={(e) => `${e.status}: ${e.count}`} outerRadius={100}>
                    {stats.assignments_by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis aliados</h3>
            <p className="text-xs text-gray-500">Click sobre cualquier fila para gestionar la historia.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="text-left p-3">Aliado</th>
                  <th className="text-left p-3">Sociedad</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Responsable actual</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Vigencia</th>
                </tr>
              </thead>
              <tbody>
                {aliados.map((a) => (
                  <tr key={a.id} onClick={() => navigate(`/aliados/${a.id}/historia`)}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <td className="p-3">
                      <div className="font-medium text-gray-900 dark:text-white">{a.nombre_firma}</div>
                      <div className="text-xs text-gray-500">{a.nit || '—'}</div>
                    </td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{a.sociedad}</span></td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{a.tipo_aliado}</td>
                    <td className="p-3 text-gray-900 dark:text-white">{a.current_assignment?.professional_name || <span className="text-red-600 italic">Sin asignar</span>}</td>
                    <td className="p-3"><StatusBadge status={a.current_assignment?.status || 'sin_asignar'} /></td>
                    <td className="p-3 text-xs text-gray-500">
                      {a.current_assignment ? `${a.current_assignment.start_date} → ${a.current_assignment.end_date || 'indefinido'}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SupervisorPanel
