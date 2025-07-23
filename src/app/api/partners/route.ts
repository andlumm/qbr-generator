import { NextRequest, NextResponse } from 'next/server'
import { CalculatedPartnerService } from '@/lib/calculated-partner-service'

export async function GET(request: NextRequest) {
  try {
    console.log('API: Starting to load partners...')
    const partners = await CalculatedPartnerService.getPartners()
    console.log(`API: Loaded ${partners.length} partners`)
    
    const partnerMetrics = await Promise.all(
      partners.slice(0, 8).map(async (partner, index) => {
        try {
          console.log(`API: Calculating metrics for partner ${index + 1}: ${partner.id} (${partner.name})`)
          const metrics = await CalculatedPartnerService.getPartnerMetricsForComponents(partner.id)
          console.log(`API - Partner ${partner.id} (${partner.name}): Growth ${metrics.revenue.growth}%, Health ${metrics.healthScore}`)
          return metrics
        } catch (error) {
          console.error(`Error calculating metrics for partner ${partner.id}:`, error)
          throw new Error(`Failed to calculate metrics for ${partner.name}: ${error.message}`)
        }
      })
    )

    console.log('API: Successfully calculated all metrics')
    return NextResponse.json({
      success: true,
      data: {
        partners: partners.slice(0, 8),
        metrics: partnerMetrics
      }
    })
  } catch (error: any) {
    console.error('Failed to load partners:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load partners',
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}