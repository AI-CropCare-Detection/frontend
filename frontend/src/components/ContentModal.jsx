import { useEffect } from 'react'
import { useTranslation } from '../contexts/AppSettingsContext'
import { X } from 'lucide-react'

export default function ContentModal({ isOpen, onClose, title, children }) {
  const t = useTranslation()

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-sm overflow-y-auto overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-modal-title"
      style={{ paddingTop: 'max(2rem, 5vh)', paddingBottom: 'max(2rem, 5vh)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Large centered modal: grows with content; whole overlay scrolls so user can scroll the page to see everything */}
      <div
        className="glass-modal dark:glass-modal-dark rounded-2xl p-6 md:p-8 lg:p-10 w-full max-w-4xl lg:max-w-6xl flex flex-col relative min-h-[50vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8 flex-shrink-0">
          <h2 id="content-modal-title" className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/10"
            aria-label={t('close')}
          >
            <X size={28} />
          </button>
        </div>

        {/* Content: no inner scroll trap – modal height follows content; user scrolls the whole page (overlay) */}
        <div className="flex-1 overflow-x-hidden text-base md:text-lg text-slate-900 dark:text-slate-100 pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}
