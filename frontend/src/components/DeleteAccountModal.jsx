import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/AppSettingsContext'
import { X, AlertTriangle } from 'lucide-react'

export default function DeleteAccountModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const t = useTranslation()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const requiredText = 'DELETE'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (confirmText !== requiredText) {
      setError(t('deleteAccountConfirmTextMismatch'))
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/account/delete-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.uid,
          email: user?.email,
        }),
      })

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type')
      let data = {}
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (parseErr) {
            console.error('Failed to parse JSON response:', parseErr)
            throw new Error('Invalid response from server')
          }
        }
      } else {
        // If no JSON, try to get text response
        const text = await response.text()
        throw new Error(text || t('deleteAccountRequestFailed'))
      }

      if (!response.ok) {
        throw new Error(data.message || t('deleteAccountRequestFailed'))
      }

      setMessage(t('deleteAccountEmailSent'))
      setTimeout(() => {
        onClose()
        setConfirmText('')
        setMessage('')
      }, 3000)
    } catch (err) {
      console.error('Delete account request error:', err)
      setError(err.message || t('deleteAccountRequestFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div
        className="glass-modal dark:glass-modal-dark rounded-2xl p-6 md:p-8 max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 id="delete-account-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {t('deleteAccount')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-500/30 backdrop-blur-sm border border-red-400/50 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <p className="text-red-700 dark:text-red-300 text-xs">
              If you confirm, you will receive an email with a secure deletion link. Only after clicking the link will your account be permanently deleted.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/30 backdrop-blur-sm border border-red-400/50 text-red-800 dark:text-red-200 text-sm" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/50 text-emerald-800 dark:text-emerald-200 text-sm" role="status">
              {message}
            </div>
          )}

          <div>
            <label htmlFor="confirm-text" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              {t('deleteAccountTypeConfirm')} <strong>{requiredText}</strong>
            </label>
            <input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value)
                setError('')
              }}
              className="w-full rounded-lg glass-input px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none backdrop-blur-sm"
              placeholder={requiredText}
              disabled={loading || !!message}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || !!message}
              className="flex-1 px-4 py-2 rounded-lg glass-input text-slate-900 dark:text-slate-100 font-medium hover:bg-white/40 backdrop-blur-sm transition-all disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || confirmText !== requiredText || !!message}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? t('sending') : t('sendDeletionLink')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
