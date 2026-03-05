import { createContext, useContext, useState, useEffect } from 'react'

const KEY = 'cropcare-theme'

const ThemeContext = createContext(null)

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const t = localStorage.getItem(KEY) || 'light'
  document.documentElement.classList.toggle('dark', t === 'dark')
  return t
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    localStorage.setItem(KEY, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = (value) => setThemeState(value === 'dark' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  return ctx || { theme: 'light', setTheme: () => {} }
}
