import { db, partners, partnerMetrics } from './index'
import { eq, sql, desc, and } from 'drizzle-orm'

// This module contains all the business logic for calculating partner metrics
// from source data (opportunities, activities, training records, etc.)

export interface SourceData {
  // Revenue source data
  opportunities: {
    id: string
    partnerId: string
    amount: number
    closeDate: Date
    stage: string
    createdDate: Date
    isClosed: boolean
    isWon: boolean
  }[]
  
  // Deal registration data
  dealRegistrations: {
    id: string
    partnerId: string
    status: 'submitted' | 'approved' | 'rejected' | 'won' | 'lost'
    submittedDate: Date
    amount: number
  }[]
  
  // Training & engagement data
  trainingRecords: {
    partnerId: string
    completedDate: Date
    courseName: string
    required: boolean
  }[]
  
  portalActivity: {
    partnerId: string
    loginDate: Date
    activityType: string
  }[]
  
  certifications: {
    partnerId: string
    certificationName: string
    issueDate: Date
    expiryDate: Date
    isActive: boolean
  }[]
  
  // MDF data
  mdfRequests: {
    partnerId: string
    requestedAmount: number
    approvedAmount: number
    status: 'submitted' | 'approved' | 'rejected' | 'completed'
    requestDate: Date
  }[]
  
  // Customer satisfaction data
  customerSurveys: {
    partnerId: string
    score: number // 1-5
    surveyDate: Date
  }[]
  
  supportTickets: {
    partnerId: string
    createdDate: Date
    closedDate: Date | null
    isEscalated: boolean
    firstCallResolution: boolean
  }[]
  
  implementations: {
    partnerId: string
    startDate: Date
    goLiveDate: Date | null
  }[]
}

export class MetricCalculator {
  
  // Calculate revenue metrics from opportunity data
  static calculateRevenueMetrics(
    opportunities: SourceData['opportunities'], 
    partnerId: string,
    quarter: string,
    target: number
  ) {
    const quarterStart = this.getQuarterStart(quarter)
    const quarterEnd = this.getQuarterEnd(quarter)
    const previousQuarterStart = this.getPreviousQuarterStart(quarter)
    const previousQuarterEnd = this.getPreviousQuarterEnd(quarter)
    const yearStart = new Date(quarterStart.getFullYear(), 0, 1)
    
    // Current quarter revenue (closed won opportunities)
    const currentRevenue = opportunities
      .filter(opp => 
        opp.partnerId === partnerId &&
        opp.isWon &&
        opp.closeDate >= quarterStart &&
        opp.closeDate <= quarterEnd
      )
      .reduce((sum, opp) => sum + opp.amount, 0)
    
    // Previous quarter revenue
    const previousRevenue = opportunities
      .filter(opp =>
        opp.partnerId === partnerId &&
        opp.isWon &&
        opp.closeDate >= previousQuarterStart &&
        opp.closeDate <= previousQuarterEnd
      )
      .reduce((sum, opp) => sum + opp.amount, 0)
    
    // YTD revenue
    const ytdRevenue = opportunities
      .filter(opp =>
        opp.partnerId === partnerId &&
        opp.isWon &&
        opp.closeDate >= yearStart &&
        opp.closeDate <= quarterEnd
      )
      .reduce((sum, opp) => sum + opp.amount, 0)
    
    // Calculate growth and attainment
    const growth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0
    
    const attainment = target > 0 
      ? (currentRevenue / target) * 100 
      : 0
    
    return {
      current: Math.round(currentRevenue),
      previous: Math.round(previousRevenue),
      growth: Math.round(growth * 10) / 10,
      ytd: Math.round(ytdRevenue),
      target: Math.round(target),
      attainment: Math.round(attainment * 10) / 10
    }
  }
  
  // Calculate pipeline metrics
  static calculatePipelineMetrics(
    opportunities: SourceData['opportunities'],
    partnerId: string,
    revenueTarget: number
  ) {
    // Open opportunities (not closed)
    const openOpps = opportunities.filter(opp =>
      opp.partnerId === partnerId &&
      !opp.isClosed
    )
    
    const pipelineCount = openOpps.length
    const pipelineValue = openOpps.reduce((sum, opp) => sum + opp.amount, 0)
    
    // Historical conversion rate (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    
    const historicalOpps = opportunities.filter(opp =>
      opp.partnerId === partnerId &&
      opp.isClosed &&
      opp.closeDate >= twelveMonthsAgo
    )
    
    const wonOpps = historicalOpps.filter(opp => opp.isWon)
    const conversionRate = historicalOpps.length > 0
      ? (wonOpps.length / historicalOpps.length) * 100
      : 0
    
    const avgDealSize = pipelineCount > 0
      ? pipelineValue / pipelineCount
      : 0
    
    const coverage = revenueTarget > 0
      ? (pipelineValue / revenueTarget) * 100
      : 0
    
    return {
      count: pipelineCount,
      value: Math.round(pipelineValue),
      conversion: Math.round(conversionRate * 10) / 10,
      avgDealSize: Math.round(avgDealSize),
      coverage: Math.round(coverage * 10) / 10
    }
  }
  
  // Calculate deal registration metrics
  static calculateDealRegistrationMetrics(
    dealRegistrations: SourceData['dealRegistrations'],
    partnerId: string,
    quarter: string
  ) {
    const quarterStart = this.getQuarterStart(quarter)
    const quarterEnd = this.getQuarterEnd(quarter)
    
    const quarterDeals = dealRegistrations.filter(deal =>
      deal.partnerId === partnerId &&
      deal.submittedDate >= quarterStart &&
      deal.submittedDate <= quarterEnd
    )
    
    const submitted = quarterDeals.length
    const approved = quarterDeals.filter(d => 
      ['approved', 'won', 'lost'].includes(d.status)
    ).length
    const won = quarterDeals.filter(d => d.status === 'won').length
    
    const winRate = submitted > 0 ? (won / submitted) * 100 : 0
    
    return {
      submitted,
      approved,
      won,
      winRate: Math.round(winRate * 10) / 10
    }
  }
  
  // Calculate engagement metrics
  static calculateEngagementMetrics(
    trainingRecords: SourceData['trainingRecords'],
    portalActivity: SourceData['portalActivity'],
    certifications: SourceData['certifications'],
    mdfRequests: SourceData['mdfRequests'],
    partnerId: string,
    quarter: string
  ) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const quarterStart = this.getQuarterStart(quarter)
    const quarterEnd = this.getQuarterEnd(quarter)
    
    // Portal logins in last 30 days
    const portalLogins = portalActivity.filter(activity =>
      activity.partnerId === partnerId &&
      activity.activityDate >= thirtyDaysAgo
    ).length
    
    // Training completion rate
    const requiredTrainings = trainingRecords.filter(t => 
      t.partnerId === partnerId && t.required
    )
    const completedRequired = requiredTrainings.filter(t => 
      t.completedDate !== null
    ).length
    
    const trainingCompletionRate = requiredTrainings.length > 0
      ? (completedRequired / requiredTrainings.length) * 100
      : 100 // If no required trainings, consider it 100%
    
    // Active certifications
    const activeCerts = certifications.filter(cert =>
      cert.partnerId === partnerId &&
      cert.isActive &&
      cert.expiryDate > new Date()
    ).length
    
    // MDF utilization
    const quarterMdfRequests = mdfRequests.filter(request =>
      request.partnerId === partnerId &&
      request.requestDate >= quarterStart &&
      request.requestDate <= quarterEnd
    )
    
    const mdfApproved = quarterMdfRequests
      .filter(r => r.status === 'approved' || r.status === 'completed')
      .reduce((sum, r) => sum + r.approvedAmount, 0)
    
    // Assuming MDF allocation is based on partner tier (you'd get this from partner data)
    const mdfAllocation = 25000 // This should come from partner tier data
    const mdfUtilization = mdfAllocation > 0
      ? (mdfApproved / mdfAllocation) * 100
      : 0
    
    const lastActivity = portalActivity
      .filter(a => a.partnerId === partnerId)
      .sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime())[0]
    
    return {
      portalLogins,
      trainingCompletionRate: Math.round(trainingCompletionRate * 10) / 10,
      marketingFundUtilization: Math.round(mdfUtilization * 10) / 10,
      certifications: activeCerts,
      lastActivityDate: lastActivity?.activityDate || new Date()
    }
  }
  
  // Calculate delivery metrics
  static calculateDeliveryMetrics(
    customerSurveys: SourceData['customerSurveys'],
    supportTickets: SourceData['supportTickets'],
    implementations: SourceData['implementations'],
    partnerId: string,
    quarter: string
  ) {
    const quarterStart = this.getQuarterStart(quarter)
    const quarterEnd = this.getQuarterEnd(quarter)
    
    // Customer satisfaction (average of survey scores)
    const quarterSurveys = customerSurveys.filter(survey =>
      survey.partnerId === partnerId &&
      survey.surveyDate >= quarterStart &&
      survey.surveyDate <= quarterEnd
    )
    
    const customerSatisfaction = quarterSurveys.length > 0
      ? quarterSurveys.reduce((sum, s) => sum + s.score, 0) / quarterSurveys.length
      : 0
    
    // Average time to go live
    const completedImplementations = implementations.filter(impl =>
      impl.partnerId === partnerId &&
      impl.goLiveDate !== null &&
      impl.goLiveDate >= quarterStart &&
      impl.goLiveDate <= quarterEnd
    )
    
    const avgTimeToGoLive = completedImplementations.length > 0
      ? completedImplementations.reduce((sum, impl) => {
          const days = Math.floor(
            (impl.goLiveDate!.getTime() - impl.startDate.getTime()) / 
            (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0) / completedImplementations.length
      : 0
    
    // Support metrics
    const quarterTickets = supportTickets.filter(ticket =>
      ticket.partnerId === partnerId &&
      ticket.createdDate >= quarterStart &&
      ticket.createdDate <= quarterEnd
    )
    
    const supportTicketCount = quarterTickets.length
    const escalations = quarterTickets.filter(t => t.isEscalated).length
    
    return {
      customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
      avgTimeToGoLive: Math.round(avgTimeToGoLive),
      supportTickets: supportTicketCount,
      escalations
    }
  }
  
  // Calculate health score based on weighted components
  static calculateHealthScore(
    revenueAttainment: number,
    pipelineCoverage: number,
    pipelineConversion: number,
    trainingCompletionRate: number,
    portalLogins: number,
    customerSatisfaction: number,
    dealWinRate: number,
    avgDaysToClose: number
  ) {
    // Normalize metrics to 0-100 scale - reward high performers
    const normalizedRevenue = Math.min(revenueAttainment, 200) / 2.0 // Cap at 200%, more generous
    const normalizedPipeline = (
      Math.min(pipelineCoverage, 300) / 3 + // Pipeline coverage (0-300% -> 0-100)
      Math.min(pipelineConversion, 50) * 2   // Conversion rate (0-50% -> 0-100)
    ) / 2
    const normalizedEngagement = (
      trainingCompletionRate +               // Already 0-100
      Math.min(portalLogins / 30 * 100, 100) // 30+ logins = 100%
    ) / 2
    const normalizedCsat = (customerSatisfaction / 5) * 100 // 1-5 scale to 0-100
    const normalizedVelocity = (
      Math.min(dealWinRate, 40) * 2.5 +     // 40% win rate = 100
      Math.max(0, 100 - avgDaysToClose)     // Faster close = higher score
    ) / 2
    
    // Apply realistic weights focused on business outcomes
    const healthScore = (
      normalizedRevenue * 0.40 +      // 40% weight - Most important metric
      normalizedPipeline * 0.30 +      // 30% weight - Future revenue indicator  
      normalizedEngagement * 0.15 +    // 15% weight - Partner capability
      normalizedCsat * 0.10 +          // 10% weight - Customer health
      normalizedVelocity * 0.05        // 5% weight - Operational efficiency
    )
    
    // Debug logging for health score components
    console.log(`Health Score Debug - Revenue: ${normalizedRevenue.toFixed(1)} (${(normalizedRevenue * 0.40).toFixed(1)}), Pipeline: ${normalizedPipeline.toFixed(1)} (${(normalizedPipeline * 0.30).toFixed(1)}), Engagement: ${normalizedEngagement.toFixed(1)} (${(normalizedEngagement * 0.15).toFixed(1)}), CSAT: ${normalizedCsat.toFixed(1)} (${(normalizedCsat * 0.10).toFixed(1)}), Velocity: ${normalizedVelocity.toFixed(1)} (${(normalizedVelocity * 0.05).toFixed(1)}) = ${healthScore.toFixed(1)}`)
    
    return Math.round(Math.min(100, Math.max(0, healthScore)))
  }
  
  // Determine risk level based on multiple factors
  static calculateRiskLevel(
    healthScore: number,
    revenueGrowth: number,
    customerSatisfaction: number,
    pipelineCoverage: number
  ): 'Low' | 'Medium' | 'High' {
    const riskFactors = []
    
    if (healthScore < 55) riskFactors.push('low_health')
    if (revenueGrowth < -10) riskFactors.push('declining_revenue')
    if (customerSatisfaction < 3.5) riskFactors.push('low_csat')
    if (pipelineCoverage < 100) riskFactors.push('low_pipeline')
    
    if (riskFactors.length >= 3 || healthScore < 40) return 'High'
    if (riskFactors.length >= 1 || healthScore < 70) return 'Medium'
    return 'Low'
  }
  
  // Helper functions for date calculations
  private static getQuarterStart(quarter: string): Date {
    const [q, year] = quarter.split(' ')
    const quarterNum = parseInt(q.substring(1))
    const month = (quarterNum - 1) * 3
    return new Date(parseInt(year), month, 1)
  }
  
  private static getQuarterEnd(quarter: string): Date {
    const [q, year] = quarter.split(' ')
    const quarterNum = parseInt(q.substring(1))
    const month = quarterNum * 3
    return new Date(parseInt(year), month, 0, 23, 59, 59)
  }
  
  private static getPreviousQuarterStart(quarter: string): Date {
    const start = this.getQuarterStart(quarter)
    start.setMonth(start.getMonth() - 3)
    return start
  }
  
  private static getPreviousQuarterEnd(quarter: string): Date {
    const [q, year] = quarter.split(' ')
    const quarterNum = parseInt(q.substring(1))
    const prevQuarterNum = quarterNum === 1 ? 4 : quarterNum - 1
    const prevYear = quarterNum === 1 ? parseInt(year) - 1 : parseInt(year)
    const month = prevQuarterNum * 3
    return new Date(prevYear, month, 0, 23, 59, 59) // Last day of previous quarter
  }
}

// Function to calculate all metrics for a partner
export async function calculatePartnerMetrics(
  partnerId: string,
  quarter: string,
  sourceData: SourceData,
  revenueTarget: number
) {
  // Calculate all metric categories
  const revenue = MetricCalculator.calculateRevenueMetrics(
    sourceData.opportunities,
    partnerId,
    quarter,
    revenueTarget
  )
  
  const pipeline = MetricCalculator.calculatePipelineMetrics(
    sourceData.opportunities,
    partnerId,
    revenueTarget
  )
  
  const dealRegistration = MetricCalculator.calculateDealRegistrationMetrics(
    sourceData.dealRegistrations,
    partnerId,
    quarter
  )
  
  const engagement = MetricCalculator.calculateEngagementMetrics(
    sourceData.trainingRecords,
    sourceData.portalActivity,
    sourceData.certifications,
    sourceData.mdfRequests,
    partnerId,
    quarter
  )
  
  const delivery = MetricCalculator.calculateDeliveryMetrics(
    sourceData.customerSurveys,
    sourceData.supportTickets,
    sourceData.implementations,
    partnerId,
    quarter
  )
  
  // Calculate average days to close for health score
  const closedOpps = sourceData.opportunities.filter(opp =>
    opp.partnerId === partnerId &&
    opp.isClosed &&
    opp.closeDate >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  )
  
  const avgDaysToClose = closedOpps.length > 0
    ? closedOpps.reduce((sum, opp) => {
        const days = Math.floor(
          (opp.closeDate.getTime() - opp.createdDate.getTime()) /
          (1000 * 60 * 60 * 24)
        )
        return sum + days
      }, 0) / closedOpps.length
    : 90 // Default if no data
  
  // Calculate health score
  const healthScore = MetricCalculator.calculateHealthScore(
    revenue.attainment,
    pipeline.coverage,
    pipeline.conversion,
    engagement.trainingCompletionRate,
    engagement.portalLogins,
    delivery.customerSatisfaction,
    dealRegistration.winRate,
    avgDaysToClose
  )
  
  // Calculate risk level
  const riskLevel = MetricCalculator.calculateRiskLevel(
    healthScore,
    revenue.growth,
    delivery.customerSatisfaction,
    pipeline.coverage
  )
  
  return {
    partnerId,
    quarter,
    revenue,
    pipeline,
    dealRegistration,
    engagement,
    delivery,
    healthScore,
    riskLevel
  }
}