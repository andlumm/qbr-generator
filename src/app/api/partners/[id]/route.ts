import { NextRequest, NextResponse } from 'next/server'
import { PartnerService } from '@/lib/partner-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const partnerId = `partner-${params.id}`
    
    const [partner, metrics] = await Promise.all([
      PartnerService.getPartner(partnerId),
      PartnerService.getLatestMetricsForComponents(partnerId)
    ])
    
    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      partner,
      metrics
    })
  } catch (error) {
    console.error('Error fetching partner data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}