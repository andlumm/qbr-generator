import { NextResponse } from 'next/server'
import { generateQBRWithAI } from '@/lib/openrouter-client'

export async function POST(request: Request) {
  try {
    const { partner, metrics, allPartnerMetrics } = await request.json()
    
    console.log('=== QBR API Debug Info ===')
    console.log('API Key available:', !!process.env.OPENROUTER_API_KEY)
    console.log('API Key length:', process.env.OPENROUTER_API_KEY?.length || 0)
    console.log('API Key starts with:', process.env.OPENROUTER_API_KEY?.substring(0, 10) || 'N/A')
    console.log('Partner:', partner?.name)
    console.log('Metrics keys:', Object.keys(metrics || {}))
    console.log('Ecosystem data available:', !!allPartnerMetrics, allPartnerMetrics?.length || 0, 'partners')
    console.log('========================')

    // Check if API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set')
    }

    // Generate QBR insights using Claude 3 Sonnet via OpenRouter
    const aiInsights = await generateQBRWithAI(partner, metrics, allPartnerMetrics)
    
    return NextResponse.json({ 
      success: true, 
      insights: aiInsights,
      model: 'Claude 3 Sonnet (via OpenRouter)'
    })
  } catch (error) {
    console.error('=== QBR Generation Error ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Full error:', error)
    console.error('===============================')
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate QBR insights',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!process.env.OPENROUTER_API_KEY,
      apiKeyLength: process.env.OPENROUTER_API_KEY?.length || 0
    }, { status: 500 })
  }
}