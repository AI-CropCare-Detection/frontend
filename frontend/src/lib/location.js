/**
 * Location service for getting user's geolocation
 * Handles browser geolocation API with proper error handling
 */

/**
 * Request location permission and get user's coordinates
 * @returns {Promise<{latitude: number, longitude: number, error?: string} | null>}
 */
export async function getUserLocation() {
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser')
    return { error: 'Geolocation is not supported by this browser', errorCode: 'NOT_SUPPORTED' }
  }

  // Check if running on HTTPS (required for geolocation in production)
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return { 
      error: 'Location access requires HTTPS. Please access the site via HTTPS.', 
      errorCode: 'HTTPS_REQUIRED' 
    }
  }

  return new Promise((resolve) => {
    const options = {
      enableHighAccuracy: false, // Changed to false for better compatibility
      timeout: 20000, // Increased timeout to 20 seconds
      maximumAge: 300000, // Cache for 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
      },
      (error) => {
        console.warn('Error getting location:', error.code, error.message)
        let errorMessage = 'Location permission denied or unavailable'
        let errorCode = 'UNKNOWN'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser settings and try again.'
            errorCode = 'PERMISSION_DENIED'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your device GPS/location settings.'
            errorCode = 'POSITION_UNAVAILABLE'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please ensure your device has GPS enabled and try again.'
            errorCode = 'TIMEOUT'
            break
          default:
            errorMessage = error.message || 'Failed to get location'
            errorCode = 'UNKNOWN'
        }
        
        resolve({ error: errorMessage, errorCode })
      },
      options
    )
  })
}

/**
 * Check if location permission is granted (using Permissions API if available)
 */
export async function checkLocationPermission() {
  if (!navigator.geolocation) return { granted: false, state: 'not-supported' }
  
  // Try to use Permissions API if available
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      return {
        granted: result.state === 'granted',
        state: result.state, // 'granted', 'denied', 'prompt'
      }
    } catch (err) {
      console.warn('Permissions API not supported:', err)
    }
  }
  
  // Fallback: we can't check without trying, so return unknown
  return { granted: null, state: 'unknown' }
}

/**
 * Request location permission with user-friendly prompt
 */
export async function requestLocationPermission() {
  if (!navigator.geolocation) {
    return {
      granted: false,
      error: 'Geolocation is not supported by this browser',
      errorCode: 'NOT_SUPPORTED',
    }
  }

  try {
    const result = await getUserLocation()
    
    // Check if result has an error property
    if (result?.error) {
      return {
        granted: false,
        location: null,
        error: result.error,
        errorCode: result.errorCode || 'UNKNOWN',
      }
    }
    
    // Check if we have valid coordinates
    if (result && result.latitude && result.longitude) {
      return {
        granted: true,
        location: result,
        error: null,
      }
    }
    
    return {
      granted: false,
      location: null,
      error: 'Failed to get location coordinates',
      errorCode: 'NO_COORDINATES',
    }
  } catch (err) {
    return {
      granted: false,
      location: null,
      error: err.message || 'Failed to get location',
      errorCode: 'EXCEPTION',
    }
  }
}
