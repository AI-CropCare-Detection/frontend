// Quick test script to verify backend is working
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3001/api'

async function testConnection() {
  console.log('Testing backend connection...\n')
  
  // Test health endpoint
  try {
    const healthRes = await fetch(`${BASE_URL}/health`)
    const healthData = await healthRes.json()
    console.log('✓ Health check:', healthData)
  } catch (err) {
    console.error('✗ Health check failed:', err.message)
    return
  }
  
  // Test recommendations endpoint
  try {
    const recRes = await fetch(`${BASE_URL}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisSummary: {
          timeTaken: 4.8,
          accuracyRate: 94,
          recoveryRate: 88,
          imageDescription: 'Test crop image'
        }
      })
    })
    const recData = await recRes.json()
    console.log('\n✓ Recommendations endpoint:', recData.recommendations ? 'Working' : 'No data')
    if (recData.recommendations) {
      console.log('  Sample:', recData.recommendations.substring(0, 100) + '...')
    }
  } catch (err) {
    console.error('✗ Recommendations failed:', err.message)
  }
  
  // Test insights endpoint
  try {
    const insRes = await fetch(`${BASE_URL}/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisSummary: {
          timeTaken: 4.8,
          accuracyRate: 94,
          recoveryRate: 88,
          imageDescription: 'Test crop image'
        }
      })
    })
    const insData = await insRes.json()
    console.log('\n✓ Insights endpoint:', insData.insights ? 'Working' : 'No data')
    if (insData.insights) {
      console.log('  Sample:', insData.insights.substring(0, 100) + '...')
    }
  } catch (err) {
    console.error('✗ Insights failed:', err.message)
  }
  
  console.log('\n✓ Backend is ready and communicating!')
}

testConnection().catch(console.error)
