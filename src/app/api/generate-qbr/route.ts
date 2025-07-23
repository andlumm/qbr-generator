import { NextResponse } from 'next/server'
import { generateQBRWithAI } from '@/lib/openrouter-client'

export async function POST(request: Request) {
  try {
    const { partner, metrics, allPartnerMetrics } = await request.json()
    
    console.log('API Key available:', !!process.env.OPENROUTER_API_KEY)
    console.log('Partner:', partner?.name)
    console.log('Metrics keys:', Object.keys(metrics || {}))
    console.log('Ecosystem data available:', !!allPartnerMetrics, allPartnerMetrics?.length || 0, 'partners')

    // Generate QBR insights using Claude 3 Sonnet via OpenRouter
    const aiInsights = await generateQBRWithAI(partner, metrics, allPartnerMetrics)
    
    return NextResponse.json({ 
      success: true, 
      insights: aiInsights,
      model: 'Claude 3 Sonnet (via OpenRouter)'
    })
  } catch (error) {
    console.error('QBR Generation Error:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate QBR insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}