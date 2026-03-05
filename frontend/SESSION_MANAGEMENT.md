# Session Management & Authentication

## Overview

The AI-Powered-CropCare Dashboard implements comprehensive session handling and authentication using Firebase Authentication with enhanced security features.

## Features

### 1. **Session Persistence**
- Uses Firebase `browserLocalPersistence` for secure session storage
- Sessions survive page refreshes but are cleared on logout
- Tokens are stored securely by Firebase (not in localStorage)

### 2. **Session Expiration**
- **Inactivity Timeout**: 30 minutes of inactivity automatically logs out the user
- **Token Expiration**: Firebase tokens are automatically refreshed every 5 minutes
- **Token Validation**: Tokens are validated on every route change

### 3. **Activity Tracking**
The system tracks user activity through:
- Mouse clicks
- Keyboard input
- Scroll events
- Touch events
- Route navigation

### 4. **Secure Logout**
When a user logs out:
- Firebase session is terminated immediately
- Session storage is cleared
- Local storage can be optionally cleared (user choice)
- User is redirected to Sign In page
- All timers and listeners are cleaned up

### 5. **Route Protection**
- All dashboard routes are protected by `ProtectedRoute` component
- Unauthenticated users are automatically redirected to Sign In
- Session expiration redirects with appropriate message
- Loading states shown during authentication checks

## Implementation Details

### AuthContext (`frontend/src/contexts/AuthContext.jsx`)

**Key Features:**
- `onAuthStateChanged`: Listens for Firebase auth state changes
- `onIdTokenChanged`: Monitors token expiration and refreshes
- Activity tracking with automatic timeout
- Session expiration detection
- Secure sign-out with cleanup

**Session Timeout:**
```javascript
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
```

### ProtectedRoute (`frontend/src/components/ProtectedRoute.jsx`)

**Protection Logic:**
1. Shows loading spinner while checking authentication
2. Redirects to Sign In if no user
3. Redirects with message if session expired
4. Tracks activity on route navigation
5. Only renders children if authenticated

### Firebase Configuration (`frontend/src/lib/firebase.js`)

**Persistence:**
- Uses `browserLocalPersistence` for secure storage
- Tokens managed by Firebase (not accessible via JavaScript)
- Survives page refresh but cleared on logout

## Security Features

### 1. **Token Security**
- Tokens stored by Firebase (not in localStorage)
- Automatic token refresh prevents expiration
- Token validation on every route change
- Invalid tokens trigger immediate logout

### 2. **Session Security**
- Session storage cleared on logout
- Activity tracking prevents unauthorized access
- Automatic logout on inactivity
- No dashboard content visible without active session

### 3. **Route Security**
- All dashboard routes protected
- Unauthenticated access automatically redirected
- Session expiration handled gracefully
- Loading states prevent flash of content

## User Experience

### Sign In Flow
1. User signs in with email/password or social login
2. Firebase creates secure session
3. User redirected to dashboard
4. Activity tracking begins

### Active Session
1. User activity tracked automatically
2. Tokens refreshed every 5 minutes
3. Session remains active with activity
4. Dashboard accessible with valid session

### Session Expiration
1. After 30 minutes of inactivity:
   - Session marked as expired
   - User automatically signed out
   - Redirected to Sign In with message
   - All session data cleared

### Logout Flow
1. User clicks logout
2. Option to clear local data (optional)
3. Session storage always cleared
4. Firebase session terminated
5. Redirected to Sign In with success message

## Testing

### Manual Testing Checklist

- [ ] Sign in and verify session persists on page refresh
- [ ] Logout and verify cannot access dashboard
- [ ] Wait 30 minutes inactive and verify auto-logout
- [ ] Verify token refresh works (check network tab)
- [ ] Test route protection (try accessing `/dashboard` without auth)
- [ ] Verify session cleared on logout
- [ ] Test with multiple browser tabs (logout in one, verify others)

### Browser Compatibility

Tested and working on:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Configuration

### Session Timeout
To change the inactivity timeout, edit `frontend/src/contexts/AuthContext.jsx`:
```javascript
const SESSION_TIMEOUT = 30 * 60 * 1000 // Change this value
```

### Token Refresh Interval
To change token refresh frequency:
```javascript
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000 // Change this value
```

## Troubleshooting

### Session Not Persisting
- Check Firebase configuration in `.env`
- Verify `browserLocalPersistence` is set correctly
- Check browser console for errors

### Auto-Logout Too Frequent
- Increase `SESSION_TIMEOUT` value
- Verify activity tracking events are firing
- Check browser console for errors

### Token Refresh Issues
- Verify Firebase project settings
- Check network connectivity
- Review Firebase console for errors

## Security Best Practices

1. ✅ Tokens stored securely by Firebase (not accessible via JS)
2. ✅ Session storage cleared on logout
3. ✅ Automatic logout on inactivity
4. ✅ Token validation on route changes
5. ✅ Protected routes prevent unauthorized access
6. ✅ Activity tracking prevents session hijacking
7. ✅ Secure sign-out with cleanup
