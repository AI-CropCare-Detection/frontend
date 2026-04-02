import { useRef, useState, useEffect } from 'react'
import { Camera, Target, TrendingUp, Clock, Leaf, AlertCircle } from 'lucide-react'
import { useTranslation } from '../contexts/AppSettingsContext'

export default function PrimaryAnalysisFrame({
  imagePreview,
  result,
  loading,
  onLoadOrTake,
  onCapture,
  onAnalyze,
  fileInputRef,
  onFileChange,
  hasImage,
}) {
  const inputRef = fileInputRef || useRef(null)
  const cameraInputRef = useRef(null)
  const t = useTranslation()
  
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [validationPassed, setValidationPassed] = useState(false)
  const [scanning, setScanning] = useState(false)

  // Reset state when new image is uploaded
  useEffect(() => {
    if (imagePreview) {
      setValidationError(null)
      setValidationPassed(false)
      setIsValidating(false)
      setScanning(false)
    }
  }, [imagePreview])

  // Fast green detection for mobile
  const checkIfCropLeafFast = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = function(e) {
        const img = new Image()
        const timeout = setTimeout(() => {
          console.log('Fast detection timeout, assuming leaf')
          resolve(true)
        }, 2000)
        
        img.onload = function() {
          clearTimeout(timeout)
          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            const size = 100
            canvas.width = size
            canvas.height = size
            ctx.drawImage(img, 0, 0, size, size)
            
            const imageData = ctx.getImageData(0, 0, size, size)
            const data = imageData.data
            
            let greenCount = 0
            const step = 2
            
            for (let i = 0; i < data.length; i += step * 4) {
              const r = data[i]
              const g = data[i + 1]
              const b = data[i + 2]
              
              if (g > r && g > b && g > 30) {
                greenCount++
              }
            }
            
            const total = Math.floor(data.length / (step * 4))
            const percentage = (greenCount / total) * 100
            
            console.log(`Mobile validation: ${percentage.toFixed(1)}% green`)
            resolve(percentage > 0.5)
            
          } catch (error) {
            console.error('Detection error:', error)
            resolve(true)
          }
        }
        img.src = e.target.result
      }
      
      reader.onerror = () => resolve(true)
      reader.readAsDataURL(file)
    })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      const syntheticEvent = { target: { files: [file], value: previewUrl } }
      onFileChange(syntheticEvent)
      setValidationError(null)
      setValidationPassed(false)
      setIsValidating(false)
      setScanning(false)
    }
  }

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleCameraChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      const syntheticEvent = { target: { files: [file], value: previewUrl } }
      onFileChange(syntheticEvent)
      setValidationError(null)
      setValidationPassed(false)
      setIsValidating(false)
      setScanning(false)
    }
  }

  const handleAnalyze = async () => {
    if (!imagePreview) {
      setValidationError('No image selected')
      return
    }

    // Start scanning animation
    setScanning(true)
    setIsValidating(true)
    setValidationError(null)

    try {
      // Get the actual file
      let file = null
      
      if (inputRef.current && inputRef.current.files && inputRef.current.files[0]) {
        file = inputRef.current.files[0]
      } else if (cameraInputRef.current && cameraInputRef.current.files && cameraInputRef.current.files[0]) {
        file = cameraInputRef.current.files[0]
      }
      
      if (!file) {
        console.log('No file found, proceeding directly to analysis')
        setValidationPassed(true)
        setIsValidating(false)
        // Call parent's analyze function directly
        if (onAnalyze) {
          onAnalyze()
        }
        return
      }
      
      // Validate if it's a crop leaf
      const isCropLeaf = await checkIfCropLeafFast(file)
      
      if (!isCropLeaf) {
        setValidationError('❌ This is not a crop leaf. Please upload a clear photo of a plant leaf with visible green areas.')
        setScanning(false)
        setIsValidating(false)
        return
      }
      
      // Validation passed
      setValidationPassed(true)
      setIsValidating(false)
      
      // Small delay to show success message, then call analysis
      setTimeout(() => {
        setScanning(false)
        if (onAnalyze) {
          console.log('Calling parent onAnalyze function...')
          onAnalyze()
        }
      }, 800)
      
    } catch (error) {
      console.error('Validation error:', error)
      setScanning(false)
      setIsValidating(false)
      // On error, still try to analyze
      if (onAnalyze) {
        onAnalyze()
      }
    }
  }

  const handleFileChange = (e) => {
    setValidationError(null)
    setValidationPassed(false)
    setIsValidating(false)
    setScanning(false)
    if (onFileChange) {
      onFileChange(e)
    }
  }

  // Show analyze button when there's an image that hasn't been analyzed or rejected
  const showAnalyzeButton = hasImage && !validationError && !validationPassed && !isValidating && !loading

  return (
    <section className="glass-modal dark:glass-modal-dark rounded-2xl p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2 flex items-center gap-2">
            <Camera className="text-emerald-600 dark:text-emerald-400" size={20} />
            {t('loadPlantImage')}
          </h3>
          
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="sr-only"
          />
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraChange}
            className="sr-only"
          />
          
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex flex-col items-center justify-center gap-1 w-28 h-28 rounded-xl glass-input dark:glass-input-dark border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 transition-all"
            >
              <Camera className="text-3xl" />
              <span className="text-sm font-medium">{t('Upload Image')}</span>
            </button>
            
            <button
              type="button"
              onClick={handleCameraCapture}
              className="inline-flex flex-col items-center justify-center gap-1 w-28 h-28 rounded-xl glass-input dark:glass-input-dark border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 transition-all"
            >
              <Camera className="text-3xl" />
              <span className="text-sm font-medium">Take Photo</span>
            </button>
            
            {imagePreview && (
              <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
                <img src={imagePreview} alt="Preview" className="w-28 h-28 object-cover" />
                
                {/* Scanning Animation Overlay */}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent"
                      style={{
                        animation: 'scanMove 1.5s ease-in-out infinite',
                      }}
                    />
                  </div>
                )}
                
                {(loading || isValidating) && !scanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {validationError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-2 text-sm border border-red-200 dark:border-red-800">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <span>{validationError}</span>
            </div>
          )}
          
          {validationPassed && !loading && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg flex items-start gap-2 text-sm border border-green-200 dark:border-green-800">
              <Leaf className="shrink-0 mt-0.5" size={16} />
              <span>✅ Crop leaf detected! Analyzing for diseases...</span>
            </div>
          )}

          {loading && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg flex items-start gap-2 text-sm border border-blue-200 dark:border-blue-800">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent shrink-0 mt-0.5"></div>
              <span>Analyzing crop disease with AI model...</span>
            </div>
          )}

          {showAnalyzeButton && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading || isValidating}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Validating Leaf...
                  </>
                ) : (
                    'Analyze Leaf'
                )}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-input dark:glass-input-dark rounded-xl p-4">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium flex items-center gap-2">
              <Clock className="text-emerald-600 dark:text-emerald-400" size={16} />
              {t('timeTakenToScan')}
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {result.timeTaken != null ? `${Number(result.timeTaken).toFixed(1)}s` : '—'}
            </p>
          </div>
          <div className="glass-input dark:glass-input-dark rounded-xl p-4">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium flex items-center gap-2">
              <Target className="text-emerald-600 dark:text-emerald-400" size={16} />
              {t('accuracyRateLabel')}
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {result.accuracyRate != null ? `${result.accuracyRate}%` : '—'}
            </p>
          </div>
          <div className="glass-input dark:glass-input-dark rounded-xl p-4">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={16} />
              {t('plantRecoveryRate')}
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {result.recoveryRate != null ? `${result.recoveryRate}%` : '—'}
            </p>
          </div>
          <div className="glass-input dark:glass-input-dark rounded-xl p-4">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium flex items-center gap-2">
              <Leaf className="text-emerald-600 dark:text-emerald-400" size={16} />
              {t('cropTypeLabel')}
            </p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
              {result.cropType ? result.cropType : '—'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Add the scanning animation CSS */}
      <style>{`
        @keyframes scanMove {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </section>
  )
}