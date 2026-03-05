import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  getDocs,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

const ANALYSES = 'analyses'
const USERS = 'users'
const FEEDBACK = 'feedback'

// Simple in-memory cache for Firebase queries (5 minute TTL)
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(uid, filters = {}) {
  return `history_${uid}_${JSON.stringify(filters)}`
}

function getCached(key) {
  const cached = cache.get(key)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return cached.data
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() })
}

export async function saveAnalysis(uid, record) {
  let imageUrl = record.imageUrl || null
  
  // Always upload image to Firebase Storage if imageFile is provided
  if (record.imageFile && record.imageFile instanceof File) {
    try {
      const timestamp = Date.now()
      const fileName = record.imageFile.name || 'crop-image.jpg'
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storageRef = ref(storage, `users/${uid}/crops/${timestamp}_${sanitizedFileName}`)
      
      // Upload with metadata
      const metadata = {
        contentType: record.imageFile.type || 'image/jpeg',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          analysisTimestamp: record.timestamp || new Date().toISOString(),
        }
      }
      
      await uploadBytes(storageRef, record.imageFile, metadata)
      imageUrl = await getDownloadURL(storageRef)
      console.log('Image uploaded to Firebase Storage:', imageUrl)
    } catch (uploadErr) {
      console.error('Failed to upload image to Firebase Storage:', uploadErr)
      // Continue with existing imageUrl if upload fails, but log the error
    }
  }
  
  // If we have a data URL (base64) but no Firebase URL, try to convert and upload it
  if (!imageUrl && record.imageUrl && typeof record.imageUrl === 'string' && record.imageUrl.startsWith('data:')) {
    try {
      // Convert data URL to blob
      const response = await fetch(record.imageUrl)
      const blob = await response.blob()
      const timestamp = Date.now()
      const storageRef = ref(storage, `users/${uid}/crops/${timestamp}_crop-image.jpg`)
      
      const metadata = {
        contentType: blob.type || 'image/jpeg',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          analysisTimestamp: record.timestamp || new Date().toISOString(),
        }
      }
      
      await uploadBytes(storageRef, blob, metadata)
      imageUrl = await getDownloadURL(storageRef)
      console.log('Data URL image uploaded to Firebase Storage:', imageUrl)
    } catch (uploadErr) {
      console.error('Failed to upload data URL image to Firebase Storage:', uploadErr)
      // Keep the data URL as fallback
      imageUrl = record.imageUrl
    }
  }
  
  const payload = {
    userId: uid,
    timeTaken: record.timeTaken,
    accuracyRate: record.accuracyRate,
    recoveryRate: record.recoveryRate,
    recommendations: record.recommendations ?? '',
    insights: record.insights ?? '',
    imageUrl: imageUrl || record.imageUrl || null, // Always save image URL
    timestamp: serverTimestamp(),
    cropType: record.cropType ?? null, // Identified crop/leaf type from trained model
  }
  
  const docRef = await addDoc(collection(db, ANALYSES), payload)
  // Invalidate cache after saving
  invalidateHistoryCache(uid)
  return { id: docRef.id, ...payload }
}

export async function getAnalysisHistory(uid, filters = {}) {
  if (!uid) return []
  
  // Check cache first (only for queries without date filters to ensure freshness)
  const cacheKey = getCacheKey(uid, filters)
  if (!filters.dateFrom && !filters.dateTo) {
    const cached = getCached(cacheKey)
    if (cached) return cached
  }
  
  const constraints = [where('userId', '==', uid)]
  
  // Date range filtering
  if (filters.dateFrom) {
    const fromDate = filters.dateFrom instanceof Date ? filters.dateFrom : new Date(filters.dateFrom)
    constraints.push(where('timestamp', '>=', Timestamp.fromDate(fromDate)))
  }
  if (filters.dateTo) {
    const toDate = filters.dateTo instanceof Date ? filters.dateTo : new Date(filters.dateTo)
    // Set to end of day
    toDate.setHours(23, 59, 59, 999)
    constraints.push(where('timestamp', '<=', Timestamp.fromDate(toDate)))
  }
  
  constraints.push(orderBy('timestamp', 'desc'))
  
  const q = query(collection(db, ANALYSES), ...constraints)
  const snapshot = await getDocs(q)
  let results = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    timestamp: d.data().timestamp?.toDate?.()?.toISOString?.() ?? d.data().timestamp,
  }))
  
  // Client-side filtering for text-based fields (crop type, location, disease/pest)
  if (filters.cropType) {
    const cropLower = filters.cropType.toLowerCase()
    results = results.filter((r) => {
      const identifiedCrop = (r.cropType || '').toLowerCase()
      const recText = (r.recommendations || '').toLowerCase()
      const insightsText = (r.insights || '').toLowerCase()
      return identifiedCrop.includes(cropLower) || recText.includes(cropLower) || insightsText.includes(cropLower)
    })
  }
  
  if (filters.location) {
    const locLower = filters.location.toLowerCase()
    results = results.filter((r) => {
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
    results = results.filter((r) => {
      const recText = (r.recommendations || '').toLowerCase()
      const insightsText = (r.insights || '').toLowerCase()
      const combined = recText + ' ' + insightsText
      return keywordsToCheck.some((kw) => combined.includes(kw))
    })
  }
  
  // Cache results (only if no date filters)
  if (!filters.dateFrom && !filters.dateTo) {
    setCache(cacheKey, results)
  }
  
  return results
}

// Invalidate cache when new analysis is saved
export function invalidateHistoryCache(uid) {
  const keysToDelete = []
  for (const key of cache.keys()) {
    if (key.startsWith(`history_${uid}_`)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => cache.delete(key))
}

export async function getUserProfile(uid) {
  const ref = doc(db, USERS, uid)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function setUserProfile(uid, data) {
  if (!uid) return
  const docRef = doc(db, USERS, uid)
  const safe = data && typeof data === 'object' ? data : {}
  const { id: _id, ...rest } = safe
  // Firestore does not accept undefined; strip undefined and use only serializable values
  const payload = { updatedAt: serverTimestamp() }
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'object' && v !== null && !(v instanceof Date)))) {
      payload[k] = v
    }
  }
  // Ensure createdAt is set if this is a new profile
  const existingDoc = await getDoc(docRef)
  if (!existingDoc.exists() && !payload.createdAt) {
    payload.createdAt = serverTimestamp()
  }
  await setDoc(docRef, payload, { merge: true })
  return payload
}

const AVATAR_PATH = (uid) => `users/${uid}/avatar`

export async function uploadProfilePhoto(uid, fileOrBlob) {
  const storageRef = ref(storage, AVATAR_PATH(uid))
  const metadata = { contentType: 'image/jpeg' }
  let lastErr
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await uploadBytes(storageRef, fileOrBlob, metadata)
      return getDownloadURL(storageRef)
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

export async function deleteProfilePhoto(uid) {
  try {
    const storageRef = ref(storage, AVATAR_PATH(uid))
    await deleteObject(storageRef)
  } catch (err) {
    if (err?.code !== 'storage/object-not-found') throw err
  }
}

export async function addFeedback(uid, data) {
  try {
    const feedbackData = {
      userId: uid || null,
      type: data.type || 'other',
      message: data.message || '',
      rating: data.rating || null,
      survey: data.survey || null,
      screenshotCount: data.screenshotCount || 0,
      email: data.email || null,
      screenshotUrls: data.screenshotUrls || [],
      createdAt: serverTimestamp(),
    }
    
    const docRef = await addDoc(collection(db, FEEDBACK), feedbackData)
    return { id: docRef.id, ...feedbackData }
  } catch (err) {
    console.error('Failed to add feedback:', err)
    throw new Error(err.message || 'Failed to submit feedback. Please try again.')
  }
}

// Weather alerts collection
export async function storeWeatherAlert(userId, weatherData, alertType = 'weather') {
  try {
    await addDoc(collection(db, 'weatherAlerts'), {
      userId,
      weatherData,
      alertType,
      timestamp: serverTimestamp(),
      read: false,
    })
  } catch (err) {
    console.error('Failed to store weather alert:', err)
  }
}

export async function getUserWeatherAlerts(userId, limit = 10) {
  try {
    const q = query(
      collection(db, 'weatherAlerts'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString?.() ?? doc.data().timestamp,
    })).slice(0, limit)
  } catch (err) {
    console.error('Failed to get weather alerts:', err)
    return []
  }
}
