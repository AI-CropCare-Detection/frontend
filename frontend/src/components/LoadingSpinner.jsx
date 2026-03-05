import { memo } from 'react'

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900" role="status" aria-live="polite">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default memo(LoadingSpinner)
