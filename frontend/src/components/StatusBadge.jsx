import React from 'react'

const statusConfig = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Borrador' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Enviado' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Pagado' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activo' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactivo' },
  open: { bg: 'bg-green-100', text: 'text-green-800', label: 'Abierto' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cerrado' },
  admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Administrador' },
  approver: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Aprobador' },
  analyst: { bg: 'bg-green-100', text: 'text-green-800', label: 'Analista' },
  vacation: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Vacaciones' },
  disability: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Incapacidad' },
  leave: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Permiso' },
  reassigned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Reasignado' },
  sin_asignar: { bg: 'bg-red-100', text: 'text-red-800', label: 'Sin asignar' }
}

const StatusBadge = ({ status, label }) => {
  const config = statusConfig[status] || statusConfig.pending
  const text = label || config.label

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {text}
    </span>
  )
}

export default StatusBadge
