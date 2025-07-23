export interface Partner {
  id: string
  name: string
  tier: 'Strategic' | 'Select' | 'Registered'
  segment: 'Focus' | 'Assist'
  region: string
  accountManager: string
  partnerManager: string
  logo?: string
}

export interface PartnerMetrics {
  partnerId: string
  quarter: string
  revenue: {
    current: number
    previous: number
    growth: number
    ytd: number
    target: number
    attainment: number
  }
  pipeline: {
    count: number
    value: number
    conversion: number
    avgDealSize: number
    coverage: number // Pipeline Coverage Ratio
  }
  dealRegistration: {
    submitted: number
    approved: number
    won: number
    winRate: number
  }
  engagement: {
    portalLogins: number
    trainingsCompleted: number
    certificationsActive: number
    lastActivityDate: string
    trainingCompletionRate: number
    marketingFundUtilization: number
    eventParticipation: number
  }
  delivery: {
    avgTimeToGoLive: number
    supportTickets: number
    escalations: number
    customerSatisfaction: number
  }
  healthScore: number
  riskLevel: 'Low' | 'Medium' | 'High'
  highlights: string[]
  challenges: string[]
  initiatives: string[]
}

// Dummy data generator
export const generateDummyPartners = (count: number = 10): Partner[] => {
  const companies = [
    'TechNova Solutions', 'CloudSync Partners', 'DataFlow Systems',
    'CyberShield Inc', 'Quantum Analytics', 'NextGen Software',
    'Digital Dynamics', 'InfoStream Corp', 'ByteForce Technologies',
    'Apex Innovations', 'SmartGrid Solutions', 'FutureScale Systems'
  ]
  
  const regions = ['North America', 'EMEA', 'APAC', 'LATAM']
  const managers = ['Sarah Chen', 'Michael Porter', 'Elena Rodriguez', 'James Wilson']
  
  return companies.slice(0, count).map((name, index) => ({
    id: `partner-${index + 1}`,
    name,
    tier: index < 3 ? 'Strategic' : index < 6 ? 'Select' : 'Registered',
    segment: index < 5 ? 'Focus' : 'Assist',
    region: regions[index % regions.length],
    accountManager: managers[index % managers.length],
    partnerManager: managers[(index + 1) % managers.length]
  }))
}

export const generateDummyMetrics = (partners: Partner[]): PartnerMetrics[] => {
  return partners.map((partner, index) => {
    // Use index-based seed for consistent data
    const seed = index + 1
    const baseRevenue = partner.tier === 'Strategic' ? 500000 : 
                       partner.tier === 'Select' ? 200000 : 50000
    
    // More realistic revenue with some variance but reasonable growth rates
    const revenueVariance = 0.8 + (seed * 0.1 % 1) * 0.4 // 0.8 to 1.2 multiplier
    const current = Math.round(baseRevenue * revenueVariance)
    
    // Growth rate between -25% and +30% (realistic range)
    const growthRate = -0.25 + (seed * 0.15 % 1) * 0.55
    const previous = Math.round(current / (1 + growthRate))
    const growth = ((current - previous) / previous) * 100
    const target = baseRevenue * 1.2
    const attainment = (current / target) * 100
    
    const dealsSubmitted = Math.floor((seed * 0.2 % 1) * 20) + 5
    const dealsApproved = Math.floor(dealsSubmitted * (0.6 + (seed * 0.25 % 1) * 0.3))
    const dealsWon = Math.floor(dealsApproved * (0.3 + (seed * 0.3 % 1) * 0.4))
    
    // Realistic pipeline coverage: 80-350% (most partners 120-250%)
    const coverageMultiplier = 1.2 + (seed * 0.35 % 1) * 1.3 // 1.2 to 2.5
    const pipelineValue = Math.round(target * coverageMultiplier)
    const pipelineCoverage = (pipelineValue / target) * 100
    
    return {
      partnerId: partner.id,
      quarter: 'Q4 2024',
      revenue: {
        current: Math.round(current),
        previous: Math.round(previous),
        growth: Math.round(growth * 10) / 10,
        ytd: Math.round(current * 3.5),
        target: Math.round(target),
        attainment: Math.round(attainment * 10) / 10
      },
      pipeline: {
        count: Math.floor((seed * 0.4 % 1) * 50) + 10,
        value: pipelineValue,
        conversion: Math.round((15 + (seed * 0.45 % 1) * 25) * 10) / 10, // 15-40% realistic range
        avgDealSize: Math.round(pipelineValue / (Math.floor((seed * 0.4 % 1) * 50) + 10)), // Based on actual pipeline
        coverage: Math.round(pipelineCoverage * 10) / 10
      },
      dealRegistration: {
        submitted: dealsSubmitted,
        approved: dealsApproved,
        won: dealsWon,
        winRate: Math.round((dealsWon / dealsSubmitted) * 100 * 10) / 10
      },
      engagement: {
        portalLogins: Math.floor((seed * 0.55 % 1) * 100) + 20,
        trainingsCompleted: Math.floor((seed * 0.6 % 1) * 10) + 2,
        certificationsActive: Math.floor((seed * 0.65 % 1) * 5) + 1,
        lastActivityDate: new Date(Date.now() - (seed * 0.7 % 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        trainingCompletionRate: Math.round((70 + (seed * 0.75 % 1) * 30) * 10) / 10,
        marketingFundUtilization: Math.round((40 + (seed * 0.8 % 1) * 50) * 10) / 10,
        eventParticipation: Math.floor((seed * 0.85 % 1) * 8) + 1
      },
      delivery: {
        avgTimeToGoLive: Math.floor((seed * 0.9 % 1) * 30) + 15,
        supportTickets: Math.floor((seed * 0.95 % 1) * 20) + 2,
        escalations: Math.floor((seed * 1.0 % 1) * 3),
        customerSatisfaction: Math.round((3.5 + (seed * 1.05 % 1) * 1.5) * 10) / 10
      },
      healthScore: Math.round((70 + (seed * 1.1 % 1) * 30) * 10) / 10,
      riskLevel: growth < 0 ? 'High' : growth < 10 ? 'Medium' : 'Low',
      highlights: [
        'Successfully launched new product line',
        'Exceeded Q4 targets by 15%',
        'Completed enterprise certification program'
      ],
      challenges: [
        'Pipeline conversion needs improvement',
        'Additional technical resources required',
        'Competitive pressure in mid-market segment'
      ],
      initiatives: [
        'Q1 co-marketing campaign planning',
        'Advanced technical training for sales team',
        'Joint solution development for healthcare vertical'
      ]
    }
  })
}