import { Router } from 'express'
import multer from 'multer'
import { runCropAnalysis } from '../services/cropAnalysis.js'
import { logger } from '../utils/logger.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
export const analyzeRouter = Router()

analyzeRouter.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    logger.debug('POST /api/analyze received', req.file ? `image size ${req.file.size}` : 'no file')
    const file = req.file
    const result = await runCropAnalysis(file)
    logger.info('Analyze completed successfully')
    res.json(result)
  } catch (err) {
    logger.error('Analyze error:', err.message || err)
    res.status(500).json({ message: err.message || 'Analysis failed' })
  }
})
