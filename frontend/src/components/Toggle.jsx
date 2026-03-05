import { memo } from 'react'

/**
 * Accessible toggle switch component
 * Supports keyboard navigation and ARIA labels
 */
function Toggle({ 
  checked, 
  onChange, 
  label, 
  description,
  id,
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`
  const descriptionId = description ? `${toggleId}-description` : undefined

  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center h-6">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={ariaLabel || label}
          aria-describedby={descriptionId || ariaDescribedBy}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
            dark:focus:ring-offset-slate-800
            ${checked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <label
          htmlFor={toggleId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
        {description && (
          <p
            id={descriptionId}
            className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export default memo(Toggle)
