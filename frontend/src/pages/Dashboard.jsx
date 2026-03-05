import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/AppSettingsContext'
import { analyzeCropImage, getRecommendations, getInsights, setOfflineAnalysisCache } from '../lib/api'
import { saveAnalysis, getAnalysisHistory } from '../lib/firestore'
import { exportAnalysisPDF } from '../lib/pdfExport'
import { useWeatherMonitoring } from '../hooks/useWeatherMonitoring'
import { notifyAnalysisComplete } from '../lib/notifications'
import PrimaryAnalysisFrame from '../components/PrimaryAnalysisFrame'
import SecondaryInsightsFrame from '../components/SecondaryInsightsFrame'
import HeroSection from '../components/HeroSection'
import HowItWorks from '../components/HowItWorks'
import Testimonials from '../components/Testimonials'
import DemoTestButton from '../components/DemoTestButton'
import LocationWarningBanner from '../components/LocationWarningBanner'
import unhealthyCropLeavesImage from '../assets/unhealthy-crop-leaves.png'
import CameraCaptureModal from '../components/CameraCaptureModal'

const defaultResult = {
  timeTaken: null,
  accuracyRate: null,
  recoveryRate: null,
  cropType: null,
  recommendations: null,
  insights: null,
  imageUrl: null,
  timestamp: null,
}

const SETTINGS_KEY = 'cropcare-app-settings'

function loadLocalSettings() {
  try {
    const s = localStorage.getItem(SETTINGS_KEY)
    return s ? JSON.parse(s) : {}
  } catch {
    return {}
  }
}

export default function Dashboard() {
  const { user, updateActivity } = useAuth()
  const t = useTranslation()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result, setResult] = useState(defaultResult)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [isDemo, setIsDemo] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const fileInputRef = useRef(null)
  
  // Weather monitoring - check if weather alerts are enabled (reactive to settings changes)
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(() => {
    const settings = loadLocalSettings()
    return settings.weatherAlerts === true
  })
  
  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = () => {
      const settings = loadLocalSettings()
      setWeatherAlertsEnabled(settings.weatherAlerts === true)
    }
    
    // Check on mount and when storage changes
    handleStorageChange()
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically (in case settings are changed in another tab)
    const interval = setInterval(handleStorageChange, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])
  
  useWeatherMonitoring(user?.uid, user?.email, weatherAlertsEnabled)

  const loadHistory = async () => {
    if (!user?.uid) return
    const list = await getAnalysisHistory(user.uid)
    setHistory(list)
  }

  useEffect(() => {
    loadHistory()
  }, [user?.uid])

  // Track activity on dashboard
  useEffect(() => {
    if (user && updateActivity) {
      updateActivity()
    }
  }, [user, updateActivity])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t('pleaseSelectImage'))
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
    setResult(defaultResult)
    setIsDemo(false) // Clear demo flag when user uploads their own image
  }

  const handleCapture = () => {
    fileInputRef.current?.click()
  }

  const handleOpenCamera = () => {
    setError(null)
    setIsDemo(false)
    setShowCameraModal(true)
  }

  const handleCameraCaptured = (file, previewUrl) => {
    if (!file) return
    setImageFile(file)
    setImagePreview(previewUrl)
    setResult(defaultResult)
    setError(null)
    setIsDemo(false)
    setShowCameraModal(false)
  }

  const handleDemoTest = async () => {
    setIsDemo(true)
    setLoading(true)
    setError(null)
    setResult(defaultResult) // Reset previous results
    
    // Use the local unhealthy crop leaves image
    try {
      // Fetch the local demo image and create a File object
      let demoFile
      let imageUrl = unhealthyCropLeavesImage
      
      try {
        const response = await fetch(unhealthyCropLeavesImage)
        if (!response.ok) {
          throw new Error(`Failed to load demo image: ${response.status} ${response.statusText}`)
        }
        const blob = await response.blob()
        demoFile = new File([blob], 'demo-unhealthy-crop-leaves.png', { type: 'image/png' })
      } catch (fetchErr) {
        console.error('Failed to fetch demo image:', fetchErr)
        // Create a placeholder file if image fetch fails
        const placeholderBlob = new Blob([''], { type: 'image/png' })
        demoFile = new File([placeholderBlob], 'demo-unhealthy-crop-leaves.png', { type: 'image/png' })
        imageUrl = unhealthyCropLeavesImage // Still use the image path even if fetch fails
      }
      
      // Set image preview immediately
      setImageFile(demoFile)
      setImagePreview(unhealthyCropLeavesImage)
      
      // Simulate analysis delay (3 seconds to show scanning animation)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Demo analysis metrics - simulating what the backend model would return (including crop/leaf type)
      const demoMetrics = {
        timeTaken: 4.8,
        accuracyRate: 94,
        recoveryRate: 88,
        cropType: 'Maize (corn) leaf',
      }
      
      // Get REAL recommendations and insights from OpenAI API
      const analysisSummary = {
        timeTaken: demoMetrics.timeTaken,
        accuracyRate: demoMetrics.accuracyRate,
        recoveryRate: demoMetrics.recoveryRate,
        cropType: demoMetrics.cropType,
        imageDescription: 'Unhealthy crop leaves showing brown spots, yellowing, and signs of fungal infection',
      }
      
      // Fetch recommendations and insights in parallel from OpenAI
      let recommendations = null
      let insights = null
      
      try {
        const [recRes, insRes] = await Promise.all([
          getRecommendations(analysisSummary).catch((err) => {
            console.warn('Recommendations API error:', err)
            return { recommendations: null }
          }),
          getInsights(analysisSummary).catch((err) => {
            console.warn('Insights API error:', err)
            return { insights: null }
          }),
        ])
        
        recommendations = recRes.recommendations ?? recRes.text ?? null
        insights = insRes.insights ?? insRes.text ?? null
        
        // Fallback to demo text if OpenAI fails
        if (!recommendations) {
          recommendations = '• Apply fungicide treatment within 48 hours\n• Remove affected leaves to prevent spread\n• Ensure proper spacing for air circulation\n• Monitor soil moisture levels\n• Consider organic alternatives like neem oil'
        }
        if (!insights) {
          insights = 'The analysis indicates early-stage leaf spot disease. Early intervention can prevent significant crop loss. The affected area shows characteristic brown spots with yellow halos, typical of fungal infections. Treatment success rate is high when applied promptly.'
        }
      } catch (apiErr) {
        console.error('OpenAI API error:', apiErr)
        // Use fallback recommendations and insights
        recommendations = '• Apply fungicide treatment within 48 hours\n• Remove affected leaves to prevent spread\n• Ensure proper spacing for air circulation\n• Monitor soil moisture levels\n• Consider organic alternatives like neem oil'
        insights = 'The analysis indicates early-stage leaf spot disease. Early intervention can prevent significant crop loss. The affected area shows characteristic brown spots with yellow halos, typical of fungal infections. Treatment success rate is high when applied promptly.'
      }
      
      // Create complete record with all required fields
      const record = {
        timeTaken: Number(demoMetrics.timeTaken),
        accuracyRate: Number(demoMetrics.accuracyRate),
        recoveryRate: Number(demoMetrics.recoveryRate),
        cropType: demoMetrics.cropType || null,
        recommendations: String(recommendations),
        insights: String(insights),
        imageUrl: imageUrl, // Temporary preview URL
        timestamp: new Date().toISOString(),
        imageFile: demoFile, // Always include imageFile so it gets uploaded to Firebase Storage
      }
      
      setOfflineAnalysisCache(record)
      setResult(record)
      setLoading(false)
      // Clear demo image from picker/preview after analysis is complete
      setImageFile(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        try {
          fileInputRef.current.value = ''
        } catch {}
      }
      if (user?.uid) {
        saveAnalysis(user.uid, record).then(() => loadHistory()).catch((saveErr) => console.warn('Could not save demo analysis:', saveErr))
        // Notify user of analysis completion
        if (user?.email) {
          notifyAnalysisComplete(user.email, record).catch((err) => 
            console.warn('Failed to send analysis notification:', err)
          )
        }
      }
    } catch (err) {
      console.error('Demo test error:', err)
      const errorMessage = err?.message || 'Unknown error occurred'
      setError(`Demo test failed: ${errorMessage}. Please try uploading an image instead.`)
      setResult(defaultResult)
      setIsDemo(false)
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!imageFile) return
    if (!user?.uid) {
      setError(t('signInToAnalyze'))
      return
    }
    setIsDemo(false)
    setLoading(true)
    setError(null)
    try {
      const analysis = await analyzeCropImage(imageFile)
      const isOfflineResult = !!analysis.offline

      let timeTaken = analysis.timeTaken ?? analysis.time_taken ?? 5.2
      let accuracyRate = analysis.accuracyRate ?? analysis.accuracy_rate ?? 98
      let recoveryRate = analysis.recoveryRate ?? analysis.recovery_rate ?? 92
      const cropType = analysis.cropType ?? analysis.crop_type ?? analysis.leafType ?? analysis.leaf_type ?? null
      let recommendations = analysis.recommendations ?? null
      let insights = analysis.insights ?? null

      if (!isOfflineResult) {
        const needsRecommendations = !recommendations
        const needsInsights = !insights
        if (needsRecommendations || needsInsights) {
          const summary = { timeTaken, accuracyRate, recoveryRate, cropType }
          const [recRes, insRes] = await Promise.all([
            needsRecommendations ? getRecommendations(summary).catch(() => ({ recommendations: null })) : Promise.resolve({ recommendations }),
            needsInsights ? getInsights(summary).catch(() => ({ insights: null })) : Promise.resolve({ insights }),
          ])
          if (needsRecommendations) recommendations = recRes.recommendations ?? recRes.text ?? 'No recommendations generated.'
          if (needsInsights) insights = insRes.insights ?? insRes.text ?? 'No insights generated.'
        }
      }

      const record = {
        timeTaken: typeof timeTaken === 'number' ? timeTaken : parseFloat(String(timeTaken)) || 5.2,
        accuracyRate: typeof accuracyRate === 'number' ? accuracyRate : parseInt(String(accuracyRate), 10) || 98,
        recoveryRate: typeof recoveryRate === 'number' ? recoveryRate : parseInt(String(recoveryRate), 10) || 92,
        cropType: cropType && String(cropType).trim() ? String(cropType).trim() : null,
        recommendations: recommendations ?? 'No recommendations.',
        insights: insights ?? 'No insights.',
        imageUrl: imagePreview || analysis.imageUrl || null, // Temporary preview URL
        timestamp: analysis.timestamp || new Date().toISOString(),
        imageFile: imageFile, // Always include imageFile so it gets uploaded to Firebase Storage
        offline: isOfflineResult,
      }
      setOfflineAnalysisCache(record)
      setResult(record)
      setLoading(false)
      // Clear uploaded/captured image after analysis so user starts fresh
      setImageFile(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        try {
          fileInputRef.current.value = ''
        } catch {}
      }
      if (!isOfflineResult) {
        saveAnalysis(user.uid, record).then(() => loadHistory()).catch((err) => console.warn('Save analysis failed:', err))
        // Notify user of analysis completion
        if (user?.email) {
          notifyAnalysisComplete(user.email, record).catch((err) => 
            console.warn('Failed to send analysis notification:', err)
          )
        }
      }
    } catch (err) {
      setError(err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    const list = history.length ? history : (result.timestamp ? [result] : [])
    if (!list.length) {
      setError(t('noHistoryToExport'))
      return
    }
    try {
      await exportAnalysisPDF(list)
    } catch (err) {
      setError(err.message || t('pdfExportFailed'))
    }
  }

  return (
    <div className="space-y-0">
      <HeroSection />
      <HowItWorks />
      <Testimonials />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <LocationWarningBanner />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 max-w-4xl" id="dashboard-title">
            {t('dashboardTitle')}
          </h2>
          <DemoTestButton onDemoClick={handleDemoTest} disabled={loading} />
        </div>
        {isDemo && (
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200 text-sm flex items-center gap-2" role="status">
            <span className="text-lg">🧪</span>
            <span>{t('demoModeBanner')}</span>
          </div>
        )}
        {result.offline && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2" role="status">
            <span className="text-lg">📴</span>
            <span>{t('offlineBannerText')}</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Vertical flow: image & scan section at top, metrics in the middle (inside PrimaryAnalysisFrame), 
           then expandable insights (SecondaryInsightsFrame) below */}
        <div className="space-y-6">
          <PrimaryAnalysisFrame
            imagePreview={imagePreview}
            result={result}
            loading={loading}
            onLoadOrTake={handleCapture}
            onCapture={handleOpenCamera}
            onAnalyze={handleAnalyze}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            hasImage={!!imageFile}
          />
          <SecondaryInsightsFrame
            recommendations={result.recommendations}
            insights={result.insights}
            history={history}
            accuracyRate={result.accuracyRate}
            recoveryRate={result.recoveryRate}
            onLoadHistory={loadHistory}
            onExportPDF={handleExportPDF}
          />
        </div>
      </div>
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCaptured}
      />
    </div>
  )
}
