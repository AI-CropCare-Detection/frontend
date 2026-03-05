import { useTranslation } from '../contexts/AppSettingsContext'

export default function Accessibility() {
  const t = useTranslation()
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass-card dark:glass-card-dark rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t('accessibilityTitle')}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">We aim to make AI-Powered CropCare usable by everyone. We follow WCAG guidelines where possible: semantic HTML, ARIA labels, keyboard navigation, and responsive design. If you encounter barriers, contact support@aicropcare.com.</p>
      </div>
    </div>
  )
}
