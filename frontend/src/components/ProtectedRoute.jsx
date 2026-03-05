import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children }) {
  const { user, loading, sessionExpired } = useAuth()
  const location = useLocation()

  // Track activity when user interacts with protected routes
  useEffect(() => {
    if (user) {
      // Update activity on route navigation
      const handleRouteActivity = () => {
        // Activity will be tracked by AuthContext listeners
      }
      handleRouteActivity()
    }
  }, [user, location.pathname])

  if (loading) {
    return <LoadingSpinner />
  }

  if (sessionExpired) {
    return (
      <Navigate 
        to="/signin" 
        state={{ 
          from: location,
          message: 'Your session has expired due to inactivity. Please sign in again.' 
        }} 
        replace 
      />
    )
  }

  if (!user) {
    return (
      <Navigate 
        to="/signin" 
        state={{ 
          from: location,
          message: 'Please sign in to access this page.' 
        }} 
        replace 
      />
    )
  }

  return children
}
