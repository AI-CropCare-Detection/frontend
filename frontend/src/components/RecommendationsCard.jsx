import { AlertCircle, CheckCircle, ExternalLink, Leaf } from 'lucide-react'

const agriculturalResources = [
  { name: 'FAO Plant Protection', url: 'https://www.fao.org/plant-production-protection/en/' },
  { name: 'CABI Plantwise', url: 'https://www.plantwise.org/' },
  { name: 'Extension Services', url: 'https://www.extension.org/' },
]

export default function RecommendationsCard({ recommendations, accuracyRate, recoveryRate }) {
  if (!recommendations || recommendations === 'No recommendations.' || recommendations === 'Run an analysis to see recommendations.') {
    return (
      <div className="glass-input dark:glass-input-dark rounded-xl p-4 min-h-[80px] text-slate-700 dark:text-slate-300 text-sm">
        {recommendations || 'Run an analysis to see recommendations.'}
      </div>
    )
  }

  const recText = String(recommendations).toLowerCase()
  // Detect disease/pest from metrics or recommendation text
  const hasDiseaseFromMetrics = (accuracyRate || 0) < 85 || (recoveryRate || 0) < 80
  const diseaseKeywords = ['disease', 'pest', 'fungus', 'bacterial', 'virus', 'infection', 'affected', 'damage', 'symptom', 'treatment', 'fungicide', 'pesticide']
  const hasDiseaseFromText = diseaseKeywords.some((keyword) => recText.includes(keyword))
  const hasDisease = hasDiseaseFromMetrics || hasDiseaseFromText
  
  // Extract disease/pest type if mentioned
  const diseaseTypes = {
    fungal: ['fungus', 'fungal', 'mold', 'mildew', 'blight', 'rot', 'spot'],
    bacterial: ['bacterial', 'bacteria', 'blight', 'wilt'],
    viral: ['virus', 'viral', 'mosaic'],
    pest: ['pest', 'insect', 'aphid', 'mite', 'worm', 'beetle', 'caterpillar'],
  }
  let detectedType = null
  for (const [type, keywords] of Object.entries(diseaseTypes)) {
    if (keywords.some((kw) => recText.includes(kw))) {
      detectedType = type
      break
    }
  }
  
  const bullets = String(recommendations).split(/\n|•|[-*]/).filter((b) => b.trim().length > 10)

  return (
    <div className="space-y-6 md:space-y-8">
      {hasDisease && (
        <div className="bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-600 rounded-xl p-5 md:p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-red-700 dark:text-red-300 shrink-0 mt-1" size={28} />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 dark:text-red-100 mb-2 text-xl md:text-2xl">
                {detectedType ? `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} Issue Detected` : 'Disease or Pest Detected'}
              </h4>
              <p className="text-base md:text-lg text-red-800 dark:text-red-200 font-semibold leading-relaxed">
                Based on the analysis, your crop may be affected. Follow the specific recommendations below for immediate treatment and prevention.
              </p>
              {(accuracyRate || recoveryRate) && (
                <div className="mt-3 text-sm md:text-base text-red-700 dark:text-red-300 font-bold">
                  <span className="bg-red-200 dark:bg-red-800 px-2 py-1 rounded">Accuracy: {accuracyRate}%</span> | <span className="bg-red-200 dark:bg-red-800 px-2 py-1 rounded">Recovery: {recoveryRate}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`${hasDisease ? 'bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 dark:border-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-400 dark:border-emerald-600'} rounded-xl p-5 md:p-6 shadow-lg`}>
        <div className="flex items-start gap-4 mb-4">
          <CheckCircle className={`${hasDisease ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'} shrink-0 mt-1`} size={24} />
          <h4 className={`font-bold text-lg md:text-xl ${hasDisease ? 'text-amber-900 dark:text-amber-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
            {hasDisease ? 'Action Required: Treatment Recommendations' : 'Treatment Recommendations'}
          </h4>
        </div>
        <ul className={`space-y-3 md:space-y-4 ${hasDisease ? 'text-amber-900 dark:text-amber-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
          {bullets.length > 0 ? (
            bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                <Leaf className={`${hasDisease ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'} shrink-0 mt-1`} size={20} />
                <span className="font-semibold leading-relaxed text-slate-900 dark:text-slate-100">{bullet.trim()}</span>
              </li>
            ))
          ) : (
            <li className="flex items-start gap-3 bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
              <Leaf className={`${hasDisease ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'} shrink-0 mt-1`} size={20} />
              <span className="font-semibold leading-relaxed text-slate-900 dark:text-slate-100">{String(recommendations)}</span>
            </li>
          )}
        </ul>
      </div>

      <div className="glass-input dark:glass-input-dark rounded-xl p-5 md:p-6 bg-white/60 dark:bg-slate-800/60 shadow-lg">
        <h4 className="font-bold text-lg md:text-xl text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <ExternalLink className="text-emerald-700 dark:text-emerald-300" size={20} />
          Trusted Agricultural Resources
        </h4>
        <ul className="space-y-3">
          {agriculturalResources.map((resource, i) => (
            <li key={i} className="bg-white/40 dark:bg-slate-700/40 rounded-lg p-3 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 hover:underline flex items-center gap-2 text-base md:text-lg font-semibold"
              >
                {resource.name}
                <ExternalLink size={16} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
