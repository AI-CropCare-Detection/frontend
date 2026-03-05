import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut, onIdTokenChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'

const AuthContext = createContext(null)

// Session timeout: 30 minutes of inactivity (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000
// Token refresh interval: Check every 5 minutes
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const inactivityTimerRef = useRef(null)
  const tokenCheckIntervalRef = useRef(null)

  // Track user activity
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // Check for session expiration due to inactivity
  const checkSessionExpiration = useCallback(() => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current
    if (timeSinceLastActivity > SESSION_TIMEOUT && user) {
      console.log('Session expired due to inactivity')
      setSessionExpired(true)
      handleSignOut()
    }
  }, [user])

  // Handle sign out with cleanup
  const handleSignOut = useCallback(async () => {
    try {
      // Clear all timers
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current)
        tokenCheckIntervalRef.current = null
      }

      // Clear session storage
      try {
        sessionStorage.clear()
      } catch (e) {
        console.warn('Failed to clear sessionStorage:', e)
      }

      // Sign out from Firebase (this clears auth state)
      await firebaseSignOut(auth)
      
      // Clear user state
      setUser(null)
      setSessionExpired(false)
      lastActivityRef.current = Date.now()
    } catch (err) {
      console.error('Sign out error:', err)
      // Still clear local state even if Firebase signOut fails
      setUser(null)
      setSessionExpired(false)
    }
  }, [])

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // User is signed in - verify token is valid
        try {
          // Force token refresh to ensure it's still valid
          const tokenResult = await u.getIdTokenResult()
          
          // Check if token is expired
          if (tokenResult.expirationTime && new Date(tokenResult.expirationTime) < new Date()) {
            console.log('Token expired, signing out')
            await handleSignOut()
            return
          }

          setUser(u)
          setSessionExpired(false)
          lastActivityRef.current = Date.now()
          
          // Show location prompt for new sign-ins
          if (!u.metadata?.lastSignInTime) {
            setShowLocationPrompt(true)
          }
        } catch (err) {
          console.error('Token validation error:', err)
          // Token is invalid, sign out
          await handleSignOut()
        }
      } else {
        // User is signed out
        setUser(null)
        setSessionExpired(false)
      }
      setLoading(false)
    })

    // Listen for token changes (including expiration)
    const unsubscribeToken = onIdTokenChanged(auth, async (u) => {
      if (u) {
        try {
          // Refresh token if needed
          const tokenResult = await u.getIdTokenResult(true)
          if (tokenResult.expirationTime && new Date(tokenResult.expirationTime) < new Date()) {
            console.log('Token expired during refresh')
            await handleSignOut()
          }
        } catch (err) {
          console.error('Token refresh error:', err)
          await handleSignOut()
        }
      }
    })

    // Set up activity tracking
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Set up inactivity check
    inactivityTimerRef.current = setInterval(checkSessionExpiration, 60000) // Check every minute

    // Set up token refresh check
    tokenCheckIntervalRef.current = setInterval(async () => {
      if (user) {
        try {
          await user.getIdToken(true) // Force refresh
        } catch (err) {
          console.error('Token refresh failed:', err)
          await handleSignOut()
        }
      }
    }, TOKEN_CHECK_INTERVAL)

    return () => {
      unsubscribeAuth()
      unsubscribeToken()
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current)
      }
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current)
      }
    }
  }, [user, updateActivity, checkSessionExpiration, handleSignOut])

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signOut: handleSignOut, 
      showLocationPrompt, 
      setShowLocationPrompt,
      sessionExpired,
      updateActivity 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
