import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTranslation } from '../lib/translations'

const SETTINGS_KEY = 'cropcare-app-settings'

const defaults = {
  language: 'en',
  units: 'metric',
  fontSize: 'medium',
  offlineMode: false,
}

function loadAppSettings() {
  try {
    const s = localStorage.getItem(SETTINGS_KEY)
    const parsed = s ? JSON.parse(s) : {}
    return { ...defaults, ...parsed }
  } catch {
    return { ...defaults }
  }
}

const AppSettingsContext = createContext(null)

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadAppSettings)

  const refreshSettings = useCallback(() => {
    setSettings(loadAppSettings())
  }, [])

  // Apply font size to document
  useEffect(() => {
    const size = settings.fontSize || 'medium'
    document.documentElement.dataset.fontSize = size
  }, [settings.fontSize])

  return (
    <AppSettingsContext.Provider value={{ ...settings, refreshSettings }}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext)
  return ctx || { ...defaults, refreshSettings: () => {} }
}

export function useTranslation() {
  const { language } = useAppSettings()
  return (key) => getTranslation(language || 'en', key)
}
