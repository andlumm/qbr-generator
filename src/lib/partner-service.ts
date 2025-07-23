import { getAllPartners, getPartnerById, getAllPartnerMetrics, getPartnerMetrics, getLatestPartnerMetrics } from './db/operations'
import type { Partner, PartnerMetrics } from './db/schema'

// Service layer that provides the same interface as dummy-data but uses the database
export class PartnerService {
  
  // Get all partners
  static async getPartners(): Promise<Partner[]> {
    return await getAllPartners()
  }
  
  // Get partner by ID
  static async getPartner(id: string): Promise<Partner | null> {
    return await getPartnerById(id)
  }
  
  // Get all partner metrics
  static async getAllMetrics(): Promise<PartnerMetrics[]> {
    return await getAllPartnerMetrics()
  }
  
  // Get metrics for a specific partner
  static async getPartnerMetrics(partnerId: string, quarter?: string): Promise<PartnerMetrics[]> {
    return await getPartnerMetrics(partnerId, quarter)
  }
  
  // Get latest metrics for a partner
  static async getLatestMetrics(partnerId: string): Promise<PartnerMetrics | null> {
    return await getLatestPartnerMetrics(partnerId)
  }
  
  // Convert database partner metrics to the format expected by components
  static convertDbMetricsToComponentFormat(dbMetrics: PartnerMetrics) {
    return {
      partnerId: dbMetrics.partnerId,
      quarter: dbMetrics.quarter,
      revenue: {
        current: dbMetrics.revenueCurrent,
        previous: dbMetrics.revenuePrevious,
        growth: dbMetrics.revenueGrowth,
        ytd: dbMetrics.revenueYtd,
        target: dbMetrics.revenueTarget,
        attainment: dbMetrics.revenueAttainment,
      },
      pipeline: {
        count: dbMetrics.pipelineCount,
        value: dbMetrics.pipelineValue,
        conversion: dbMetrics.pipelineConversion,
        avgDealSize: dbMetrics.pipelineAvgDealSize,
        coverage: dbMetrics.pipelineCoverage,
      },
      dealRegistration: {
        submitted: dbMetrics.dealRegSubmitted,
        approved: dbMetrics.dealRegApproved,
        won: dbMetrics.dealRegWon,
        winRate: dbMetrics.dealRegWinRate,
      },
      engagement: {
        portalLogins: dbMetrics.engagementPortalLogins,
        trainingCompletionRate: dbMetrics.engagementTrainingCompletionRate,
        marketingFundUtilization: dbMetrics.engagementMarketingFundUtilization,
        certifications: dbMetrics.engagementCertifications,
        lastActivityDate: dbMetrics.engagementLastActivityDate,
      },
      delivery: {
        customerSatisfaction: dbMetrics.deliveryCustomerSatisfaction,
        avgTimeToGoLive: dbMetrics.deliveryAvgTimeToGoLive,
        supportTickets: dbMetrics.deliverySupportTickets,
        escalations: dbMetrics.deliveryEscalations,
      },
      healthScore: dbMetrics.healthScore,
      riskLevel: dbMetrics.riskLevel as 'Low' | 'Medium' | 'High',
    }
  }
  
  // Get all metrics in component format
  static async getAllMetricsForComponents() {
    const dbMetrics = await getAllPartnerMetrics()
    return dbMetrics.map(this.convertDbMetricsToComponentFormat)
  }
  
  // Get partner metrics in component format
  static async getPartnerMetricsForComponents(partnerId: string, quarter?: string) {
    const dbMetrics = await getPartnerMetrics(partnerId, quarter)
    return dbMetrics.map(this.convertDbMetricsToComponentFormat)
  }
  
  // Get latest metrics in component format
  static async getLatestMetricsForComponents(partnerId: string) {
    const dbMetrics = await getLatestPartnerMetrics(partnerId)
    return dbMetrics ? this.convertDbMetricsToComponentFormat(dbMetrics) : null
  }
}