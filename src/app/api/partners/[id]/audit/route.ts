import { NextRequest, NextResponse } from 'next/server'
import { CalculatedPartnerService } from '@/lib/calculated-partner-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const partnerId = `partner-${id}`
    const url = new URL(request.url)
    const metricName = url.searchParams.get('metric')
    const quarter = url.searchParams.get('quarter') || 'Q4 2024'

    if (!metricName) {
      return NextResponse.json(
        { error: 'Missing metric parameter' },
        { status: 400 }
      )
    }

    const auditTrail = CalculatedPartnerService.getMetricAuditTrail(
      partnerId, 
      metricName, 
      quarter
    )

    return NextResponse.json({ success: true, data: auditTrail })
  } catch (error) {
    console.error('Failed to get audit trail:', error)
    return NextResponse.json(
      { error: 'Failed to get audit trail' },
      { status: 500 }
    )
  }
}