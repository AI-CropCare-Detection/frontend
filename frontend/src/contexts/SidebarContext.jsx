import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'cropcare-sidebar-collapsed'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsedState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {}
  }, [collapsed])

  const toggle = useCallback(() => setCollapsedState((c) => !c), [])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed: setCollapsedState, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  return ctx || { collapsed: false, setCollapsed: () => {}, toggle: () => {} }
}
