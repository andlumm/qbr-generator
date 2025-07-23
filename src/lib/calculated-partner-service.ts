import { MockDataGenerator } from './mock-source-data'
import { calculatePartnerMetrics, type SourceData } from './db/metric-calculations'
import { getAllPartners } from './db/operations'
import type { Partner } from './db/schema'

// Service that uses real calculations with mock source data
export class CalculatedPartnerService {
  
  // Cache for source data to avoid regenerating
  private static sourceDataCache = new Map<string, SourceData>()
  private static partnersCache: Partner[] | null = null
  
  // Clear caches (for debugging)
  static clearCaches() {
    this.sourceDataCache.clear()
    this.partnersCache = null
  }
  
  // Get all partners from database
  static async getPartners(): Promise<Partner[]> {
    if (!this.partnersCache) {
      this.partnersCache = await getAllPartners()
    }
    return this.partnersCache
  }
  
  // Get source data for a partner (cached with deterministic seed)
  static getSourceData(partnerId: string): SourceData {
    // Clear cache to use updated health score calculation
    this.sourceDataCache.delete(partnerId)
    
    if (!this.sourceDataCache.has(partnerId)) {
      try {
        // Use consistent seed based on partner ID for deterministic results
        const partnerNumber = parseInt(partnerId.replace(/\D/g, '')) || 1
        const seed = 12345 + partnerNumber * 1000
        const sourceData = MockDataGenerator.generateCompleteSourceData(partnerId, seed)
        this.sourceDataCache.set(partnerId, sourceData)
        console.log(`Generated realistic source data for ${partnerId} with seed ${seed}`)
      } catch (error) {
        console.error(`Error generating source data for ${partnerId}:`, error)
        throw error
      }
    }
    return this.sourceDataCache.get(partnerId)!
  }
  
  // Get calculated metrics for a partner
  static async getPartnerMetrics(partnerId: string, quarter: string = 'Q4 2024') {
    const sourceData = this.getSourceData(partnerId)
    
    // Get revenue target based on partner tier
    const partners = await this.getPartners()
    const partner = partners.find(p => p.id === partnerId)
    
    if (!partner) {
      throw new Error(`Partner ${partnerId} not found`)
    }
    
    // Set realistic quarterly targets based on partner tier  
    const revenueTargets = {
      'Strategic': 200000,  // ~$800k annually
      'Select': 125000,     // ~$500k annually  
      'Registered': 75000   // ~$300k annually
    }
    
    const revenueTarget = revenueTargets[partner.tier as keyof typeof revenueTargets] || 300000
    
    // Calculate metrics using real business logic
    const calculatedMetrics = await calculatePartnerMetrics(
      partnerId,
      quarter,
      sourceData,
      revenueTarget
    )
    
    return {
      ...calculatedMetrics,
      // Add source data for audit trail
      sourceDataSummary: {
        opportunities: sourceData.opportunities.length,
        dealRegistrations: sourceData.dealRegistrations.length,
        trainingRecords: sourceData.trainingRecords.length,
        portalActivity: sourceData.portalActivity.length,
        certifications: sourceData.certifications.length,
        mdfRequests: sourceData.mdfRequests.length,
        customerSurveys: sourceData.customerSurveys.length,
        supportTickets: sourceData.supportTickets.length,
        implementations: sourceData.implementations.length
      }
    }
  }
  
  // Get all partner metrics for ecosystem benchmarking
  static async getAllPartnerMetrics(quarter: string = 'Q4 2024') {
    const partners = await this.getPartners()
    const allMetrics = []
    
    for (const partner of partners) {
      try {
        const metrics = await this.getPartnerMetrics(partner.id, quarter)
        allMetrics.push(metrics)
      } catch (error) {
        console.error(`Failed to calculate metrics for ${partner.id}:`, error)
        // Continue with other partners
      }
    }
    
    return allMetrics
  }
  
  // Convert to format expected by existing components
  static convertToComponentFormat(calculatedMetrics: any) {
    return {
      partnerId: calculatedMetrics.partnerId,
      quarter: calculatedMetrics.quarter,
      revenue: calculatedMetrics.revenue,
      pipeline: calculatedMetrics.pipeline,
      dealRegistration: calculatedMetrics.dealRegistration,
      engagement: calculatedMetrics.engagement,
      delivery: calculatedMetrics.delivery,
      healthScore: calculatedMetrics.healthScore,
      riskLevel: calculatedMetrics.riskLevel
    }
  }
  
  // Get partner metrics in component format
  static async getPartnerMetricsForComponents(partnerId: string, quarter: string = 'Q4 2024') {
    const metrics = await this.getPartnerMetrics(partnerId, quarter)
    return this.convertToComponentFormat(metrics)
  }
  
  // Get all metrics in component format
  static async getAllMetricsForComponents(quarter: string = 'Q4 2024') {
    const allMetrics = await this.getAllPartnerMetrics(quarter)
    return allMetrics.map(m => this.convertToComponentFormat(m))
  }
  
  // Get audit trail for a specific metric
  static getMetricAuditTrail(partnerId: string, metricName: string, quarter: string = 'Q4 2024') {
    const sourceData = this.getSourceData(partnerId)
    
    switch (metricName) {
      case 'revenue_growth':
        return {
          calculation: 'Revenue Growth = ((Current Quarter - Previous Quarter) / Previous Quarter) × 100',
          sourceData: {
            currentQuarterDeals: sourceData.opportunities.filter(opp => 
              opp.partnerId === partnerId && 
              opp.isWon && 
              this.isInQuarter(opp.closeDate, quarter)
            ).length,
            previousQuarterDeals: sourceData.opportunities.filter(opp => 
              opp.partnerId === partnerId && 
              opp.isWon && 
              this.isInPreviousQuarter(opp.closeDate, quarter)
            ).length
          }
        }
        
      case 'training_completion':
        const requiredTrainings = sourceData.trainingRecords.filter(t => 
          t.partnerId === partnerId && t.required
        )
        const completedRequired = requiredTrainings.filter(t => t.completedDate)
        
        return {
          calculation: 'Training Completion = (Completed Required Courses / Total Required Courses) × 100',
          sourceData: {
            totalRequired: requiredTrainings.length,
            completed: completedRequired.length,
            courses: requiredTrainings.map(t => ({
              name: t.courseName,
              completed: !!t.completedDate,
              completedDate: t.completedDate
            }))
          }
        }
        
      case 'health_score':
        return {
          calculation: 'Health Score = (Revenue×30% + Pipeline×25% + Engagement×20% + CSAT×15% + Velocity×10%)',
          components: {
            revenue: '30% weight',
            pipeline: '25% weight', 
            engagement: '20% weight',
            customerSatisfaction: '15% weight',
            dealVelocity: '10% weight'
          },
          sourceData: {
            revenueData: sourceData.opportunities.filter(opp => opp.isWon).length + ' won deals',
            pipelineData: sourceData.opportunities.filter(opp => !opp.isClosed).length + ' open deals',
            engagementData: sourceData.trainingRecords.length + ' training records',
            csatData: sourceData.customerSurveys.length + ' survey responses',
            velocityData: sourceData.opportunities.filter(opp => opp.isClosed).length + ' closed deals'
          }
        }
        
      default:
        return {
          calculation: 'Metric calculation details not available',
          sourceData: {}
        }
    }
  }
  
  // Helper methods for date filtering
  private static isInQuarter(date: Date, quarter: string): boolean {
    // Implementation for quarter date checking
    const [q, year] = quarter.split(' ')
    const quarterNum = parseInt(q.substring(1))
    const startMonth = (quarterNum - 1) * 3
    const endMonth = quarterNum * 3 - 1
    
    return date.getFullYear() === parseInt(year) &&
           date.getMonth() >= startMonth &&
           date.getMonth() <= endMonth
  }
  
  private static isInPreviousQuarter(date: Date, quarter: string): boolean {
    const [q, year] = quarter.split(' ')
    const quarterNum = parseInt(q.substring(1))
    
    let prevQuarter: number
    let prevYear: number
    
    if (quarterNum === 1) {
      prevQuarter = 4
      prevYear = parseInt(year) - 1
    } else {
      prevQuarter = quarterNum - 1
      prevYear = parseInt(year)
    }
    
    const startMonth = (prevQuarter - 1) * 3
    const endMonth = prevQuarter * 3 - 1
    
    return date.getFullYear() === prevYear &&
           date.getMonth() >= startMonth &&
           date.getMonth() <= endMonth
  }
  
  // Clear cache (useful for testing)
  static clearCache() {
    this.sourceDataCache.clear()
    this.partnersCache = null
  }
}