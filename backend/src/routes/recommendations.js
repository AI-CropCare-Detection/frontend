import { Router } from 'express'
import { getRecommendationsFromOpenAI } from '../services/openai.js'
import { logger } from '../utils/logger.js'

export const recommendationsRouter = Router()

recommendationsRouter.post('/recommendations', async (req, res) => {
  try {
    const { analysisSummary } = req.body || {}
    logger.debug('POST /api/recommendations', { analysisSummary })
    const text = await getRecommendationsFromOpenAI(analysisSummary)
    logger.info('Recommendations generated successfully')
    res.json({ recommendations: text })
  } catch (err) {
    logger.error('Recommendations error:', err.message || err)
    
    // Provide user-friendly error messages
    let statusCode = 500
    let errorMessage = err.message || 'Failed to get recommendations'
    
    if (err.message?.includes('API key') || err.message?.includes('OPEN_ROUTER_API_KEY')) {
      statusCode = 503 // Service Unavailable - configuration issue
      errorMessage = 'OpenRouter API key is not configured correctly. Please check backend/.env file.'
    } else if (err.message?.includes('quota') || err.message?.includes('rate limit')) {
      statusCode = 503
      errorMessage = 'OpenRouter API quota exceeded or rate limit reached. Please check your account.'
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
})
