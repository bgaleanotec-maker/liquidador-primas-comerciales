import React from 'react'

const cfg = {
  draft:        { dot: 'bg-slate-400',   cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', label: 'Borrador' },
  submitted:    { dot: 'bg-blue-500',    cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Enviado' },
  approved:     { dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Aprobado' },
  rejected:     { dot: 'bg-rose-500',    cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', label: 'Rechazado' },
  paid:         { dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Pagado' },
  pending:      { dot: 'bg-amber-500',   cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'Pendiente' },
  active:       { dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Activo' },
  inactive:     { dot: 'bg-slate-400',   cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', label: 'Inactivo' },
  open:         { dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Abierto' },
  closed:       { dot: 'bg-slate-400',   cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', label: 'Cerrado' },
  admin:        { dot: 'bg-violet-500',  cls: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', label: 'Administrador' },
  approver:     { dot: 'bg-blue-500',    cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Aprobador' },
  analyst:      { dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Analista' },
  vacation:     { dot: 'bg-amber-500',   cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'Vacaciones' },
  disability:   { dot: 'bg-orange-500',  cls: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', label: 'Incapacidad' },
  leave:        { dot: 'bg-indigo-500',  cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', label: 'Permiso' },
  reassigned:   { dot: 'bg-blue-500',    cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Reasignado' },
  sin_asignar:  { dot: 'bg-rose-500',    cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', label: 'Sin asignar' },
}

const StatusBadge = ({ status, label }) => {
  const c = cfg[status] || cfg.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
      {label || c.label}
    </span>
  )
}

export default StatusBadge
