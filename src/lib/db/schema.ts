import { pgTable, text, integer, real, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'

// Partners table - master data
export const partners = pgTable('partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tier: text('tier').notNull(), // Strategic, Select, Registered
  segment: text('segment').notNull(), // Focus, Assist
  region: text('region').notNull(),
  accountManager: text('account_manager').notNull(),
  partnerManager: text('partner_manager').notNull(),
  status: text('status').default('Active'), // Active, Inactive, Onboarding
  joinDate: timestamp('join_date').defaultNow(),
  contractEndDate: timestamp('contract_end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Partner metrics table - quarterly performance data
export const partnerMetrics = pgTable('partner_metrics', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id').notNull().references(() => partners.id),
  quarter: text('quarter').notNull(), // e.g., "Q4 2024"
  
  // Revenue metrics
  revenueCurrent: integer('revenue_current').notNull(),
  revenuePrevious: integer('revenue_previous').notNull(),
  revenueGrowth: real('revenue_growth').notNull(),
  revenueYtd: integer('revenue_ytd').notNull(),
  revenueTarget: integer('revenue_target').notNull(),
  revenueAttainment: real('revenue_attainment').notNull(),
  
  // Pipeline metrics
  pipelineCount: integer('pipeline_count').notNull(),
  pipelineValue: integer('pipeline_value').notNull(),
  pipelineConversion: real('pipeline_conversion').notNull(),
  pipelineAvgDealSize: integer('pipeline_avg_deal_size').notNull(),
  pipelineCoverage: real('pipeline_coverage').notNull(),
  
  // Deal registration metrics
  dealRegSubmitted: integer('deal_reg_submitted').notNull(),
  dealRegApproved: integer('deal_reg_approved').notNull(),
  dealRegWon: integer('deal_reg_won').notNull(),
  dealRegWinRate: real('deal_reg_win_rate').notNull(),
  
  // Engagement metrics
  engagementPortalLogins: integer('engagement_portal_logins').notNull(),
  engagementTrainingCompletionRate: real('engagement_training_completion_rate').notNull(),
  engagementMarketingFundUtilization: real('engagement_marketing_fund_utilization').notNull(),
  engagementCertifications: integer('engagement_certifications').notNull(),
  engagementLastActivityDate: timestamp('engagement_last_activity_date'),
  
  // Delivery metrics
  deliveryCustomerSatisfaction: real('delivery_customer_satisfaction').notNull(),
  deliveryAvgTimeToGoLive: integer('delivery_avg_time_to_go_live').notNull(),
  deliverySupportTickets: integer('delivery_support_tickets').notNull(),
  deliveryEscalations: integer('delivery_escalations').notNull(),
  
  // Calculated fields
  healthScore: integer('health_score').notNull(),
  riskLevel: text('risk_level').notNull(), // Low, Medium, High
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Investment calculations table (for AI insights)
export const partnerInvestments = pgTable('partner_investments', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id').notNull().references(() => partners.id),
  quarter: text('quarter').notNull(),
  
  // Investment recommendations
  recommendations: jsonb('recommendations'), // JSON array of investment suggestions
  potentialArr: integer('potential_arr'),
  riskArr: integer('risk_arr'),
  recommendedInvestment: integer('recommended_investment'),
  expectedRoi: real('expected_roi'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// QBR content cache (for AI-generated insights)
export const qbrInsights = pgTable('qbr_insights', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id').notNull().references(() => partners.id),
  quarter: text('quarter').notNull(),
  
  // AI-generated content
  executiveSummary: text('executive_summary'),
  keyInsights: text('key_insights'),
  strategicPriorities: text('strategic_priorities'),
  businessImpactForecast: text('business_impact_forecast'),
  nextActions: text('next_actions'),
  
  // Generation metadata
  modelUsed: text('model_used').default('Claude 3 Sonnet'),
  generatedAt: timestamp('generated_at').defaultNow(),
  isValid: boolean('is_valid').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Export types for use in the application
export type Partner = typeof partners.$inferSelect
export type NewPartner = typeof partners.$inferInsert
export type PartnerMetrics = typeof partnerMetrics.$inferSelect
export type NewPartnerMetrics = typeof partnerMetrics.$inferInsert
export type PartnerInvestment = typeof partnerInvestments.$inferSelect
export type QBRInsight = typeof qbrInsights.$inferSelect