export const formatCurrency = (value) => {
  if (!value && value !== 0) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value)
}

export const formatNumber = (value, decimals = 2) => {
  if (!value && value !== 0) return '0'
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export const formatPercent = (value) => {
  if (!value && value !== 0) return '0%'
  return `${formatNumber(value, 1)}%`
}

export const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getCumulativePercent = (actual, target) => {
  if (!target || target === 0) return 0
  return (actual / target) * 100
}

export const getPercentColor = (percent) => {
  if (percent >= 80) return 'text-green-600'
  if (percent >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export const getPercentBgColor = (percent) => {
  if (percent >= 80) return 'bg-green-100'
  if (percent >= 60) return 'bg-amber-100'
  return 'bg-red-100'
}
