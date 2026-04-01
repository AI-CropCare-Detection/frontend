import { useRef } from 'react'
import { Camera, Target, TrendingUp, Clock, Leaf } from 'lucide-react'
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

  return (
    <section
      className="glass-modal dark:glass-modal-dark rounded-2xl p-6"
      aria-labelledby="primary-analysis-heading"
    >
      <h2 id="primary-analysis-heading" className="sr-only">
        {t('primaryAnalysis')}
      </h2>

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
            onChange={onFileChange}
            className="sr-only"
            aria-label="Choose or capture plant image"
          />
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={onLoadOrTake}
              className="inline-flex flex-col items-center justify-center gap-1 w-28 h-28 rounded-xl glass-input dark:glass-input-dark border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all"
              aria-label="Upload image"
            >
              <Camera className="text-3xl" aria-hidden="true" />
              <span className="text-sm font-medium">{t('Upload Image')}</span>
            </button>
            {onCapture && (
              <button
                type="button"
                onClick={onCapture}
                className="inline-flex flex-col items-center justify-center gap-1 w-28 h-28 rounded-xl glass-input dark:glass-input-dark border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all"
                aria-label="Take plant photo with camera"
              >
                <Camera className="text-3xl" aria-hidden="true" />
                <span className="text-sm font-medium">Take Photo</span>
              </button>
            )}
            {imagePreview && (
              <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
                <img
                  src={imagePreview}
                  alt="Plant preview"
                  className="w-28 h-28 object-cover"
                />
                {loading && (
                  <div key="scan-overlay" className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute inset-0 bg-red-500/30"
                      style={{
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(239, 68, 68, 0.4) 50%, transparent 100%)',
                        animation: 'scan 1.5s ease-in-out infinite',
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          {hasImage && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onAnalyze}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
                aria-busy={loading}
                aria-live="polite"
              >
                {loading ? t('analyzing') : t('analyze')}
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
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 truncate" title={result.cropType || undefined}>
              {result.cropType ? result.cropType : '—'}
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        .animate-scan {
          animation: scan 1.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
