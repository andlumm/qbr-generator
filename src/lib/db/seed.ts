import { db, partners, partnerMetrics } from './index'
import { generateDummyPartners, generateDummyMetrics } from '../dummy-data'

// Helper function to convert dummy data to database format
function convertPartnerToDbFormat(partner: any) {
  return {
    id: partner.id,
    name: partner.name,
    tier: partner.tier,
    segment: partner.segment,
    region: partner.region,
    accountManager: partner.accountManager,
    partnerManager: partner.partnerManager,
    status: 'Active',
    joinDate: new Date('2023-01-01'), // Default join date
    contractEndDate: null,
  }
}

function convertMetricsToDbFormat(metrics: any) {
  return {
    id: `metrics-${metrics.partnerId}-${metrics.quarter.replace(' ', '-').toLowerCase()}`,
    partnerId: metrics.partnerId,
    quarter: metrics.quarter,
    
    // Revenue metrics
    revenueCurrent: metrics.revenue.current,
    revenuePrevious: metrics.revenue.previous,
    revenueGrowth: metrics.revenue.growth,
    revenueYtd: metrics.revenue.ytd,
    revenueTarget: metrics.revenue.target,
    revenueAttainment: metrics.revenue.attainment,
    
    // Pipeline metrics
    pipelineCount: metrics.pipeline.count,
    pipelineValue: metrics.pipeline.value,
    pipelineConversion: metrics.pipeline.conversion,
    pipelineAvgDealSize: metrics.pipeline.avgDealSize,
    pipelineCoverage: metrics.pipeline.coverage,
    
    // Deal registration metrics
    dealRegSubmitted: metrics.dealRegistration.submitted,
    dealRegApproved: metrics.dealRegistration.approved,
    dealRegWon: metrics.dealRegistration.won,
    dealRegWinRate: metrics.dealRegistration.winRate,
    
    // Engagement metrics
    engagementPortalLogins: metrics.engagement.portalLogins,
    engagementTrainingCompletionRate: metrics.engagement.trainingCompletionRate,
    engagementMarketingFundUtilization: metrics.engagement.marketingFundUtilization,
    engagementCertifications: metrics.engagement.certificationsActive,
    engagementLastActivityDate: new Date(),
    
    // Delivery metrics
    deliveryCustomerSatisfaction: metrics.delivery.customerSatisfaction,
    deliveryAvgTimeToGoLive: metrics.delivery.avgTimeToGoLive,
    deliverySupportTickets: metrics.delivery.supportTickets,
    deliveryEscalations: metrics.delivery.escalations,
    
    // Calculated fields
    healthScore: metrics.healthScore,
    riskLevel: metrics.riskLevel,
  }
}

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Generate dummy data using existing system
    const dummyPartners = generateDummyPartners(8)
    const dummyMetrics = generateDummyMetrics(dummyPartners)
    
    // Clear existing data
    await db.delete(partnerMetrics)
    await db.delete(partners)
    
    // Insert partners
    console.log('📊 Inserting partners...')
    const dbPartners = dummyPartners.map(convertPartnerToDbFormat)
    await db.insert(partners).values(dbPartners)
    console.log(`✅ Inserted ${dbPartners.length} partners`)
    
    // Insert metrics
    console.log('📈 Inserting partner metrics...')
    const dbMetrics = dummyMetrics.map(convertMetricsToDbFormat)
    await db.insert(partnerMetrics).values(dbMetrics)
    console.log(`✅ Inserted ${dbMetrics.length} partner metrics records`)
    
    console.log('🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  }
}

// Function to run seeding from command line
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}