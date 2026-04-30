import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Activity, AlertCircle, Clock, ChevronRight, Search } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import MetricCard from '../components/MetricCard'
import { aliadosAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

const SupervisorPanel = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [aliados, setAliados] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [s, a] = await Promise.all([
        aliadosAPI.stats(),
        aliadosAPI.list({ per_page: 500 }),
      ])
      setStats(s.data?.data || null)
      setAliados(a.data?.data?.aliados || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return aliados
    return aliados.filter((a) =>
      a.nombre_firma?.toLowerCase().includes(q) ||
      a.nit?.toLowerCase().includes(q) ||
      a.bp_vantilisto?.toLowerCase().includes(q) ||
      (a.current_assignment?.professional_name || '').toLowerCase().includes(q)
    )
  }, [aliados, search])

  const byProfessional = useMemo(() => {
    const m = {}
    aliados.forEach((a) => {
      const k = a.current_assignment?.professional_name || 'Sin asignar'
      m[k] = (m[k] || 0) + 1
    })
    return Object.entries(m)
      .map(([name, count]) => ({ name, count }))
      .sort((x, y) => y.count - x.count)
      .slice(0, 10)
  }, [aliados])

  const sinAsignacion = aliados.filter((a) => !a.current_assignment).length
  const vigentes = (stats?.assignments_by_status || []).reduce((acc, s) => acc + s.count, 0)

  return (
    <Layout>
      <div className="px-8 py-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div>
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">Panel del supervisor</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Hola, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Estos son los aliados bajo tu supervisión. Click en una fila para gestionar la historia.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={Users}      label="Aliados a cargo" value={aliados.length} color="primary" />
          <MetricCard icon={Activity}   label="Activos"          value={stats?.active_aliados || 0} color="green" />
          <MetricCard icon={AlertCircle} label="Sin asignación"  value={sinAsignacion} color="red" hint={sinAsignacion > 0 ? 'Requieren atención' : 'Todo cubierto'} />
          <MetricCard icon={Clock}      label="Asignaciones vigentes" value={vigentes} color="yellow" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Carga por profesional</h3>
              <span className="text-xs text-slate-500">Top 10</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Aliados a cargo de cada responsable</p>
            {byProfessional.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={byProfessional} layout="vertical" margin={{ left: 40, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" className="dark:stroke-slate-700" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={140} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Estados</h3>
            <p className="text-xs text-slate-500 mb-4">Asignaciones vigentes hoy</p>
            {(stats?.assignments_by_status || []).length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">Sin datos</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stats.assignments_by_status} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {stats.assignments_by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-3">
                  {stats.assignments_by_status.map((s, i) => (
                    <div key={s.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <StatusBadge status={s.status} />
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Aliados table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Mis aliados</h3>
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar aliado o responsable…"
                className="input-base pl-9 py-2"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Aliado</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sociedad</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Responsable</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Vigencia</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400">Cargando…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400">Sin resultados</td></tr>
                ) : filtered.map((a) => (
                  <tr key={a.id} onClick={() => navigate(`/aliados/${a.id}/historia`)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-white">{a.nombre_firma}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{a.nit || '—'}</div>
                    </td>
                    <td className="px-5 py-3.5"><span className="badge-violet">{a.sociedad}</span></td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{a.tipo_aliado}</td>
                    <td className="px-5 py-3.5">
                      {a.current_assignment?.professional_name
                        ? <span className="text-slate-900 dark:text-white font-medium">{a.current_assignment.professional_name}</span>
                        : <span className="text-rose-600 italic text-xs">Sin asignar</span>}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.current_assignment?.status || 'sin_asignar'} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {a.current_assignment ? `${a.current_assignment.start_date} → ${a.current_assignment.end_date || '∞'}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
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
