import { useTranslation } from '../contexts/AppSettingsContext'

export default function Privacy() {
  const t = useTranslation()
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass-card dark:glass-card-dark rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t('privacyTitle')}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Last updated: 2026.</p>
        <div className="prose prose-slate dark:prose-invert text-slate-600 dark:text-slate-400 text-sm space-y-4">
          <p>We collect account information (email, profile data) and analysis data (images, results) to provide the service. Data is stored securely with Firebase. We do not sell your personal data. You can request deletion by contacting support@aicropcare.com. Cookie policy: we use essential cookies for authentication and preferences.</p>
        </div>
      </div>
    </div>
  )
}
