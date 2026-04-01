import { useRef, useState } from 'react'
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
  const t = useTranslation()
  
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [validationPassed, setValidationPassed] = useState(false)

  // Function to check if image contains green pixels (crop leaf)
  const checkIfCropLeaf = (imageElement) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      canvas.width = imageElement.width
      canvas.height = imageElement.height
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      let greenPixels = 0
      let totalPixels = 0
      
      // Sample pixels every 20px for performance
      for (let y = 0; y < canvas.height; y += 20) {
        for (let x = 0; x < canvas.width; x += 20) {
          const index = (y * canvas.width + x) * 4
          const r = data[index]
          const g = data[index + 1]
          const b = data[index + 2]
          
          if (r !== undefined && g !== undefined && b !== undefined) {
            totalPixels++
            
            // Check if pixel is green (characteristic of crop leaves)
            const isGreen = (g > r + 25 && g > b + 25 && g > 65) ||
                           (g > 80 && r > 60 && r < 150 && b < 90) ||
                           (g > 45 && g > r + 15 && g > b + 15)
            
            if (isGreen) {
              greenPixels++
            }
          }
        }
      }
      
      const greenPercentage = totalPixels > 0 ? (greenPixels / totalPixels) * 100 : 0
      console.log(`Green pixels: ${greenPixels}/${totalPixels} (${greenPercentage.toFixed(1)}%)`)
      
      // Accept if at least 5% of pixels are green
      resolve(greenPercentage >= 5)
    })
  }

  const handleAnalyze = async () => {
    if (!imagePreview) {
      setValidationError('No image selected')
      return
    }

    setIsValidating(true)
    setValidationError(null)
    setValidationPassed(false)

    try {
      // Create an image element to analyze
      const img = new Image()
      
      // Handle different image preview formats
      let imageUrl = imagePreview
      if (imagePreview instanceof File || imagePreview instanceof Blob) {
        imageUrl = URL.createObjectURL(imagePreview)
      }
      
      img.src = imageUrl
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      
      // Check if it's a crop leaf
      const isCropLeaf = await checkIfCropLeaf(img)
      
      // Clean up blob URL if created
      if (imageUrl !== imagePreview && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl)
      }
      
      if (!isCropLeaf) {
        setValidationError('❌ This is not a crop leaf. Please upload a clear photo of a plant leaf with visible green areas.')
        // Clear the invalid image
        if (inputRef.current) {
          inputRef.current.value = ''
        }
        if (onFileChange) {
          onFileChange({ target: { value: '' } })
        }
        setIsValidating(false)
        return
      }
      
      // If it's a crop leaf, proceed to backend analysis
      setValidationPassed(true)
      console.log('✅ Crop leaf detected! Sending to backend for analysis...')
      onAnalyze()
      
    } catch (error) {
      console.error('Validation error:', error)
      setValidationError('Could not process image. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleFileChange = (e) => {
    setValidationError(null)
    setValidationPassed(false)
    if (onFileChange) {
      onFileChange(e)
    }
  }

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
            capture="environment"
            onChange={handleFileChange}
            className="sr-only"
          />
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={onLoadOrTake}
              className="inline-flex flex-col items-center justify-center gap-1 w-28 h-28 rounded-xl glass-input dark:glass-input-dark border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 transition-all"
            >
              <Camera className="text-3xl" />
              <span className="text-sm font-medium">{t('Upload Image')}</span>
            </button>
            {onCapture && (
              <button
                type="button"
                onClick={onCapture}
                className="inline-flex flex-col items-center justify-center gap-1 w-28 h-28 rounded-xl glass-input dark:glass-input-dark border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 transition-all"
              >
                <Camera className="text-3xl" />
                <span className="text-sm font-medium">Take Photo</span>
              </button>
            )}
            {imagePreview && (
              <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
                <img src={imagePreview} alt="Preview" className="w-28 h-28 object-cover" />
                {(loading || isValidating) && (
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
          
          {validationPassed && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg flex items-start gap-2 text-sm border border-green-200 dark:border-green-800">
              <Leaf className="shrink-0 mt-0.5" size={16} />
              <span>✅ Crop leaf detected! Analyzing for diseases...</span>
            </div>
          )}

          {hasImage && !validationError && !validationPassed && (
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
                ) : loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t('analyzing')}
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
    </section>
  )
}