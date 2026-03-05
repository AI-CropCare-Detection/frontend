import { useEffect, useRef, useState } from 'react'
import { X, Camera } from 'lucide-react'
import { useTranslation } from '../contexts/AppSettingsContext'

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const t = useTranslation()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setError(null)

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not supported in this browser.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      } catch (err) {
        console.error('Camera error:', err)
        setError('Could not access camera. Please check permissions and try again.')
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleCaptureClick = async () => {
    if (!videoRef.current) return
    setCapturing(true)
    try {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError('Failed to capture image. Please try again.')
            setCapturing(false)
            return
          }
          const file = new File([blob], 'captured-plant.png', { type: 'image/png' })
          const previewUrl = URL.createObjectURL(blob)
          onCapture?.(file, previewUrl)
          setCapturing(false)
        },
        'image/png',
        0.92
      )
    } catch (err) {
      console.error('Capture error:', err)
      setError('Failed to capture image. Please try again.')
      setCapturing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 lg:p-8 bg-black/60 backdrop-blur-sm overflow-y-auto overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="glass-modal dark:glass-modal-dark rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-3xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2
            id="camera-modal-title"
            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white"
          >
            {t('loadPlantImage') || 'Capture Plant Image'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-white/10"
            aria-label={t('close')}
          >
            <X size={24} />
          </button>
        </div>

        <div className="aspect-video w-full bg-black/80 rounded-xl overflow-hidden flex items-center justify-center">
          {!error ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              playsInline
              muted
            />
          ) : (
            <p className="text-sm text-red-200 px-4 text-center">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Make sure the affected area of the leaf is clearly visible before capturing.
          </p>
          <button
            type="button"
            onClick={handleCaptureClick}
            disabled={capturing || !!error}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <Camera size={18} />
            {capturing ? 'Capturing...' : 'Take Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}

