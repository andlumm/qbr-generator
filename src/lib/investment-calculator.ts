import { Partner, PartnerMetrics } from './dummy-data'

export interface InvestmentTemplate {
  name: string
  description: string
  baseCost: number
  duration: number // months
  expectedROI: number // multiplier
  riskFactor: number // 0-1
  applicableConditions: (partner: Partner, metrics: PartnerMetrics) => boolean
  impactCalculator: (partner: Partner, metrics: PartnerMetrics) => {
    potentialARR: number
    riskARR: number
    investment: number
  }
}

export interface PartnerInvestmentProfile {
  tier: 'Strategic' | 'Select' | 'Registered'
  baseEnablementCost: number
  salesCoachingMultiplier: number
  technicalSupportCost: number
  marketingFundBudget: number
}

// Investment profiles by partner tier
export const PARTNER_INVESTMENT_PROFILES: Record<string, PartnerInvestmentProfile> = {
  Strategic: {
    tier: 'Strategic',
    baseEnablementCost: 25000,      // High-touch enablement
    salesCoachingMultiplier: 1.5,   // Premium coaching
    technicalSupportCost: 15000,    // Dedicated technical resources
    marketingFundBudget: 50000      // Large MDF budget
  },
  Select: {
    tier: 'Select',
    baseEnablementCost: 15000,      // Standard enablement
    salesCoachingMultiplier: 1.2,   // Regular coaching
    technicalSupportCost: 8000,     // Shared technical resources
    marketingFundBudget: 25000      // Medium MDF budget
  },
  Registered: {
    tier: 'Registered',
    baseEnablementCost: 8000,       // Self-service + basic training
    salesCoachingMultiplier: 1.0,   // Group coaching
    technicalSupportCost: 3000,     // Basic technical support
    marketingFundBudget: 10000      // Small MDF budget
  }
}

// Industry benchmarks for ROI calculations
export const ROI_BENCHMARKS = {
  enablementROI: 4.2,              // $4.20 return per $1 invested
  salesCoachingROI: 3.8,           // Based on Salesforce research
  technicalSupportROI: 2.9,        // Technical enablement impact
  marketingROI: 2.4,               // Partner marketing programs
  healthRemediationROI: 5.1        // High ROI due to churn prevention
}

// Investment templates with realistic calculations
export const INVESTMENT_TEMPLATES: InvestmentTemplate[] = [
  {
    name: 'Enablement Acceleration',
    description: 'Comprehensive training program to improve deal complexity and win rates',
    baseCost: 15000,
    duration: 6,
    expectedROI: ROI_BENCHMARKS.enablementROI,
    riskFactor: 0.15,
    applicableConditions: (partner, metrics) => 
      metrics.engagement.trainingCompletionRate < 85 || metrics.dealRegistration.winRate < 30,
    impactCalculator: (partner, metrics) => {
      const profile = PARTNER_INVESTMENT_PROFILES[partner.tier]
      const investment = profile.baseEnablementCost
      
      // Calculate potential impact based on current gaps
      const trainingGap = Math.max(0, 90 - metrics.engagement.trainingCompletionRate) / 100
      const winRateGap = Math.max(0, 35 - metrics.dealRegistration.winRate) / 100
      
      // Potential ARR increase from better enablement
      const avgDealIncrease = metrics.pipeline.avgDealSize * 0.25 * trainingGap
      const dealVolumeIncrease = metrics.pipeline.count * 0.15 * winRateGap
      const potentialARR = (avgDealIncrease * dealVolumeIncrease) * 4 // Annualized
      
      // Risk ARR (what we lose if partner churns due to poor enablement)
      const riskARR = metrics.revenue.current * 0.2 * trainingGap
      
      return {
        potentialARR: Math.round(potentialARR),
        riskARR: Math.round(riskARR),
        investment
      }
    }
  },
  {
    name: 'Sales Performance Coaching',
    description: 'Dedicated sales coaching to improve pipeline conversion and deal velocity',
    baseCost: 8000,
    duration: 3,
    expectedROI: ROI_BENCHMARKS.salesCoachingROI,
    riskFactor: 0.12,
    applicableConditions: (partner, metrics) => 
      metrics.pipeline.conversion < 35 || metrics.pipeline.coverage < 150,
    impactCalculator: (partner, metrics) => {
      const profile = PARTNER_INVESTMENT_PROFILES[partner.tier]
      const investment = profile.baseEnablementCost * 0.4 * profile.salesCoachingMultiplier
      
      // Calculate conversion improvement potential
      const conversionGap = Math.max(0, 35 - metrics.pipeline.conversion) / 100
      const pipelineGap = Math.max(0, 150 - metrics.pipeline.coverage) / 100
      
      // Potential ARR from improved conversion
      const pipelineImpact = metrics.pipeline.value * conversionGap * 0.3
      const velocityImpact = metrics.revenue.current * 0.15 * conversionGap
      const potentialARR = pipelineImpact + velocityImpact
      
      // Risk of continued poor performance
      const riskARR = metrics.pipeline.value * 0.1 * Math.max(conversionGap, pipelineGap)
      
      return {
        potentialARR: Math.round(potentialARR),
        riskARR: Math.round(riskARR),
        investment: Math.round(investment)
      }
    }
  },
  {
    name: 'Health Remediation Program',
    description: 'Intensive support program for at-risk partners to prevent churn',
    baseCost: 12000,
    duration: 4,
    expectedROI: ROI_BENCHMARKS.healthRemediationROI,
    riskFactor: 0.25,
    applicableConditions: (partner, metrics) => 
      metrics.healthScore < 75 || metrics.riskLevel === 'High',
    impactCalculator: (partner, metrics) => {
      const profile = PARTNER_INVESTMENT_PROFILES[partner.tier]
      const urgencyMultiplier = metrics.healthScore < 60 ? 1.5 : 1.2
      const investment = profile.baseEnablementCost * 0.6 * urgencyMultiplier
      
      // High ROI due to churn prevention
      const churnProbability = (100 - metrics.healthScore) / 100
      const churnCost = metrics.revenue.current * 1.5 // Cost to replace partner
      const potentialARR = churnCost * churnProbability * 0.7 // 70% remediation success rate
      
      // Risk of losing partner entirely
      const riskARR = metrics.revenue.current * churnProbability
      
      return {
        potentialARR: Math.round(potentialARR),
        riskARR: Math.round(riskARR),
        investment: Math.round(investment)
      }
    }
  },
  {
    name: 'Technical Enablement',
    description: 'Advanced technical training and solution architecture support',
    baseCost: 10000,
    duration: 5,
    expectedROI: ROI_BENCHMARKS.technicalSupportROI,
    riskFactor: 0.18,
    applicableConditions: (partner, metrics) => 
      metrics.pipeline.avgDealSize < 75000 || metrics.delivery.avgTimeToGoLive > 30,
    impactCalculator: (partner, metrics) => {
      const profile = PARTNER_INVESTMENT_PROFILES[partner.tier]
      const investment = profile.technicalSupportCost
      
      // Technical enablement increases deal size and reduces delivery time
      const dealSizeGap = Math.max(0, 100000 - metrics.pipeline.avgDealSize) / 100000
      const deliveryGap = Math.max(0, metrics.delivery.avgTimeToGoLive - 20) / 30
      
      // Potential from larger, faster deals
      const dealSizeIncrease = metrics.pipeline.count * metrics.pipeline.avgDealSize * 0.3 * dealSizeGap
      const velocityIncrease = metrics.revenue.current * 0.2 * deliveryGap
      const potentialARR = dealSizeIncrease + velocityIncrease
      
      // Risk of technical competency gaps limiting growth
      const riskARR = metrics.pipeline.value * 0.15 * Math.max(dealSizeGap, deliveryGap)
      
      return {
        potentialARR: Math.round(potentialARR),
        riskARR: Math.round(riskARR),
        investment
      }
    }
  }
]

export class PartnerInvestmentCalculator {
  static calculateRecommendedInvestments(
    partner: Partner, 
    metrics: PartnerMetrics
  ): Array<{
    name: string
    description: string
    potentialARR: number
    riskARR: number
    investment: number
    expectedROI: number
    priority: 'High' | 'Medium' | 'Low'
  }> {
    const applicableTemplates = INVESTMENT_TEMPLATES.filter(template => 
      template.applicableConditions(partner, metrics)
    )

    const recommendations = applicableTemplates.map(template => {
      const impact = template.impactCalculator(partner, metrics)
      const roi = impact.potentialARR / impact.investment
      
      // Determine priority based on ROI and risk
      let priority: 'High' | 'Medium' | 'Low' = 'Low'
      if (roi > 4 && impact.riskARR > impact.investment) priority = 'High'
      else if (roi > 2.5) priority = 'Medium'

      return {
        name: template.name,
        description: template.description,
        potentialARR: impact.potentialARR,
        riskARR: impact.riskARR,
        investment: impact.investment,
        expectedROI: roi,
        priority
      }
    })

    // Filter out recommendations with zero or minimal impact, sort by ROI descending
    return recommendations
      .filter(rec => rec.potentialARR > 1000 && rec.investment > 0) // Only show meaningful investments
      .sort((a, b) => b.expectedROI - a.expectedROI)
      .slice(0, 4)
  }

  static formatCurrency(amount: number): string {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`
    return `$${amount.toLocaleString()}`
  }
}