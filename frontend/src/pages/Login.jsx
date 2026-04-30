import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Users, Activity, Database, Zap, Workflow, FileText, BookOpen } from 'lucide-react'

const isDev = import.meta.env.DEV

const QUICK_ACCESS = [
  { label: 'Admin',       email: 'admin@primax.com',                  password: 'Admin2024!',       role: 'Administrador' },
  { label: 'Supervisor',  email: 'lina.delmarflorez@primax.com',     password: 'Beta2026!',        role: 'Supervisor de equipo' },
  { label: 'Profesional', email: 'juan.posada@primax.com',           password: 'Beta2026!',        role: 'Profesional' },
  { label: 'Aprobador',   email: 'aprobador@primax.com',              password: 'Approver2024!',    role: 'Aprobador' },
]

const FEATURES = [
  { icon: Users,    title: '683 aliados', desc: 'Maestro centralizado del diccionario de firmas con NIT, BP y sociedad.' },
  { icon: Activity, title: 'Historia temporal', desc: 'Saber quién era el responsable en cualquier fecha pasada.' },
  { icon: Database, title: 'API y exports', desc: 'Resolver vía REST/ODBC y export Excel para reportería externa.' },
  { icon: Zap,      title: 'Roles & permisos', desc: 'Cada supervisor administra solo su equipo. Profesionales ven sus números.' },
]

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const loggedUser = await login(email, password)
    setLoading(false)
    if (loggedUser) {
      let target = '/dashboard'
      if (loggedUser.role === 'professional') target = '/my-dashboard'
      else if (loggedUser.role === 'supervisor') target = '/supervisor'
      navigate(target)
    }
  }

  const fillCredential = (em, pw) => { setEmail(em); setPassword(pw) }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        {/* decorative shapes */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center font-bold text-xl border border-white/20">
              P
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Primax</p>
              <p className="text-xs text-primary-100">Liquidador de Primas Comerciales</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur rounded-full text-xs font-medium border border-white/20 mb-4">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Beta · Aliados con historia temporal
              </span>
              <h2 className="text-4xl font-bold leading-tight tracking-tight">
                Trazabilidad real entre <span className="text-primary-200">ventas</span> y sus <span className="text-primary-200">responsables.</span>
              </h2>
              <p className="text-primary-100 mt-3 text-base leading-relaxed">
                Reasignaciones, vacaciones e incapacidades dejaron de ser un caos. Cada venta se liquida contra quien era responsable <em>en la fecha exacta</em>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4">
                  <Icon size={18} className="text-primary-200 mb-2" />
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-primary-100 mt-0.5 leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-primary-200">
              v1.0.0 Beta &middot; © 2026 Primax &middot; Galeano Herrera
            </p>
            <div className="flex gap-2">
              <a
                href="/bpmn-aliados.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-lg text-xs font-medium transition-colors"
              >
                <Workflow size={13} /> Flujo BPMN
              </a>
              <a
                href="/static/propuesta.docx"
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-lg text-xs font-medium transition-colors"
              >
                <FileText size={13} /> Propuesta
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              P
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Primax</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Primas Comerciales</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bienvenido</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5">Ingresa tus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@empresa.com"
                  className="w-full pl-10 pr-3 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Validando…' : (
                <>
                  Iniciar sesión
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick access */}
          {isDev || true ? (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Acceso rápido demo</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACCESS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => fillCredential(u.email, u.password)}
                    className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary-500" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{u.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">{u.role}</p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-3 text-center">
                Click sobre un perfil rellena las credenciales automáticamente.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Login
