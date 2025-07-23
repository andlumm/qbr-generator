import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalculatedPartnerService } from '@/lib/calculated-partner-service'
import type { Partner } from '@/lib/db/schema'
import { PartnerQBRClient } from './client'
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, 
  BarChart3, Users, Target, Calendar, ArrowLeft,
  Download, Mail, Sparkles, Loader2
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PartnerQBRPage({ params }: PageProps) {
  // Fetch data on the server - await params in Next.js 15
  const { id } = await params
  const partnerId = `partner-${id}`
  
  try {
    // Load all partner data for ecosystem benchmarks
    const [partners, allMetrics, partner, metrics] = await Promise.all([
      CalculatedPartnerService.getPartners(),
      CalculatedPartnerService.getAllMetricsForComponents(),
      CalculatedPartnerService.getPartners().then(p => p.find(partner => partner.id === partnerId)),
      CalculatedPartnerService.getPartnerMetricsForComponents(partnerId)
    ])
    
    // Log for debugging
    console.log(`Individual - Partner ${partnerId} (${partner?.name}): Growth ${metrics?.revenue.growth}%, Health ${metrics?.healthScore}`)
    
    if (!partner || !metrics) {
      notFound()
    }
    
    return (
      <PartnerQBRClient 
        partner={partner}
        metrics={metrics}
        allPartners={partners}
        allPartnerMetrics={allMetrics}
      />
    )
  } catch (error) {
    console.error('Failed to load partner data:', error)
    notFound()
  }
}

