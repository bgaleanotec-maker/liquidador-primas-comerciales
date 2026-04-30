import React, { useEffect, useMemo, useState } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Layout from '../components/Layout'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import { aliadosAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

const fmtMoney = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']

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

  const aliadosBySociedad = useMemo(() => {
    const m = {}
    assignments.active.forEach((a) => { m[a.aliado_sociedad] = (m[a.aliado_sociedad] || 0) + 1 })
    return Object.entries(m).map(([sociedad, count]) => ({ sociedad, count }))
  }, [assignments.active])

  const pendiente = (stats?.comisiones_total || 0) - (stats?.comisiones_pagadas || 0)
  const pctPagado = stats?.comisiones_total
    ? Math.round(((stats.comisiones_pagadas || 0) / stats.comisiones_total) * 100)
    : 0

  if (loading) return (
    <Layout>
      <div className="p-12 text-center text-slate-400">Cargando…</div>
    </Layout>
  )

  return (
    <Layout>
      <div className="px-8 py-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div>
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">Mi panel</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Hola, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Resumen de tus aliados, ventas y comisiones.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={Users}      label="Aliados activos"     value={stats?.aliados_activos || 0} color="primary" />
          <MetricCard icon={ShoppingBag} label="Ventas registradas"  value={stats?.ventas_count || 0} color="blue" />
          <MetricCard icon={TrendingUp} label="Valor total ventas"   value={fmtMoney(stats?.ventas_valor)} color="green" />
          <MetricCard icon={DollarSign} label="Comisiones pagadas"   value={fmtMoney(stats?.comisiones_pagadas)} color="yellow" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Comisiones progress */}
          <div className="card p-6 lg:col-span-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Mis comisiones</h3>
            <p className="text-xs text-slate-500 mb-5">Progreso de pago</p>

            <div className="relative w-40 h-40 mx-auto mb-5">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(226 232 240)" strokeWidth="8" className="dark:stroke-slate-700" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#grad)" strokeWidth="8"
                        strokeDasharray={`${pctPagado * 2.83} 283`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{pctPagado}%</span>
                <span className="text-xs text-slate-500">pagado</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Generadas
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtMoney(stats?.comisiones_total)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Pagadas
                </div>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{fmtMoney(stats?.comisiones_pagadas)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-center gap-2 text-xs">
                  <Clock size={13} className="text-amber-600" />
                  Pendientes
                </div>
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{fmtMoney(pendiente)}</span>
              </div>
            </div>
          </div>

          {/* Aliados por sociedad */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Mis aliados activos por sociedad</h3>
            <p className="text-xs text-slate-500 mb-5">Distribución actual</p>
            {aliadosBySociedad.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">Sin asignaciones vigentes</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={aliadosBySociedad}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" className="dark:stroke-slate-700" vertical={false} />
                  <XAxis dataKey="sociedad" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Aliados activos */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Mis aliados vigentes</h3>
              <p className="text-xs text-slate-500 mt-0.5">{assignments.active.length} aliados a tu cargo hoy</p>
            </div>
            <Calendar className="text-slate-300 dark:text-slate-600" size={20} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Aliado</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sociedad</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Desde</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hasta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assignments.active.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400">Sin asignaciones vigentes</td></tr>
                ) : assignments.active.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{a.aliado_nombre}</td>
                    <td className="px-5 py-3.5"><span className="badge-violet">{a.aliado_sociedad}</span></td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{a.start_date}</td>
                    <td className="px-5 py-3.5 text-slate-500">{a.end_date || '∞'}</td>
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
