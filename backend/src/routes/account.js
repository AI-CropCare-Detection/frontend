import express from 'express'
import crypto from 'crypto'

const router = express.Router()

// Firebase Admin SDK - dynamically import if available
let admin = null
let db = null

async function initializeFirebaseAdmin() {
  if (db) return db // Already initialized
  
  try {
    const adminModule = await import('firebase-admin')
    admin = adminModule.default
    
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      
      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
        db = admin.firestore()
        console.log('✅ Firebase Admin initialized for account deletion')
      } else {
        console.warn('⚠️  Firebase Admin credentials not configured. Account deletion will not work.')
      }
    } else {
      db = admin.firestore()
    }
  } catch (err) {
    console.warn('⚠️  firebase-admin not installed or initialization failed:', err.message)
    console.warn('   Install with: npm install firebase-admin')
  }
  
  return db
}

// Email service - lazy load
let emailServiceModule = null
async function getEmailService() {
  if (emailServiceModule) return emailServiceModule
  
  try {
    emailServiceModule = await import('../services/emailService.js')
    return emailServiceModule
  } catch (err) {
    console.warn('⚠️  Email service not available:', err.message)
    // Return a fallback module
    return {
      sendDeletionEmail: async (to, deletionLink, userName) => {
        console.log(`[DELETE ACCOUNT] Deletion link for ${to}: ${deletionLink}`)
        return { success: false, message: 'Email service not available' }
      }
    }
  }
}

// Request account deletion - generates token and sends email
router.post('/delete-request', async (req, res) => {
  try {
    const { uid, email } = req.body

    if (!uid || !email) {
      return res.status(400).json({ message: 'User ID and email are required' })
    }

    // Ensure Firebase Admin is initialized
    const firestore = await initializeFirebaseAdmin()
    if (!firestore) {
      return res.status(503).json({ 
        message: 'Account deletion service is not available. Please contact support@aicropcare.com' 
      })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store deletion request in Firestore
    await firestore.collection('accountDeletions').doc(token).set({
      uid,
      email,
      token,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false,
    })

    // Generate deletion link with full URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const deletionLink = `${frontendUrl}/delete-account-confirm?token=${token}`

    // Get user profile for personalized email
    let userName = ''
    try {
      const userDoc = await firestore.collection('users').doc(uid).get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        userName = userData.fullName || userData.displayName || ''
      }
    } catch (err) {
      console.warn('Could not fetch user name for email:', err.message)
    }

    // Send deletion confirmation email using Firebase Authentication email service
    let emailResult = { success: false }
    try {
      const emailService = await getEmailService()
      emailResult = await emailService.sendDeletionEmail(email, deletionLink, userName)
    } catch (emailErr) {
      console.error('Email sending error:', emailErr)
      // Don't fail the request if email fails - deletion request is saved
      emailResult = { success: false, error: emailErr.message }
    }
    
    if (!emailResult.success) {
      console.warn('Email sending failed, but deletion request was saved:', emailResult.error || emailResult.message)
      // In development, log the link
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Deletion link for ${email}: ${deletionLink}`)
      }
    }

    // Always send a JSON response
    res.status(200).json({
      message: 'Deletion link sent to your email. Please check your inbox.',
      // In development, return the link for testing
      ...(process.env.NODE_ENV === 'development' && { deletionLink }),
    })
  } catch (err) {
    console.error('Delete account request error:', err)
    // Ensure we always send a JSON response even on error
    res.status(500).json({ 
      message: err.message || 'Failed to process deletion request',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
})

// Confirm account deletion - deletes all user data
router.post('/delete-confirm', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ message: 'Deletion token is required' })
    }

    // Ensure Firebase Admin is initialized
    const firestore = await initializeFirebaseAdmin()
    if (!firestore || !admin) {
      return res.status(503).json({ 
        message: 'Account deletion service is not available. Please contact support@aicropcare.com' 
      })
    }

    // Get deletion request
    const deletionDoc = await firestore.collection('accountDeletions').doc(token).get()

    if (!deletionDoc.exists) {
      return res.status(404).json({ message: 'Invalid deletion token' })
    }

    const deletionData = deletionDoc.data()

    // Check if already used
    if (deletionData.used) {
      return res.status(400).json({ message: 'This deletion link has already been used' })
    }

    // Check if expired
    const expiresAt = deletionData.expiresAt?.toDate()
    if (!expiresAt || expiresAt < new Date()) {
      return res.status(410).json({ message: 'This deletion link has expired' })
    }

    const { uid } = deletionData

    // Delete all user data
    try {
      // 1. Delete user profile
      await firestore.collection('users').doc(uid).delete()

      // 2. Delete all analyses
      const analysesSnapshot = await firestore.collection('analyses')
        .where('userId', '==', uid)
        .get()
      
      const deleteAnalysesPromises = analysesSnapshot.docs.map(doc => doc.ref.delete())
      await Promise.all(deleteAnalysesPromises)

      // 3. Delete all feedback
      const feedbackSnapshot = await firestore.collection('feedback')
        .where('userId', '==', uid)
        .get()
      
      const deleteFeedbackPromises = feedbackSnapshot.docs.map(doc => doc.ref.delete())
      await Promise.all(deleteFeedbackPromises)

      // 4. Delete all weather alerts
      const weatherAlertsSnapshot = await firestore.collection('weatherAlerts')
        .where('userId', '==', uid)
        .get()
      
      const deleteWeatherAlertsPromises = weatherAlertsSnapshot.docs.map(doc => doc.ref.delete())
      await Promise.all(deleteWeatherAlertsPromises)

      // 5. Delete user's storage files (images)
      // Note: This requires Firebase Admin Storage SDK
      try {
        const bucket = admin.storage().bucket()
        const [files] = await bucket.getFiles({ prefix: `users/${uid}/` })
        await Promise.all(files.map(file => file.delete()))
      } catch (storageErr) {
        console.warn('Failed to delete storage files:', storageErr)
        // Continue even if storage deletion fails
      }

      // 6. Delete Firebase Auth user
      try {
        await admin.auth().deleteUser(uid)
      } catch (authErr) {
        console.warn('Failed to delete auth user:', authErr)
        // Continue even if auth deletion fails
      }

      // 7. Mark deletion request as used
      await firestore.collection('accountDeletions').doc(token).update({
        used: true,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      res.json({ message: 'Account deleted successfully' })
    } catch (deleteErr) {
      console.error('Error deleting user data:', deleteErr)
      res.status(500).json({ message: 'Failed to delete account data' })
    }
  } catch (err) {
    console.error('Delete account confirmation error:', err)
    res.status(500).json({ message: 'Failed to process deletion confirmation' })
  }
})

export { router as accountRouter }
