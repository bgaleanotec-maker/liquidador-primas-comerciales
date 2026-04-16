import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = ({ element, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Professionals can only access portal
  const defaultRoute = user?.role === 'professional' ? '/portal' : '/dashboard'

  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return <Navigate to={defaultRoute} replace />
  }

  return element
}

export default ProtectedRoute
