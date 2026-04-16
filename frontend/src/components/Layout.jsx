import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Settings2,
  Upload,
  Calculator,
  CheckCircle,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  ShoppingCart,
  CreditCard,
  Sliders,
  Briefcase
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Layout = ({ children, pendingCount = 0 }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const menuItems = [
    { path: '/portal', label: 'Mi Portal', icon: Briefcase, roles: ['admin', 'approver', 'analyst', 'professional'] },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'approver', 'analyst'] },
    { path: '/variables', label: 'Gobernanza de Variables', icon: Settings2, roles: ['admin'] },
    { path: '/data-entry', label: 'Ingesta de Datos', icon: Upload, roles: ['analyst', 'admin'] },
    { path: '/liquidations', label: 'Liquidaciones', icon: Calculator, roles: ['admin', 'analyst', 'approver'] },
    { path: '/approvals', label: 'Aprobaciones', icon: CheckCircle, roles: ['approver', 'admin'], badge: pendingCount },
    { path: '/reports', label: 'Reportes', icon: BarChart3, roles: ['admin', 'approver', 'analyst'] },
    { path: '/sales', label: 'Ventas', icon: ShoppingCart, roles: ['admin', 'analyst'] },
    { path: '/payments', label: 'Comisiones', icon: CreditCard, roles: ['admin', 'approver'] },
    { path: '/config', label: 'Config LLAVEs', icon: Sliders, roles: ['admin'] },
    { path: '/admin', label: 'Administracion', icon: Shield, roles: ['admin'] }
  ]

  const visibleItems = menuItems.filter(item => item.roles.includes(user?.role))

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${
        mobileOpen ? 'w-64' : 'w-64'
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:h-full max-lg:z-40 ${
        !mobileOpen ? 'max-lg:w-0 max-lg:border-0' : ''
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💰</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Primas</h1>
              <p className="text-xs text-gray-600">Comerciales</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setMobileOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {item.badge > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-600">Conectado como</p>
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h2 className="text-lg font-semibold text-gray-900 flex-1 hidden sm:block"></h2>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900">
              <Bell size={20} />
              {pendingCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
