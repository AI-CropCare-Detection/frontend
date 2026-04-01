import express from 'express'
import multer from 'multer'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// Simple leaf validation function
async function validateLeafImage(imageBuffer, mimeType) {
  try {
    console.log(`[Leaf Validation] Validating image: ${(imageBuffer.length / 1024).toFixed(1)} KB, Type: ${mimeType}`)
    
    if (!imageBuffer || imageBuffer.length < 2000) {
      console.log('[Leaf Validation] ❌ Image too small')
      return {
        isValid: false,
        message: '❌ Image too small. Please take a clearer photo of a crop leaf.',
        confidence: 0
      }
    }
    
    // Color analysis for green pixel detection
    const bytes = new Uint8Array(imageBuffer)
    let greenPixels = 0
    let totalSampled = 0
    const sampleRate = 15
    
    for (let i = 500; i < bytes.length - 3; i += sampleRate * 3) {
      const r = bytes[i]
      const g = bytes[i + 1]
      const b = bytes[i + 2]
      
      if (r === undefined || g === undefined || b === undefined) continue
      
      totalSampled++
      
      // Green pixel detection
      const isGreenPixel = (g > r + 20 && g > b + 20 && g > 50) ||
                           (g > 70 && r > 30 && r < 150 && b < 100) ||
                           (g > 40 && g > r && g > b)
      
      if (isGreenPixel) {
        greenPixels++
      }
    }
    
    const greenRatio = totalSampled > 0 ? greenPixels / totalSampled : 0
    const isValid = greenRatio >= 0.03 // 3% green pixels threshold
    
    console.log(`[Leaf Validation] Green pixels: ${greenPixels}/${totalSampled} (${(greenRatio * 100).toFixed(1)}%)`)
    console.log(`[Leaf Validation] Result: ${isValid ? '✅ ACCEPTED' : '❌ REJECTED'}`)
    
    if (isValid) {
      return {
        isValid: true,
        message: '✅ Crop leaf detected! Proceeding with disease analysis.',
        confidence: Math.min(95, Math.round(greenRatio * 200))
      }
    } else {
      return {
        isValid: false,
        message: '❌ This is not a crop leaf. Please upload a clear photo of a plant leaf with visible green areas.',
        confidence: Math.round(greenRatio * 100)
      }
    }
    
  } catch (error) {
    console.error('[Leaf Validation] Error:', error)
    return {
      isValid: false,
      message: '❌ Could not process image. Please try again.',
      confidence: 0
    }
  }
}

// POST endpoint for leaf validation
router.post('/validate-leaf', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('[Leaf Validation] No image provided')
      return res.status(400).json({
        isValid: false,
        message: '❌ No image provided. Please upload a photo of a crop leaf.',
        confidence: 0
      })
    }
    
    const result = await validateLeafImage(req.file.buffer, req.file.mimetype)
    res.json(result)
    
  } catch (error) {
    console.error('[Leaf Validation] Route error:', error)
    res.status(500).json({
      isValid: false,
      message: '❌ Server error processing image',
      confidence: 0
    })
  }
})

export { router as validateRouter }