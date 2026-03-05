import { useState, useEffect, useRef } from 'react'

/**
 * Hook that delays showing loading indicator until after a threshold (default 1s)
 * This prevents flashing loading states for fast operations
 */
export function useDelayedLoading(isLoading, delayMs = 1000) {
  const [showLoading, setShowLoading] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (isLoading) {
      // Start timer to show loading after delay
      timeoutRef.current = setTimeout(() => {
        setShowLoading(true)
      }, delayMs)
    } else {
      // Clear timer and hide loading immediately when done
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setShowLoading(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isLoading, delayMs])

  return showLoading
}
