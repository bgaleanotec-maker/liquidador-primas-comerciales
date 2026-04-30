import React, { useState } from 'react'
import {
  BookOpen, GitBranch, Code2, Download, Layers, Users, Activity,
  Database, Zap, ShieldCheck, ArrowRight, Copy, Check, ExternalLink,
  FileText, Server, Workflow
} from 'lucide-react'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'sistema',  label: 'Sistema',     icon: BookOpen },
  { id: 'modulos',  label: 'Módulos',     icon: Layers },
  { id: 'bpmn',     label: 'Flujo BPMN',  icon: Workflow },
  { id: 'api',      label: 'API REST',    icon: Code2 },
  { id: 'propuesta', label: 'Propuesta',  icon: FileText },
]

const MODULES = [
  {
    icon: Users, color: 'primary', title: 'Aliados (Beta)',
    desc: 'Maestro centralizado de 683 firmas con NIT, BP, sociedad y supervisor.',
    features: ['Importación desde diccionario_aliados.xlsx', 'Filtros por sociedad/tipo', 'Export Excel snapshot', 'Resolver puntual por (llave, fecha)'],
  },
  {
    icon: Activity, color: 'green', title: 'Historia Temporal',
    desc: 'Cada cambio de responsable queda registrado con vigencia desde/hasta.',
    features: ['6 estados: activo, vacaciones, incapacidad, permiso, reasignado, inactivo', 'Cierre automático de asignación previa', 'Timeline visual editable', 'Resolver vía API: dado (aliado, fecha) → responsable'],
  },
  {
    icon: ShieldCheck, color: 'purple', title: 'Control por Supervisor',
    desc: 'Cada supervisor administra solo el equipo y aliados a su cargo.',
    features: ['Filtro automático por supervisor_user_id', 'Crear/editar asignaciones', 'Métricas y carga por profesional', 'Detección de aliados sin asignar'],
  },
  {
    icon: Database, color: 'blue', title: 'Liquidación Trazable',
    desc: 'Toda venta se asocia a quien era responsable en su fecha exacta.',
    features: ['Sin pérdida de trazabilidad por reasignaciones', 'Cálculo de comisiones por profesional/periodo', 'Vista personal con % de pago', 'Export para reportería externa'],
  },
  {
    icon: Zap, color: 'yellow', title: 'Roles y Accesos',
    desc: 'Login con usuario/contraseña. Permisos granulares por rol.',
    features: ['7 roles: super_admin, admin, supervisor, profesional, analista, aprobador, viewer', 'Admin parametriza todo', 'Profesional ve sus comisiones', 'JWT con expiración 8h'],
  },
  {
    icon: Server, color: 'red', title: 'API REST + ODBC',
    desc: 'Endpoints listos para integrarse con sistemas externos.',
    features: ['Auth JWT estándar', 'Stats agregados', 'Resolver para liquidador externo', 'Export Excel programable'],
  },
]

const ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login', desc: 'Autenticación. Retorna JWT.' },
  { method: 'GET',  path: '/api/aliados', desc: 'Lista paginada de aliados (filtra por sociedad, tipo, búsqueda).' },
  { method: 'POST', path: '/api/aliados', desc: 'Crear nuevo aliado (admin).' },
  { method: 'PUT',  path: '/api/aliados/:id', desc: 'Actualizar aliado (admin/supervisor).' },
  { method: 'GET',  path: '/api/aliados/:id/history', desc: 'Línea de tiempo completa del aliado.' },
  { method: 'POST', path: '/api/aliados/:id/history', desc: 'Crear nueva asignación (cierra automáticamente la anterior abierta).' },
  { method: 'PUT',  path: '/api/aliados/history/:id', desc: 'Editar una asignación.' },
  { method: 'GET',  path: '/api/aliados/resolve', desc: 'Resolver responsable por (llave, fecha). Endpoint clave para liquidación.', highlight: true },
  { method: 'POST', path: '/api/aliados/import', desc: 'Importar diccionario_aliados.xlsx (multipart).' },
  { method: 'GET',  path: '/api/aliados/export', desc: 'Exportar Excel con snapshot a una fecha.' },
  { method: 'GET',  path: '/api/aliados/stats/summary', desc: 'KPIs agregados: total, por sociedad, por tipo, por estado.' },
  { method: 'GET',  path: '/api/aliados/stats/professional/:id', desc: 'Métricas del profesional: aliados activos, ventas, comisiones.' },
  { method: 'GET',  path: '/api/aliados/me/assignments', desc: 'Mis asignaciones (profesional autenticado).' },
]

const METHOD_COLORS = {
  GET:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  POST:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PUT:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const CodeBlock = ({ code, language = 'bash' }) => {
  const [copied, setCopied] = useState(false)
  const onCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group">
      <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto border border-slate-200 dark:border-slate-800 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={onCopy}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  )
}

const Docs = () => {
  const [tab, setTab] = useState('sistema')

  return (
    <Layout>
      <div className="px-8 py-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div>
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">Documentación</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Centro de documentación</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Sistema, módulos disponibles, flujo BPMN, API REST y propuesta comercial.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${active
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">

          {/* SISTEMA */}
          {tab === 'sistema' && (
            <div className="space-y-6">
              <div className="card p-6 bg-gradient-to-br from-primary-50/50 to-violet-50/50 dark:from-primary-900/20 dark:to-violet-900/20 border-primary-200 dark:border-primary-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary-500/20">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Liquidador de Primas Comerciales</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      Sistema integral para el cálculo, aprobación y reporte de primas comerciales del Grupo Vanti.
                      La <strong>fase Beta</strong> resuelve la trazabilidad temporal entre ventas y responsables: cada
                      venta se liquida contra quien era responsable en la fecha exacta de la transacción.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="card p-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">El problema</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    En el archivo <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">diccionario_aliados</code>,
                    la columna <em>Responsable Oficina Central</em> apunta a <strong>una sola persona</strong>. Cuando un
                    aliado se reasigna o el responsable sale de vacaciones, esa columna cambia y se pierde el rastro de
                    quién era el responsable cuando ocurrió cada venta histórica.
                  </p>
                </div>
                <div className="card p-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">La solución</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Dos tablas: <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">aliados</code> (maestro)
                    y <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">aliado_assignments</code> (historial
                    con start/end date). Un endpoint <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">/api/aliados/resolve</code> recibe
                    llave + fecha y devuelve el responsable correcto.
                  </p>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Stack técnico</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { l: 'Backend',  v: 'Flask 3 · Python 3.11' },
                    { l: 'Base de datos', v: 'PostgreSQL · SQLAlchemy' },
                    { l: 'Frontend', v: 'React 18 · Vite · Tailwind' },
                    { l: 'Auth',     v: 'JWT · bcrypt' },
                    { l: 'Charts',   v: 'Recharts' },
                    { l: 'Hosting',  v: 'Render.com' },
                    { l: 'CI/CD',    v: 'GitHub auto-deploy' },
                    { l: 'API',      v: 'REST + JSON' },
                  ].map((it) => (
                    <div key={it.l} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                      <p className="text-xs text-slate-500">{it.l}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{it.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Roles del sistema</h3>
                <div className="space-y-2">
                  {[
                    { role: 'super_admin', desc: 'Control total. Configuración del sistema.', color: 'badge-violet' },
                    { role: 'admin',       desc: 'Parametriza, importa, gestiona usuarios y aliados.', color: 'badge-violet' },
                    { role: 'supervisor',  desc: 'Administra solo SU grupo de aliados (filtro automático).', color: 'badge-amber' },
                    { role: 'profesional', desc: 'Ve sus aliados, ventas y comisiones.', color: 'badge-blue' },
                    { role: 'analista',    desc: 'Carga ventas y datos del periodo.', color: 'badge-green' },
                    { role: 'aprobador',   desc: 'Revisa y aprueba liquidaciones.', color: 'badge-blue' },
                    { role: 'viewer',      desc: 'Solo lectura para reportería.', color: 'badge-slate' },
                  ].map((r) => (
                    <div key={r.role} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                      <span className={r.color}>{r.role}</span>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULOS */}
          {tab === 'modulos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MODULES.map((m) => {
                const Icon = m.icon
                const colorMap = {
                  primary: 'from-primary-500 to-primary-700 shadow-primary-500/20',
                  green:   'from-emerald-500 to-emerald-700 shadow-emerald-500/20',
                  purple:  'from-violet-500 to-violet-700 shadow-violet-500/20',
                  blue:    'from-blue-500 to-blue-700 shadow-blue-500/20',
                  yellow:  'from-amber-500 to-amber-700 shadow-amber-500/20',
                  red:     'from-rose-500 to-rose-700 shadow-rose-500/20',
                }
                return (
                  <div key={m.title} className="card p-6 card-hover">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 bg-gradient-to-br ${colorMap[m.color]} rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{m.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{m.desc}</p>
                        <ul className="mt-4 space-y-1.5">
                          {m.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <ArrowRight size={11} className="mt-0.5 shrink-0 text-primary-500" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* BPMN */}
          {tab === 'bpmn' && (
            <div className="space-y-6">
              <div className="card p-6 bg-gradient-to-br from-primary-50/50 to-violet-50/50 dark:from-primary-900/20 dark:to-violet-900/20 border-primary-200 dark:border-primary-800">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Flujos BPMN 2.0</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
                      Dos diagramas interactivos. Haz hover sobre cualquier nodo para ver el detalle.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <a href="/bpmn-aliados.html" target="_blank" rel="noopener noreferrer"
                   className="card p-6 card-hover group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="badge-violet">Beta</span>
                    <ExternalLink size={15} className="text-slate-400 group-hover:text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Trazabilidad de Aliados</h3>
                  <p className="text-sm text-slate-500 mt-1.5">
                    Flujo completo: importación → cambios por supervisor → resolución por fecha → liquidación trazable.
                  </p>
                  <div className="flex gap-2 mt-3 text-xs text-slate-500">
                    <span>5 carriles</span>·<span>15 nodos</span>·<span>683 aliados</span>
                  </div>
                </a>

                <a href="/bpmn-process.html" target="_blank" rel="noopener noreferrer"
                   className="card p-6 card-hover group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="badge-blue">Producción</span>
                    <ExternalLink size={15} className="text-slate-400 group-hover:text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Flujo de Liquidación</h3>
                  <p className="text-sm text-slate-500 mt-1.5">
                    Flujo histórico de aprobación: Analista → Aprobador N1 → Admin N2 → Pago, con escalación automática.
                  </p>
                  <div className="flex gap-2 mt-3 text-xs text-slate-500">
                    <span>6 carriles</span>·<span>30+ nodos</span>·<span>4 niveles aprobación</span>
                  </div>
                </a>
              </div>

              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch size={15} className="text-primary-600" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Vista en línea — Trazabilidad de Aliados</span>
                  </div>
                  <a href="/bpmn-aliados.html" target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1.5">
                    <ExternalLink size={13} /> Pantalla completa
                  </a>
                </div>
                <iframe
                  src="/bpmn-aliados.html"
                  title="BPMN Trazabilidad de Aliados"
                  className="w-full bg-slate-950"
                  style={{ height: 720, border: 0 }}
                />
              </div>
            </div>
          )}

          {/* API */}
          {tab === 'api' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Base URL</h3>
                <CodeBlock code={`https://liquidador-primas-comerciales.onrender.com/api`} />
                <p className="text-xs text-slate-500 mt-3">
                  Todos los endpoints (excepto <code>/auth/login</code>) requieren <code>Authorization: Bearer &lt;token&gt;</code>.
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">1. Autenticación</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Obtén un JWT con email y contraseña. Token válido por 8 horas.
                </p>
                <CodeBlock code={`curl -X POST https://liquidador-primas-comerciales.onrender.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@primax.com","password":"Admin2024!"}'

# Respuesta
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": { "id": 1, "name": "Admin User", "role": "admin" }
  }
}`} />
              </div>

              <div className="card p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">2. Resolver responsable (endpoint clave)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Dado un aliado (por <code>llave</code> o <code>aliado_id</code>) y una fecha,
                  devuelve quién era el responsable de oficina central en esa fecha.
                </p>
                <CodeBlock code={`curl -G "https://liquidador-primas-comerciales.onrender.com/api/aliados/resolve" \\
  -H "Authorization: Bearer $TOKEN" \\
  --data-urlencode "llave=4 EN MOVIMIENTO SASVANTI" \\
  --data-urlencode "fecha=2026-04-15"

# Respuesta
{
  "success": true,
  "data": {
    "aliado": { "nombre_firma": "4 EN MOVIMIENTO SAS", "sociedad": "VANTI", ... },
    "fecha": "2026-04-15",
    "resolved": true,
    "assignment": {
      "professional_name": "Juan Posada",
      "professional_email": "juan.posada@primax.com",
      "status": "active",
      "start_date": "2026-04-01",
      "end_date": null
    }
  }
}`} />
              </div>

              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Endpoints disponibles</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Mapa completo del API REST</p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ENDPOINTS.map((e) => (
                    <div key={e.path + e.method} className={`px-5 py-3.5 flex items-start gap-4 ${e.highlight ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md w-16 text-center shrink-0 ${METHOD_COLORS[e.method]}`}>
                        {e.method}
                      </span>
                      <div className="min-w-0 flex-1">
                        <code className="text-sm text-slate-900 dark:text-white font-mono">{e.path}</code>
                        <p className="text-xs text-slate-500 mt-0.5">{e.desc}</p>
                      </div>
                      {e.highlight && <span className="badge-violet text-[10px]">clave</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Conexión vía ODBC / Python</h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mb-3">
                  Para integrar el resolver con tu sistema de liquidación externo:
                </p>
                <CodeBlock code={`import requests
TOKEN = requests.post(
  "https://liquidador-primas-comerciales.onrender.com/api/auth/login",
  json={"email": "admin@primax.com", "password": "Admin2024!"}
).json()["data"]["token"]

H = {"Authorization": f"Bearer {TOKEN}"}

def resolver(llave, fecha):
    r = requests.get(
      "https://liquidador-primas-comerciales.onrender.com/api/aliados/resolve",
      headers=H, params={"llave": llave, "fecha": fecha}
    ).json()
    return r["data"]["assignment"]["professional_name"] if r["data"]["resolved"] else None

# Uso en tu pipeline de liquidación:
# para cada venta: profesional = resolver(venta.llave, venta.fecha)`} />
              </div>
            </div>
          )}

          {/* PROPUESTA */}
          {tab === 'propuesta' && (
            <div className="space-y-6">
              <div className="card p-8 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="max-w-xl">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur rounded-full text-xs font-medium border border-white/20 mb-3">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      Propuesta comercial
                    </span>
                    <h3 className="text-2xl font-bold">Liquidador de Primas Comerciales</h3>
                    <p className="text-primary-100 mt-2 text-sm leading-relaxed">
                      Documento completo de la propuesta de implementación del sistema, incluyendo alcance,
                      cronograma, entregables, equipo y modelo de despliegue.
                    </p>
                  </div>
                  <a
                    href="/static/propuesta.docx"
                    download
                    className="bg-white text-primary-700 hover:bg-primary-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg flex items-center gap-2 transition-colors"
                  >
                    <Download size={16} />
                    Descargar (.docx)
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Duración</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">30 días</p>
                  <p className="text-xs text-slate-500 mt-1">implementación full</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Módulos</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">6 + Beta</p>
                  <p className="text-xs text-slate-500 mt-1">funcionalidad completa</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Despliegue</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Cloud</p>
                  <p className="text-xs text-slate-500 mt-1">Render + GitHub CI/CD</p>
                </div>
              </div>

              <div className="card p-6">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Recursos adicionales</h4>
                <div className="space-y-2">
                  <a href="/bpmn-aliados.html" target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                    <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg flex items-center justify-center">
                      <Workflow size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Flujo BPMN — Trazabilidad Beta</p>
                      <p className="text-xs text-slate-500">Diagrama interactivo del flujo de aliados</p>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-primary-600" />
                  </a>
                  <a href="/bpmn-process.html" target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                      <GitBranch size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Flujo BPMN — Liquidación</p>
                      <p className="text-xs text-slate-500">Flujo de aprobación de comisiones</p>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-primary-600" />
                  </a>
                  <a href="https://github.com/bgaleanotec-maker/liquidador-primas-comerciales" target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                    <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center">
                      <Code2 size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Código fuente</p>
                      <p className="text-xs text-slate-500">Repositorio GitHub</p>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-primary-600" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Docs
