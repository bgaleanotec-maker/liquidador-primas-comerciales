import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('primax_token')
    const storedUser = localStorage.getItem('primax_user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { token, user } = response.data.data

      localStorage.setItem('primax_token', token)
      localStorage.setItem('primax_user', JSON.stringify(user))

      setToken(token)
      setUser(user)

      return user
    } catch (error) {
      const message = error.response?.data?.error || 'Error al iniciar sesión'
      toast.error(message)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('primax_token')
    localStorage.removeItem('primax_user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}
