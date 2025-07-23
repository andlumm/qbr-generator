import { eq, desc } from 'drizzle-orm'
import { db, partners, partnerMetrics, qbrInsights, type Partner, type PartnerMetrics } from './index'

// Partner operations
export async function getAllPartners(): Promise<Partner[]> {
  return await db.select().from(partners).orderBy(partners.name)
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  const result = await db.select().from(partners).where(eq(partners.id, id)).limit(1)
  return result[0] || null
}

export async function createPartner(partner: Omit<Partner, 'createdAt' | 'updatedAt'>): Promise<Partner> {
  const result = await db.insert(partners).values({
    ...partner,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  return result[0]
}

// Partner metrics operations
export async function getAllPartnerMetrics(): Promise<PartnerMetrics[]> {
  return await db.select().from(partnerMetrics).orderBy(desc(partnerMetrics.createdAt))
}

export async function getPartnerMetrics(partnerId: string, quarter?: string): Promise<PartnerMetrics[]> {
  let query = db.select().from(partnerMetrics).where(eq(partnerMetrics.partnerId, partnerId))
  
  if (quarter) {
    query = query.where(eq(partnerMetrics.quarter, quarter))
  }
  
  return await query.orderBy(desc(partnerMetrics.createdAt))
}

export async function getLatestPartnerMetrics(partnerId: string): Promise<PartnerMetrics | null> {
  const result = await db.select().from(partnerMetrics)
    .where(eq(partnerMetrics.partnerId, partnerId))
    .orderBy(desc(partnerMetrics.createdAt))
    .limit(1)
  
  return result[0] || null
}

export async function createPartnerMetrics(metrics: Omit<PartnerMetrics, 'id' | 'createdAt' | 'updatedAt'>): Promise<PartnerMetrics> {
  const result = await db.insert(partnerMetrics).values({
    ...metrics,
    id: `metrics-${metrics.partnerId}-${metrics.quarter.replace(' ', '-').toLowerCase()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  return result[0]
}

// QBR insights operations
export async function getQBRInsights(partnerId: string, quarter: string) {
  const result = await db.select().from(qbrInsights)
    .where(eq(qbrInsights.partnerId, partnerId))
    .where(eq(qbrInsights.quarter, quarter))
    .orderBy(desc(qbrInsights.generatedAt))
    .limit(1)
  
  return result[0] || null
}

export async function saveQBRInsights(partnerId: string, quarter: string, insights: {
  executiveSummary: string
  keyInsights: string
  strategicPriorities: string
  businessImpactForecast: string
  nextActions: string
}, modelUsed: string = 'Claude 3 Sonnet') {
  const id = `qbr-${partnerId}-${quarter.replace(' ', '-').toLowerCase()}`
  
  // Upsert logic: try to update first, then insert if doesn't exist
  const existing = await getQBRInsights(partnerId, quarter)
  
  if (existing) {
    const result = await db.update(qbrInsights)
      .set({
        ...insights,
        modelUsed,
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(qbrInsights.id, existing.id))
      .returning()
    return result[0]
  } else {
    const result = await db.insert(qbrInsights).values({
      id,
      partnerId,
      quarter,
      ...insights,
      modelUsed,
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()
    return result[0]
  }
}

// Utility functions for migrating from dummy data
export async function seedDatabase() {
  // This function will populate the database with sample data
  // We'll implement this after the basic operations are working
  console.log('Database seeding functionality - to be implemented')
}