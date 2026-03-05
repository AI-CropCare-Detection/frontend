import { useState } from 'react'

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  const [rememberDevice, setRememberDevice] = useState(false)
  const [clearLocalData, setClearLocalData] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    // Clear local data if requested
    if (clearLocalData) {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.warn('Failed to clear storage:', e)
      }
    } else {
      // Always clear session storage on logout for security
      try {
        sessionStorage.clear()
      } catch (e) {
        console.warn('Failed to clear sessionStorage:', e)
      }
    }
    
    // Close modal first
    onClose()
    
    // Then confirm logout (which will sign out and redirect)
    await onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="logout-title">
      <div className="glass-modal dark:glass-modal-dark rounded-2xl max-w-2xl w-full p-6 md:p-8">
        <h2 id="logout-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Log out?</h2>
        <p className="text-slate-700 dark:text-slate-200 text-sm mb-4">You will be redirected to the login screen. Sign in again to continue.</p>
        <label className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm mb-2">
          <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} className="rounded" />
          Remember this device (for future “Stay signed in”)
        </label>
        <label className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm mb-4">
          <input type="checkbox" checked={clearLocalData} onChange={(e) => setClearLocalData(e.target.checked)} className="rounded" />
          Clear local data (cache, settings) on logout
        </label>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg glass-input text-slate-800 dark:text-slate-200 font-medium hover:bg-white/30 backdrop-blur-sm transition-all">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="px-4 py-2 rounded-lg glass-button text-white font-medium transition-all">
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
