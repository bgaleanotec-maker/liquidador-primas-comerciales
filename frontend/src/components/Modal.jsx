import React, { useEffect } from 'react'
import { X } from 'lucide-react'

const Modal = ({ isOpen, onClose, title, subtitle, children, size = 'md', footer }) => {
  useEffect(() => {
    if (!isOpen) return
    const onEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700`}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
