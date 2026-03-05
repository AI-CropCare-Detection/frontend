import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/AppSettingsContext'
import { Scan } from 'lucide-react'
import logoImage from '../assets/logo.png'

export default function StickyNavbar() {
  const { user } = useAuth()
  const t = useTranslation()
  const navigate = useNavigate()

  const handleScanNow = () => {
    if (user) {
      navigate('/')
    } else {
      navigate('/signin')
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-800 shadow-md border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="AI-Powered CropCare Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-lg text-slate-800 dark:text-slate-100">AI-Powered-CropCare</span>
          </Link>

          {/* Center: Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">{t('home')}</Link>
            <Link to="/about" className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">{t('about')}</Link>
            <Link to="/mobile-app" className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">{t('mobileAppNav')}</Link>
            <Link to="/help" className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">{t('helpCenter')}</Link>
          </div>

          <button
            onClick={handleScanNow}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          >
            <Scan size={18} />
            <span>{t('scanNow')}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
