import React, { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import { aliadosAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

const fmtMoney = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)

const MyDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [assignments, setAssignments] = useState({ all: [], active: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      aliadosAPI.statsForProfessional(user.id),
      aliadosAPI.myAssignments(),
    ])
      .then(([s, a]) => {
        setStats(s.data?.data || null)
        setAssignments(a.data?.data || { all: [], active: [] })
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) return <Layout><div className="p-6">Cargando…</div></Layout>

  const aliadosBySociedad = (() => {
    const m = {}
    assignments.active.forEach((a) => { m[a.aliado_sociedad] = (m[a.aliado_sociedad] || 0) + 1 })
    return Object.entries(m).map(([sociedad, count]) => ({ sociedad, count }))
  })()

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Hola {user?.name}, este es tu resumen.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Users} label="Aliados activos" value={stats?.aliados_activos || 0} color="blue" />
          <MetricCard icon={ShoppingBag} label="Ventas registradas" value={stats?.ventas_count || 0} color="green" />
          <MetricCard icon={TrendingUp} label="Valor de ventas" value={fmtMoney(stats?.ventas_valor)} color="yellow" />
          <MetricCard icon={DollarSign} label="Comisiones pagadas" value={fmtMoney(stats?.comisiones_pagadas)} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mis aliados activos por sociedad</h3>
            {aliadosBySociedad.length === 0 ? (
              <p className="text-sm text-gray-500">Sin asignaciones vigentes</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={aliadosBySociedad}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="sociedad" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen comisiones</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Comisiones generadas</span>
                <span className="font-medium text-gray-900 dark:text-white">{fmtMoney(stats?.comisiones_total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Comisiones pagadas</span>
                <span className="font-medium text-green-600">{fmtMoney(stats?.comisiones_pagadas)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Pendiente por pagar</span>
                <span className="font-medium text-yellow-600">{fmtMoney((stats?.comisiones_total || 0) - (stats?.comisiones_pagadas || 0))}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Asignaciones históricas: </span>
                <span className="font-medium text-gray-900 dark:text-white">{stats?.asignaciones_historicas || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis aliados (vigentes)</h3>
              <p className="text-xs text-gray-500">Aliados que tienes a cargo hoy.</p>
            </div>
            <Calendar className="text-gray-400" size={20} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="text-left p-3">Aliado</th>
                  <th className="text-left p-3">Sociedad</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Desde</th>
                  <th className="text-left p-3">Hasta</th>
                </tr>
              </thead>
              <tbody>
                {assignments.active.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">Sin asignaciones vigentes</td></tr>
                )}
                {assignments.active.map((a) => (
                  <tr key={a.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{a.aliado_nombre}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{a.aliado_sociedad}</span></td>
                    <td className="p-3"><StatusBadge status={a.status} /></td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{a.start_date}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{a.end_date || 'indefinido'}</td>
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

export default MyDashboard
