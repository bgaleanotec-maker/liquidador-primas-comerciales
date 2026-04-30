import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Settings2, Upload, Calculator, CheckCircle, BarChart3,
  Shield, LogOut, Menu, X, Bell, ShoppingCart, CreditCard, Sliders,
  Briefcase, Sun, Moon, Users, UserCheck, Activity, ChevronDown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  approver: 'Aprobador',
  analyst: 'Analista',
  professional: 'Profesional',
  supervisor: 'Supervisor',
  viewer: 'Viewer',
}

const Layout = ({ children, pendingCount = 0 }) => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const sections = [
    {
      title: 'Mi espacio',
      items: [
        { path: '/portal', label: 'Mi Portal', icon: Briefcase, roles: ['admin', 'approver', 'analyst', 'professional', 'supervisor'] },
        { path: '/my-dashboard', label: 'Mi Dashboard', icon: Activity, roles: ['professional'] },
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'approver', 'analyst', 'supervisor', 'super_admin'] },
      ],
    },
    {
      title: 'Aliados (Beta)',
      items: [
        { path: '/aliados', label: 'Aliados', icon: Users, roles: ['admin', 'super_admin', 'analyst', 'supervisor'] },
        { path: '/supervisor', label: 'Mi Equipo', icon: UserCheck, roles: ['supervisor', 'admin', 'super_admin'] },
      ],
    },
    {
      title: 'Operación',
      items: [
        { path: '/data-entry', label: 'Ingesta de Datos', icon: Upload, roles: ['analyst', 'admin', 'super_admin'] },
        { path: '/sales', label: 'Ventas', icon: ShoppingCart, roles: ['admin', 'super_admin', 'analyst'] },
        { path: '/liquidations', label: 'Liquidaciones', icon: Calculator, roles: ['admin', 'super_admin', 'analyst', 'approver'] },
        { path: '/approvals', label: 'Aprobaciones', icon: CheckCircle, roles: ['approver', 'admin', 'super_admin'], badge: pendingCount },
        { path: '/payments', label: 'Comisiones', icon: CreditCard, roles: ['admin', 'super_admin', 'approver'] },
        { path: '/reports', label: 'Reportes', icon: BarChart3, roles: ['admin', 'super_admin', 'approver', 'analyst'] },
      ],
    },
    {
      title: 'Configuración',
      items: [
        { path: '/variables', label: 'Variables', icon: Settings2, roles: ['admin', 'super_admin'] },
        { path: '/config', label: 'Config LLAVEs', icon: Sliders, roles: ['admin', 'super_admin'] },
        { path: '/admin', label: 'Administración', icon: Shield, roles: ['admin', 'super_admin'] },
      ],
    },
  ]

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = () => logout()

  const initials = (user?.name || '?')
    .split(' ').filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('')

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className={`${
        mobileOpen ? 'w-72' : 'w-72'
      } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col
      max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:h-full max-lg:z-40
      ${!mobileOpen ? 'max-lg:w-0 max-lg:border-0 max-lg:overflow-hidden' : ''}`}>
        {/* Brand */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30">
              P
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Primax</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Primas Comerciales</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          {sections.map((section) => {
            const visibles = section.items.filter((it) => it.roles.includes(user?.role))
            if (visibles.length === 0) return null
            return (
              <div key={section.title}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {visibles.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    return (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); setMobileOpen(false) }}
                        className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                          ${active
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                          }`}
                      >
                        <Icon size={18} className={active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sesión activa</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-slate-600 dark:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all">
              <Bell size={18} />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
