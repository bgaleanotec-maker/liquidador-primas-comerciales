import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, FileText, Users, GitBranch, Download, ChevronRight, ChevronDown, X } from 'lucide-react'

const isDev = import.meta.env.DEV

const DOCS_TABS = [
  { id: 'sistema', label: 'Sistema', icon: FileText },
  { id: 'flujo', label: 'Flujo Aprobacion', icon: GitBranch },
  ...(isDev ? [{ id: 'usuarios', label: 'Usuarios', icon: Users }] : []),
]

const USERS_TABLE = isDev ? [
  { email: 'superadmin@primax.com', password: 'SuperAdmin2024!', role: 'Super Admin', bu: 'Todas' },
  { email: 'admin@primax.com', password: 'Admin2024!', role: 'Admin', bu: 'Todas' },
  { email: 'aprobador@primax.com', password: 'Approver2024!', role: 'Aprobador', bu: 'Todas' },
  { email: 'analista.vl@primax.com', password: 'Analyst2024!', role: 'Analista', bu: 'Vanti Listo' },
  { email: 'analista.sat@primax.com', password: 'Analyst2024!', role: 'Analista', bu: 'Saturacion' },
  { email: 'analista.com@primax.com', password: 'Analyst2024!', role: 'Analista', bu: 'Comercial' },
  { email: 'viewer@primax.com', password: 'Viewer2024!', role: 'Viewer', bu: 'Todas' },
] : []

const MODULES = [
  { icon: '⚖️', name: 'Gobernanza de Variables', desc: 'LLAVES y KPIs con pesos dinámicos auto-normalizados' },
  { icon: '📥', name: 'Ingesta de Datos', desc: 'Fase 1: CSV/Excel · Fase 2: BigQuery OAuth (AD)' },
  { icon: '🧮', name: 'Liquidación', desc: 'Cálculo automático de primas con score LLAVE ponderado' },
  { icon: '✅', name: 'Flujos de Aprobación', desc: 'Analista → Aprobador → Admin → Pago (multi-nivel)' },
  { icon: '📊', name: 'Dashboard & Reportes', desc: 'Métricas en tiempo real y exportación automática' },
  { icon: '🔐', name: 'Administración', desc: '5 roles: Super Admin, Admin, Aprobador, Analista, Viewer' },
]

const SistemaTab = () => (
  <div className="space-y-4">
    <div>
      <h3 className="text-sm font-bold text-gray-800 mb-1">Liquidador de Primas Comerciales — Vanti</h3>
      <p className="text-xs text-gray-600">Sistema integral para el cálculo, aprobación y reporte de primas comerciales para las 6 unidades de negocio: <strong>VL, VM, NE, SIC, SAT, COM</strong>.</p>
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-700 mb-2">Módulos disponibles:</p>
      <div className="grid grid-cols-1 gap-1.5">
        {MODULES.map(m => (
          <div key={m.name} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2">
            <span className="text-base leading-none mt-0.5">{m.icon}</span>
            <div>
              <p className="text-xs font-semibold text-gray-800">{m.name}</p>
              <p className="text-xs text-gray-500">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-blue-800 mb-1">Stack Técnico</p>
      <p className="text-xs text-blue-700">Flask + Python 3.11 · React 18 + Vite · PostgreSQL · JWT Auth · Render.com</p>
    </div>
  </div>
)

const FlujoTab = () => (
  <div className="space-y-3">
    <p className="text-xs text-gray-600">El proceso de liquidación sigue 4 etapas secuenciales de aprobación:</p>
    <div className="space-y-2">
      {[
        { step: '1', label: 'Analista ingresa datos', desc: 'Carga KPIs vía CSV o manual. Genera liquidación en estado DRAFT.', color: 'bg-blue-100 border-blue-300 text-blue-800' },
        { step: '2', label: 'Aprobador N1 revisa', desc: 'Verifica valores y aprueba o rechaza con comentarios.', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
        { step: '3', label: 'Admin N2 valida', desc: 'Revisión final de negocio. Aprueba para pago.', color: 'bg-orange-100 border-orange-300 text-orange-800' },
        { step: '4', label: 'Pago ejecutado', desc: 'Estado APPROVED. Reporte automático generado.', color: 'bg-green-100 border-green-300 text-green-800' },
      ].map((item, i) => (
        <div key={i} className={`border rounded-lg p-2.5 ${item.color}`}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white bg-opacity-60 flex items-center justify-center text-xs font-bold">{item.step}</span>
            <span className="text-xs font-semibold">{item.label}</span>
          </div>
          <p className="text-xs mt-1 ml-7 opacity-80">{item.desc}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
      <p className="text-xs font-semibold text-gray-700 mb-1">Fórmula de cálculo</p>
      <code className="text-xs text-gray-600 font-mono">Score = Σ(KPI_valor / KPI_meta × peso_norm)</code>
      <br />
      <code className="text-xs text-gray-600 font-mono">Prima = Score × % Prima × Salario Base</code>
    </div>
  </div>
)

const UsuariosTab = () => (
  <div className="space-y-3">
    <p className="text-xs text-gray-500">Usuarios de prueba precargados en el sistema:</p>
    <div className="space-y-1.5">
      {USERS_TABLE.map((u, i) => (
        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-semibold text-gray-800">{u.role}</span>
            <span className="text-xs text-gray-400">{u.bu}</span>
          </div>
          <p className="text-xs text-blue-700 font-mono">{u.email}</p>
          <p className="text-xs text-gray-500 font-mono">{u.password}</p>
        </div>
      ))}
    </div>
  </div>
)

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('sistema')
  const [showDocs, setShowDocs] = useState(false)
  const [showBpmn, setShowBpmn] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'closeBpmn') {
        setShowBpmn(false)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const success = await login(email, password)
    setLoading(false)
    if (success) {
      navigate('/dashboard')
    }
  }

  const fillCredential = (email, password) => {
    setEmail(email)
    setPassword(password)
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'sistema': return <SistemaTab />
      case 'flujo': return <FlujoTab />
      case 'usuarios': return <UsuariosTab />
      default: return <SistemaTab />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex gap-4">

        {/* ===== LEFT: DOCUMENTATION PANEL ===== */}
        <div className="hidden lg:flex flex-col w-96 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl border border-white border-opacity-20 overflow-hidden">
          {/* Docs Header */}
          <div className="p-5 border-b border-white border-opacity-20">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📋</div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Documentación</h2>
                <p className="text-primary-200 text-xs">Sistema de Primas Comerciales</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white border-opacity-20">
            {DOCS_TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-all ${
                    activeTab === tab.id
                      ? 'bg-white bg-opacity-20 text-white font-semibold border-b-2 border-white'
                      : 'text-primary-200 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 overflow-y-auto bg-white rounded-b-none">
            {renderTab()}
          </div>

          {/* Proposal Download + BPMN */}
          <div className="p-4 bg-white border-t border-gray-100 space-y-2">
            <button
              type="button"
              onClick={() => setShowBpmn(true)}
              className="flex items-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              <GitBranch size={14} />
              Ver Flujo del Proceso
            </button>
            <a
              href="/static/propuesta.docx"
              download
              className="flex items-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              <Download size={14} />
              Descargar Propuesta Completa (30 días)
            </a>
          </div>
        </div>

        {/* ===== RIGHT: LOGIN CARD ===== */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="text-5xl">💰</div>
              </div>
              <h1 className="text-3xl font-bold text-center">Liquidador</h1>
              <p className="text-center text-primary-100 mt-1">Primas Comerciales • Vanti</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2.5 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Mobile: Docs Toggle */}
            <div className="lg:hidden px-8 pb-4 space-y-2">
              <button
                type="button"
                onClick={() => setShowBpmn(true)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-indigo-700 border border-indigo-300 rounded-lg px-4 py-2.5 hover:bg-indigo-50 transition-colors"
              >
                <GitBranch size={14} /> Ver Proceso
              </button>
              <button
                onClick={() => setShowDocs(!showDocs)}
                className="w-full flex items-center justify-between text-sm font-semibold text-primary-700 border border-primary-200 rounded-lg px-4 py-2.5 hover:bg-primary-50 transition-colors"
              >
                <span className="flex items-center gap-2"><FileText size={14} /> Ver Documentación y Usuarios</span>
                {showDocs ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {showDocs && (
                <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex border-b border-gray-200">
                    {DOCS_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 text-xs py-2 transition-all ${
                          activeTab === tab.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 max-h-64 overflow-y-auto">
                    {renderTab()}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Login Buttons (dev only) */}
            {isDev && (
              <div className="px-8 pb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Acceso rapido (demo):</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Super Admin', email: 'superadmin@primax.com', password: 'SuperAdmin2024!' },
                    { label: 'Analista VL', email: 'analista.vl@primax.com', password: 'Analyst2024!' },
                    { label: 'Aprobador', email: 'aprobador@primax.com', password: 'Approver2024!' },
                    { label: 'Viewer', email: 'viewer@primax.com', password: 'Viewer2024!' },
                  ].map(u => (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => fillCredential(u.email, u.password)}
                      className="text-xs bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 rounded-lg px-3 py-2 transition-all font-medium"
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-3 text-center text-xs text-gray-500 border-t border-gray-200">
              v1.0.0 • Liquidador Primas Comerciales • Vanti S.A. E.S.P.
            </div>
          </div>
        </div>

      </div>

      {/* ===== BPMN MODAL OVERLAY ===== */}
      {showBpmn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ animation: 'bpmnFadeIn 0.2s ease-out' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
            onClick={() => setShowBpmn(false)}
          />

          {/* Modal content */}
          <div className="relative z-10 flex flex-col items-end" style={{ width: '95vw', height: '90vh' }}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowBpmn(false)}
              className="mb-2 flex items-center gap-1.5 bg-white text-gray-800 hover:bg-gray-100 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg transition-colors"
            >
              <X size={14} />
              Cerrar
            </button>

            {/* iframe */}
            <iframe
              src="/bpmn-process.html"
              title="Flujo del Proceso BPMN"
              className="w-full flex-1 rounded-xl shadow-2xl border-0 bg-white"
              style={{ width: '95vw', height: 'calc(90vh - 44px)' }}
              allow="fullscreen"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes bpmnFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default Login
