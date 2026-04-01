import express from 'express'
import dotenv from 'dotenv'
import compression from 'compression'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Simple logger that works in Railway
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
}

app.use(compression())
app.use(morgan('dev'))
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// Try to import routes with error handling
try {
  const { analyzeRouter } = await import('./routes/analyze.js')
  const { recommendationsRouter } = await import('./routes/recommendations.js')
  const { insightsRouter } = await import('./routes/insights.js')
  const { accountRouter } = await import('./routes/account.js')
  const { feedbackRouter } = await import('./routes/feedback.js')
  const { chatRouter } = await import('./routes/chat.js')
  const { validateRouter } = await import('./routes/validate.js')
  
  app.use('/api', validateRouter)
  app.use('/api', analyzeRouter)
  app.use('/api', recommendationsRouter)
  app.use('/api', insightsRouter)
  app.use('/api', feedbackRouter)
  app.use('/api', chatRouter)
  app.use('/api/account', accountRouter)
  
  logger.info('✅ All routes loaded successfully')
} catch (error) {
  logger.error('❌ Error loading routes:', error.message)
}

// Serve frontend
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist')
app.use(express.static(frontendDistPath))

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'))
  } else {
    res.status(404).json({ message: 'API endpoint not found' })
  }
})

// Health check
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  logger.info(`CropCare API running on port ${PORT}`)
})