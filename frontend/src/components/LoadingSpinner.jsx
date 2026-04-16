import React from 'react'

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
