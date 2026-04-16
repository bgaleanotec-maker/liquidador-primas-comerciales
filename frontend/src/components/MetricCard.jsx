import React from 'react'

const MetricCard = ({ icon: Icon, label, value, change, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
  }

  const changeColor = change >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {change !== undefined && (
            <p className={`text-sm font-medium mt-2 ${changeColor}`}>
              {change >= 0 ? '+' : ''}{change}% vs mes anterior
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${colorClasses[color]} p-3 rounded-lg`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard
