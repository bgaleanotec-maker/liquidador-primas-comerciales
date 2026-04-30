import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Variables from './pages/Variables'
import DataEntry from './pages/DataEntry'
import Liquidations from './pages/Liquidations'
import Approvals from './pages/Approvals'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import Sales from './pages/Sales'
import Payments from './pages/Payments'
import ConfigLlaves from './pages/ConfigLlaves'
import ProfessionalPortal from './pages/ProfessionalPortal'
import Aliados from './pages/Aliados'
import AliadoHistoria from './pages/AliadoHistoria'
import SupervisorPanel from './pages/SupervisorPanel'
import MyDashboard from './pages/MyDashboard'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/aliados" element={<ProtectedRoute element={<Aliados />} requiredRoles={['admin', 'super_admin', 'analyst', 'supervisor']} />} />
        <Route path="/aliados/:id/historia" element={<ProtectedRoute element={<AliadoHistoria />} requiredRoles={['admin', 'super_admin', 'analyst', 'supervisor', 'professional']} />} />
        <Route path="/supervisor" element={<ProtectedRoute element={<SupervisorPanel />} requiredRoles={['supervisor', 'admin', 'super_admin']} />} />
        <Route path="/my-dashboard" element={<ProtectedRoute element={<MyDashboard />} requiredRoles={['professional']} />} />
        <Route path="/variables" element={<ProtectedRoute element={<Variables />} requiredRoles={['admin']} />} />
        <Route path="/data-entry" element={<ProtectedRoute element={<DataEntry />} requiredRoles={['analyst', 'admin']} />} />
        <Route path="/liquidations" element={<ProtectedRoute element={<Liquidations />} />} />
        <Route path="/approvals" element={<ProtectedRoute element={<Approvals />} requiredRoles={['approver', 'admin']} />} />
        <Route path="/reports" element={<ProtectedRoute element={<Reports />} />} />
        <Route path="/sales" element={<ProtectedRoute element={<Sales />} requiredRoles={['admin', 'analyst']} />} />
        <Route path="/payments" element={<ProtectedRoute element={<Payments />} requiredRoles={['admin', 'approver']} />} />
        <Route path="/portal" element={<ProtectedRoute element={<ProfessionalPortal />} />} />
        <Route path="/config" element={<ProtectedRoute element={<ConfigLlaves />} requiredRoles={['admin']} />} />
        <Route path="/admin" element={<ProtectedRoute element={<Admin />} requiredRoles={['admin']} />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
