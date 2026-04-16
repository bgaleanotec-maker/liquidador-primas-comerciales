import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export const useApi = (apiCall) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiCall(...args)
        setData(response.data)
        return response.data
      } catch (err) {
        const message = err.response?.data?.error || err.message
        setError(message)
        toast.error(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiCall]
  )

  return { data, loading, error, execute }
}

export const useApiEffect = (apiCall, deps = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiCall()
      setData(response.data)
    } catch (err) {
      const message = err.response?.data?.error || err.message
      setError(message)
      if (err.response?.status !== 404) {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }, [apiCall])

  React.useEffect(() => {
    refetch()
  }, deps)

  return { data, loading, error, refetch }
}
