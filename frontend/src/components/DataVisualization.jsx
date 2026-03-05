import { useMemo, useState, memo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTranslation } from '../contexts/AppSettingsContext'
import { Calendar, Filter, TrendingUp } from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function DataVisualization({ history = [] }) {
  const t = useTranslation()
  const [timeframe, setTimeframe] = useState('all') // 'daily', 'monthly', 'all'
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    cropType: '',
    location: '',
    diseasePestCategory: '',
  })

  // Filter history based on filters
  const filteredHistory = useMemo(() => {
    let filtered = [...history]
    
    // Date range filtering
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter((item) => {
        const itemDate = item.timestamp ? new Date(item.timestamp) : new Date(0)
        return itemDate >= fromDate
      })
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((item) => {
        const itemDate = item.timestamp ? new Date(item.timestamp) : new Date()
        return itemDate <= toDate
      })
    }
    
    // Text-based filtering
    if (filters.cropType) {
      const cropLower = filters.cropType.toLowerCase()
      filtered = filtered.filter((r) => {
        const recText = (r.recommendations || '').toLowerCase()
        const insightsText = (r.insights || '').toLowerCase()
        return recText.includes(cropLower) || insightsText.includes(cropLower)
      })
    }
    
    if (filters.location) {
      const locLower = filters.location.toLowerCase()
      filtered = filtered.filter((r) => {
        const recText = (r.recommendations || '').toLowerCase()
        const insightsText = (r.insights || '').toLowerCase()
        return recText.includes(locLower) || insightsText.includes(locLower)
      })
    }
    
    if (filters.diseasePestCategory) {
      const categoryLower = filters.diseasePestCategory.toLowerCase()
      const keywords = {
        'fungal': ['fungus', 'fungal', 'mold', 'mildew', 'blight', 'rot', 'spot'],
        'bacterial': ['bacterial', 'bacteria', 'blight', 'wilt'],
        'viral': ['virus', 'viral', 'mosaic'],
        'pest': ['pest', 'insect', 'aphid', 'mite', 'worm', 'beetle', 'caterpillar'],
        'nutrient': ['nutrient', 'deficiency', 'nitrogen', 'phosphorus', 'potassium'],
        'environmental': ['drought', 'water', 'moisture', 'temperature', 'humidity'],
      }
      const keywordsToCheck = keywords[categoryLower] || [categoryLower]
      filtered = filtered.filter((r) => {
        const recText = (r.recommendations || '').toLowerCase()
        const insightsText = (r.insights || '').toLowerCase()
        const combined = recText + ' ' + insightsText
        return keywordsToCheck.some((kw) => combined.includes(kw))
      })
    }
    
    return filtered
  }, [history, filters])

  // Process data for different timeframes
  const processedData = useMemo(() => {
    if (!filteredHistory.length) return { daily: [], monthly: [], all: [], diseasePest: [] }

    const now = new Date()
    const dailyData = {}
    const monthlyData = {}
    const allData = {
      totalScans: history.length,
      avgAccuracy: 0,
      avgRecovery: 0,
      diseasePestCount: 0,
      recommendationsApplied: 0,
    }

    let totalAccuracy = 0
    let totalRecovery = 0
    let diseasePestDetected = 0
    let hasRecommendations = 0

    filteredHistory.forEach((item) => {
      const date = item.timestamp ? new Date(item.timestamp) : new Date()
      const dayKey = date.toISOString().split('T')[0]
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      // Daily aggregation
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          date: dayKey,
          scans: 0,
          accuracy: 0,
          recovery: 0,
          diseasePest: 0,
          recommendations: 0,
        }
      }
      dailyData[dayKey].scans++
      dailyData[dayKey].accuracy += item.accuracyRate || 0
      dailyData[dayKey].recovery += item.recoveryRate || 0
      if ((item.accuracyRate || 0) < 85 || (item.recoveryRate || 0) < 80) {
        dailyData[dayKey].diseasePest++
      }
      if (item.recommendations && item.recommendations !== 'No recommendations.') {
        dailyData[dayKey].recommendations++
      }

      // Monthly aggregation
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          scans: 0,
          accuracy: 0,
          recovery: 0,
          diseasePest: 0,
          recommendations: 0,
        }
      }
      monthlyData[monthKey].scans++
      monthlyData[monthKey].accuracy += item.accuracyRate || 0
      monthlyData[monthKey].recovery += item.recoveryRate || 0
      if ((item.accuracyRate || 0) < 85 || (item.recoveryRate || 0) < 80) {
        monthlyData[monthKey].diseasePest++
      }
      if (item.recommendations && item.recommendations !== 'No recommendations.') {
        monthlyData[monthKey].recommendations++
      }

      // All data stats
      totalAccuracy += item.accuracyRate || 0
      totalRecovery += item.recoveryRate || 0
      if ((item.accuracyRate || 0) < 85 || (item.recoveryRate || 0) < 80) {
        diseasePestDetected++
      }
      if (item.recommendations && item.recommendations !== 'No recommendations.') {
        hasRecommendations++
      }
    })

    // Calculate averages and format
    const daily = Object.values(dailyData)
      .map((d) => ({
        ...d,
        accuracy: d.scans > 0 ? Math.round((d.accuracy / d.scans) * 10) / 10 : 0,
        recovery: d.scans > 0 ? Math.round((d.recovery / d.scans) * 10) / 10 : 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30) // Last 30 days

    const monthly = Object.values(monthlyData)
      .map((m) => ({
        ...m,
        accuracy: m.scans > 0 ? Math.round((m.accuracy / m.scans) * 10) / 10 : 0,
        recovery: m.scans > 0 ? Math.round((m.recovery / m.scans) * 10) / 10 : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    allData.avgAccuracy = filteredHistory.length > 0 ? Math.round((totalAccuracy / filteredHistory.length) * 10) / 10 : 0
    allData.avgRecovery = filteredHistory.length > 0 ? Math.round((totalRecovery / filteredHistory.length) * 10) / 10 : 0
    allData.diseasePestCount = diseasePestDetected
    allData.recommendationsApplied = hasRecommendations

    // Disease/pest categories
    const diseasePestCategories = {}
    filteredHistory.forEach((item) => {
      const recText = ((item.recommendations || '') + ' ' + (item.insights || '')).toLowerCase()
      const categories = {
        fungal: ['fungus', 'fungal', 'mold', 'mildew', 'blight', 'rot', 'spot'],
        bacterial: ['bacterial', 'bacteria', 'blight', 'wilt'],
        viral: ['virus', 'viral', 'mosaic'],
        pest: ['pest', 'insect', 'aphid', 'mite', 'worm', 'beetle', 'caterpillar'],
        nutrient: ['nutrient', 'deficiency', 'nitrogen', 'phosphorus', 'potassium'],
        environmental: ['drought', 'water', 'moisture', 'temperature', 'humidity'],
      }
      Object.keys(categories).forEach((cat) => {
        if (categories[cat].some((kw) => recText.includes(kw))) {
          diseasePestCategories[cat] = (diseasePestCategories[cat] || 0) + 1
        }
      })
    })

    const diseasePestData = Object.entries(diseasePestCategories).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))

    return { daily, monthly, all: allData, diseasePest: diseasePestData }
  }, [filteredHistory])

  const currentData = useMemo(() => {
    if (timeframe === 'daily') return processedData.daily
    if (timeframe === 'monthly') return processedData.monthly
    return processedData.daily // Default to daily for 'all' view
  }, [timeframe, processedData])

  if (!history.length || !filteredHistory.length) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">{t('noDataForVisualization')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-slate-600 dark:text-slate-400" size={20} />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('filters')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t('dateRangeFrom')}</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t('dateRangeTo')}</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t('cropType')}</span>
            <input
              type="text"
              value={filters.cropType}
              onChange={(e) => setFilters({ ...filters, cropType: e.target.value })}
              placeholder={t('cropTypePlaceholder')}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t('location')}</span>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              placeholder={t('locationPlaceholder')}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t('diseasePestCategory')}</span>
            <select
              value={filters.diseasePestCategory}
              onChange={(e) => setFilters({ ...filters, diseasePestCategory: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2"
            >
              <option value="">{t('allCategories')}</option>
              <option value="fungal">{t('fungal')}</option>
              <option value="bacterial">{t('bacterial')}</option>
              <option value="viral">{t('viral')}</option>
              <option value="pest">{t('pest')}</option>
              <option value="nutrient">{t('nutrient')}</option>
              <option value="environmental">{t('environmental')}</option>
            </select>
          </label>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-slate-600 dark:text-slate-400" size={20} />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('timeframe')}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTimeframe('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'daily'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t('dailyAnalysis')}
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'monthly'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t('monthlyAnalysis')}
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t('fullDataOverview')}
          </button>
        </div>
      </div>

      {/* Charts */}
      {timeframe === 'all' ? (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">{t('totalScans')}</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                {processedData.all.totalScans}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">{t('averageAccuracy')}</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                {processedData.all.avgAccuracy}%
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">{t('averageRecovery')}</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                {processedData.all.avgRecovery}%
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">{t('diseasePestDetected')}</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                {processedData.all.diseasePestCount}
              </div>
            </div>
          </div>

          {/* Disease/Pest Categories Pie Chart */}
          {processedData.diseasePest.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                {t('diseasePestCategories')}
              </h3>
              <div role="img" aria-label={`Pie chart showing distribution of ${t('diseasePestCategories')}`}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart aria-label={`${t('diseasePestCategories')} pie chart`}>
                    <Pie
                      data={processedData.diseasePest}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      aria-label="Disease and pest category distribution"
                    >
                      {processedData.diseasePest.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Scans per period */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              {t('scansPerformed')} ({timeframe === 'daily' ? t('daily') : t('monthly')})
            </h3>
            <div role="img" aria-label={`Bar chart showing ${t('scansPerformed')} over ${timeframe === 'daily' ? 'daily' : 'monthly'} periods`}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentData} aria-label={`${t('scansPerformed')} chart`}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey={timeframe === 'daily' ? 'date' : 'month'}
                    stroke="#64748b"
                    tick={{ fill: '#64748b' }}
                    aria-label="Time period"
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} aria-label="Number of scans" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="scans" fill="#10b981" name={t('scans')} aria-label={`${t('scans')} per period`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accuracy and Recovery Trends */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-slate-600 dark:text-slate-400" size={20} />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t('accuracyAndRecoveryRates')}
              </h3>
            </div>
            <div role="img" aria-label={`Line chart showing ${t('accuracyAndRecoveryRates')} trends over ${timeframe === 'daily' ? 'daily' : 'monthly'} periods`}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={currentData} aria-label={`${t('accuracyAndRecoveryRates')} chart`}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey={timeframe === 'daily' ? 'date' : 'month'}
                    stroke="#64748b"
                    tick={{ fill: '#64748b' }}
                    aria-label="Time period"
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} aria-label="Percentage rate" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name={t('accuracyRate')}
                    aria-label={t('accuracyRate')}
                  />
                  <Line
                    type="monotone"
                    dataKey="recovery"
                    stroke="#10b981"
                    strokeWidth={2}
                    name={t('recoveryRate')}
                    aria-label={t('recoveryRate')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Disease/Pest Detection */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              {t('diseasePestDetection')}
            </h3>
            <div role="img" aria-label={`Bar chart showing ${t('diseasePestDetection')} over ${timeframe === 'daily' ? 'daily' : 'monthly'} periods`}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentData} aria-label={`${t('diseasePestDetection')} chart`}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey={timeframe === 'daily' ? 'date' : 'month'}
                    stroke="#64748b"
                    tick={{ fill: '#64748b' }}
                    aria-label="Time period"
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} aria-label="Number of detections" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="diseasePest" fill="#ef4444" name={t('diseasePestDetected')} aria-label={`${t('diseasePestDetected')} per period`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations Applied */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              {t('recommendationsApplied')}
            </h3>
            <div role="img" aria-label={`Bar chart showing ${t('recommendationsApplied')} over ${timeframe === 'daily' ? 'daily' : 'monthly'} periods`}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentData} aria-label={`${t('recommendationsApplied')} chart`}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey={timeframe === 'daily' ? 'date' : 'month'}
                    stroke="#64748b"
                    tick={{ fill: '#64748b' }}
                    aria-label="Time period"
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} aria-label="Number of recommendations" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="recommendations" fill="#8b5cf6" name={t('recommendations')} aria-label={`${t('recommendations')} per period`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default memo(DataVisualization)
