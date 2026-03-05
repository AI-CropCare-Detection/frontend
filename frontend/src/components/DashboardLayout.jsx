import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { usePrefetch } from '../contexts/PrefetchContext'
import { SidebarProvider } from '../contexts/SidebarContext'
import Sidebar from './Sidebar'
import StickyNavbar from './StickyNavbar'
import MainFooter from './MainFooter'
import LocationPrompt from './LocationPrompt'
import GetStartedModal from './GetStartedModal'
import { getUserProfile } from '../lib/firestore'

export default function DashboardLayout() {
  const { theme } = useTheme()
  const { user, sessionExpired } = useAuth()
  const { prefetchProfile, prefetchHistory } = usePrefetch()
  const location = useLocation()
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [locationPromptShown, setLocationPromptShown] = useState(false)
  const [showGetStartedGuide, setShowGetStartedGuide] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      prefetchProfile(user.uid)
      prefetchHistory(user.uid)
      
      // Check if location permission was already granted
      getUserProfile(user.uid).then((profile) => {
        if (!profile?.locationPermissionGranted && !locationPromptShown) {
          setShowLocationPrompt(true)
          setLocationPromptShown(true)
        }
        
        // Show Get Started guide for new users who haven't dismissed it
        // Only show on dashboard home page
        if (location.pathname === '/' && !profile?.getStartedGuideDismissed && !showGetStartedGuide) {
          // Small delay to let page load
          setTimeout(() => {
            setShowGetStartedGuide(true)
          }, 1000)
        }
      })
    }
  }, [user?.uid, prefetchProfile, prefetchHistory, locationPromptShown, location.pathname, showGetStartedGuide])

  return (
    <SidebarProvider>
      <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/30'}`} style={{
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover'
      }}>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            <StickyNavbar />
            <main className={`flex-1 overflow-y-auto overflow-x-hidden ${theme === 'dark' ? 'text-slate-200' : ''}`} id="main-content" style={{ backgroundAttachment: 'fixed' }}>
              <div className="min-h-full">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
        <MainFooter />
      </div>
      {showLocationPrompt && user?.uid && (
        <LocationPrompt
          userId={user.uid}
          onComplete={(location) => {
            setShowLocationPrompt(false)
            if (location) {
              // Start weather monitoring if location granted
              console.log('Location granted, starting weather monitoring')
            }
          }}
        />
      )}
      {showGetStartedGuide && user?.uid && (
        <GetStartedModal
          isOpen={showGetStartedGuide}
          onClose={() => setShowGetStartedGuide(false)}
          onComplete={() => setShowGetStartedGuide(false)}
        />
      )}
    </SidebarProvider>
  )
}
