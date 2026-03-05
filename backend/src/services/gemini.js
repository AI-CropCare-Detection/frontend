import { GoogleGenerativeAI } from '@google/generative-ai'
const GEMINI_API_KEY= 'AIzaSyD79EssgUu7VRCw7ynZBpggKVgPA4VrHKw'
const GEMINI_MODEL= 'gemini-1.5-flash'


const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '')

const systemRecommendations = `You are an expert agricultural consultant specializing in crop disease diagnosis and treatment. Given crop analysis metrics (time taken to scan, accuracy rate, recovery rate), provide specific, actionable treatment recommendations for farmers. 

Format your response as a clear list of recommendations, each starting with a bullet point (•). Focus on:
- Immediate treatment actions (fungicides, pesticides, organic alternatives)
- Preventive measures to stop disease spread
- Cultural practices (spacing, watering, pruning)
- Monitoring and follow-up actions
- Timeline for treatment application

Be practical, specific, and prioritize actions based on the severity indicated by the accuracy and recovery rates.`

const systemInsights = `You are an agricultural analyst with deep expertise in plant pathology and crop health. Given crop analysis metrics (time taken, accuracy rate, recovery rate), provide detailed insights about the plant's condition.

const apiKeyConfigured = !!process.env.GEMINI_API_KEY?.trim()
const apiKeyValid = apiKeyConfigured && process.env.GEMINI_API_KEY.trim().startsWith('AIza')

Your insights should:
- Explain what the metrics indicate about plant health
- Identify the likely disease or pest issue
- Describe the severity and stage of the problem
- Explain the potential impact if left untreated
- Provide context about recovery expectations

Write 3-5 sentences that are informative, professional, and help farmers understand their crop's condition.`

function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }
  // Gemini API keys typically start with 'AIza' and are around 39 characters
  const trimmed = apiKey.trim()
  return trimmed.startsWith('AIza') && trimmed.length > 30
}

async function chat(system, userContent) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in backend/.env file.')
  }
  
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid Gemini API key format. API keys should start with "AIza" and be at least 30 characters long. Get your key at https://makersuite.google.com/app/apikey')
  }
  
  try {
    // Use gemini-1.5-flash as default (fast and cost-effective)
    // Model names must be lowercase with hyphens, e.g., 'gemini-1.5-flash' or 'gemini-1.5-pro'
    // Normalize model name: convert spaces to hyphens, lowercase, trim
    let modelName = (process.env.GEMINI_MODEL || 'gemini-1.5-flash').toLowerCase().trim()
    // Replace spaces with hyphens and remove any extra spaces
    modelName = modelName.replace(/\s+/g, '-').replace(/-+/g, '-')
    const model = genAI.getGenerativeModel({ 
      model: modelName
    })
    
    // Combine system prompt and user content
    const fullPrompt = `${system}\n\n${userContent}`
    
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()
    
    return text.trim() || 'No response.'
  } catch (err) {
    // Handle specific Gemini API errors
    if (err.message?.includes('API_KEY_INVALID') || err.status === 401 || err.status === 403) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in backend/.env file. Get a valid key at https://makersuite.google.com/app/apikey')
    }
    if (err.message?.includes('quota') || err.message?.includes('QUOTA') || err.status === 429) {
      throw new Error('Gemini API quota exceeded. Please check your account quota at https://makersuite.google.com/app/apikey')
    }
    // Re-throw other errors with more context
    throw new Error(`Gemini API error: ${err.message || 'Unknown error'}`)
  }
}

export async function getRecommendationsFromGemini(analysisSummary) {
  let userContent = ''
  if (typeof analysisSummary === 'object') {
    const { timeTaken, accuracyRate, recoveryRate, imageDescription } = analysisSummary
    userContent = `Crop Analysis Results:
- Time Taken to Scan: ${timeTaken || 'N/A'} seconds
- Accuracy Rate: ${accuracyRate || 'N/A'}%
- Recovery Rate: ${recoveryRate || 'N/A'}%
${imageDescription ? `- Image Description: ${imageDescription}` : ''}

Based on these metrics, provide specific treatment recommendations.`
  } else {
    userContent = `Analysis: ${String(analysisSummary || 'No data')}\n\nProvide treatment recommendations.`
  }
  return chat(systemRecommendations, userContent)
}

export async function getInsightsFromGemini(analysisSummary) {
  let userContent = ''
  if (typeof analysisSummary === 'object') {
    const { timeTaken, accuracyRate, recoveryRate, imageDescription } = analysisSummary
    userContent = `Crop Analysis Results:
- Time Taken to Scan: ${timeTaken || 'N/A'} seconds
- Accuracy Rate: ${accuracyRate || 'N/A'}%
- Recovery Rate: ${recoveryRate || 'N/A'}%
${imageDescription ? `- Image Description: ${imageDescription}` : ''}

Provide detailed insights about what these metrics indicate about the crop's health condition.`
  } else {
    userContent = `Analysis: ${String(analysisSummary || 'No data')}\n\nProvide insights.`
  }
  return chat(systemInsights, userContent)
}
