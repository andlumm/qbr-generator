import { CalculatedPartnerService } from '../calculated-partner-service'
import { MockDataGenerator } from '../mock-source-data'

// Mock the database operations
jest.mock('../db/operations', () => ({
  getAllPartners: jest.fn().mockResolvedValue([
    {
      id: 'partner-1',
      name: 'Test Partner',
      tier: 'Strategic',
      segment: 'Focus',
      region: 'North America',
      accountManager: 'John Doe',
      partnerManager: 'Jane Smith',
      status: 'Active'
    }
  ])
}))

describe('CalculatedPartnerService', () => {
  beforeEach(() => {
    // Clear cache before each test
    CalculatedPartnerService.clearCache()
  })

  describe('getPartnerMetrics', () => {
    it('should calculate metrics using real business logic', async () => {
      const metrics = await CalculatedPartnerService.getPartnerMetrics('partner-1')
      
      // Verify structure
      expect(metrics).toHaveProperty('partnerId', 'partner-1')
      expect(metrics).toHaveProperty('quarter', 'Q4 2024')
      expect(metrics).toHaveProperty('revenue')
      expect(metrics).toHaveProperty('pipeline')
      expect(metrics).toHaveProperty('dealRegistration')
      expect(metrics).toHaveProperty('engagement')
      expect(metrics).toHaveProperty('delivery')
      expect(metrics).toHaveProperty('healthScore')
      expect(metrics).toHaveProperty('riskLevel')
      
      // Verify calculated values are realistic
      expect(metrics.revenue.current).toBeGreaterThan(0)
      expect(metrics.revenue.attainment).toBeGreaterThan(0)
      expect(metrics.healthScore).toBeGreaterThanOrEqual(0)
      expect(metrics.healthScore).toBeLessThanOrEqual(100)
      expect(['Low', 'Medium', 'High']).toContain(metrics.riskLevel)
    })

    it('should include source data summary for audit trail', async () => {
      const metrics = await CalculatedPartnerService.getPartnerMetrics('partner-1')
      
      expect(metrics).toHaveProperty('sourceDataSummary')
      expect(metrics.sourceDataSummary).toHaveProperty('opportunities')
      expect(metrics.sourceDataSummary).toHaveProperty('dealRegistrations')
      expect(metrics.sourceDataSummary).toHaveProperty('trainingRecords')
      expect(metrics.sourceDataSummary).toHaveProperty('portalActivity')
      
      // Verify all source data counts are positive
      Object.values(metrics.sourceDataSummary).forEach(count => {
        expect(count).toBeGreaterThan(0)
      })
    })

    it('should set appropriate revenue targets based on partner tier', async () => {
      const strategicMetrics = await CalculatedPartnerService.getPartnerMetrics('partner-1')
      
      // Strategic partners should have higher targets
      expect(strategicMetrics.revenue.target).toBe(600000)
    })

    it('should use consistent source data for same partner', async () => {
      const metrics1 = await CalculatedPartnerService.getPartnerMetrics('partner-1')
      const metrics2 = await CalculatedPartnerService.getPartnerMetrics('partner-1')
      
      // Should get identical results due to caching
      expect(metrics1.sourceDataSummary).toEqual(metrics2.sourceDataSummary)
      expect(metrics1.revenue.current).toBe(metrics2.revenue.current)
      expect(metrics1.healthScore).toBe(metrics2.healthScore)
    })
  })

  describe('getAllPartnerMetrics', () => {
    it('should calculate metrics for all partners', async () => {
      const allMetrics = await CalculatedPartnerService.getAllPartnerMetrics()
      
      expect(allMetrics).toHaveLength(1) // Only one partner in mock
      expect(allMetrics[0]).toHaveProperty('partnerId', 'partner-1')
      expect(allMetrics[0]).toHaveProperty('healthScore')
    })
  })

  describe('convertToComponentFormat', () => {
    it('should convert calculated metrics to component format', async () => {
      const metrics = await CalculatedPartnerService.getPartnerMetrics('partner-1')
      const componentFormat = CalculatedPartnerService.convertToComponentFormat(metrics)
      
      // Should have all required fields for components
      expect(componentFormat).toHaveProperty('partnerId')
      expect(componentFormat).toHaveProperty('quarter')
      expect(componentFormat).toHaveProperty('revenue')
      expect(componentFormat).toHaveProperty('pipeline')
      expect(componentFormat).toHaveProperty('dealRegistration')
      expect(componentFormat).toHaveProperty('engagement')
      expect(componentFormat).toHaveProperty('delivery')
      expect(componentFormat).toHaveProperty('healthScore')
      expect(componentFormat).toHaveProperty('riskLevel')
      
      // Should not have internal calculation fields
      expect(componentFormat).not.toHaveProperty('sourceDataSummary')
    })
  })

  describe('getMetricAuditTrail', () => {
    it('should provide audit trail for revenue growth', () => {
      const auditTrail = CalculatedPartnerService.getMetricAuditTrail('partner-1', 'revenue_growth')
      
      expect(auditTrail).toHaveProperty('calculation')
      expect(auditTrail).toHaveProperty('sourceData')
      expect(auditTrail.calculation).toContain('Revenue Growth')
      expect(auditTrail.sourceData).toHaveProperty('currentQuarterDeals')
      expect(auditTrail.sourceData).toHaveProperty('previousQuarterDeals')
    })

    it('should provide audit trail for training completion', () => {
      const auditTrail = CalculatedPartnerService.getMetricAuditTrail('partner-1', 'training_completion')
      
      expect(auditTrail).toHaveProperty('calculation')
      expect(auditTrail).toHaveProperty('sourceData')
      expect(auditTrail.calculation).toContain('Training Completion')
      expect(auditTrail.sourceData).toHaveProperty('totalRequired')
      expect(auditTrail.sourceData).toHaveProperty('completed')
      expect(auditTrail.sourceData).toHaveProperty('courses')
    })

    it('should provide audit trail for health score', () => {
      const auditTrail = CalculatedPartnerService.getMetricAuditTrail('partner-1', 'health_score')
      
      expect(auditTrail).toHaveProperty('calculation')
      expect(auditTrail).toHaveProperty('components')
      expect(auditTrail).toHaveProperty('sourceData')
      expect(auditTrail.calculation).toContain('Health Score')
      expect(auditTrail.components).toHaveProperty('revenue')
      expect(auditTrail.components).toHaveProperty('pipeline')
      expect(auditTrail.components).toHaveProperty('engagement')
    })

    it('should handle unknown metrics gracefully', () => {
      const auditTrail = CalculatedPartnerService.getMetricAuditTrail('partner-1', 'unknown_metric')
      
      expect(auditTrail).toHaveProperty('calculation')
      expect(auditTrail).toHaveProperty('sourceData')
      expect(auditTrail.calculation).toContain('not available')
    })
  })

  describe('source data consistency', () => {
    it('should use cached source data for performance', () => {
      // First call
      const sourceData1 = CalculatedPartnerService.getSourceData('partner-1')
      
      // Second call should use cache
      const sourceData2 = CalculatedPartnerService.getSourceData('partner-1')
      
      // Should be identical objects (same reference due to caching)
      expect(sourceData1).toBe(sourceData2)
    })

    it('should generate different data for different partners', () => {
      const sourceData1 = CalculatedPartnerService.getSourceData('partner-1')
      const sourceData2 = CalculatedPartnerService.getSourceData('partner-2')
      
      // Should be different data sets
      expect(sourceData1).not.toEqual(sourceData2)
    })
  })

  describe('error handling', () => {
    it('should throw error for non-existent partner', async () => {
      await expect(
        CalculatedPartnerService.getPartnerMetrics('non-existent-partner')
      ).rejects.toThrow('Partner non-existent-partner not found')
    })

    it.skip('should continue processing other partners if one fails', async () => {
      // Mock a failing partner by making getPartnerMetrics throw for specific partner
      const originalGetPartnerMetrics = CalculatedPartnerService.getPartnerMetrics
      const mockGetPartnerMetrics = jest.fn().mockImplementation((partnerId) => {
        if (partnerId === 'invalid-partner') {
          throw new Error('Test error')
        }
        return originalGetPartnerMetrics(partnerId)
      })
      CalculatedPartnerService.getPartnerMetrics = mockGetPartnerMetrics

      const originalGetPartners = CalculatedPartnerService.getPartners
      CalculatedPartnerService.getPartners = jest.fn().mockResolvedValue([
        { id: 'partner-1', tier: 'Strategic', segment: 'Focus', region: 'NA', accountManager: 'John', partnerManager: 'Jane', status: 'Active' },
        { id: 'invalid-partner', tier: 'Strategic', segment: 'Focus', region: 'NA', accountManager: 'John', partnerManager: 'Jane', status: 'Active' }
      ])

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const allMetrics = await CalculatedPartnerService.getAllPartnerMetrics()
      
      // Should have processed the valid partner
      expect(allMetrics.length).toBe(1)
      expect(allMetrics[0].partnerId).toBe('partner-1')
      
      // Should have logged error for invalid partner
      expect(consoleSpy).toHaveBeenCalledWith('Failed to calculate metrics for invalid-partner:', expect.any(Error))
      
      consoleSpy.mockRestore()
      CalculatedPartnerService.getPartners = originalGetPartners
      CalculatedPartnerService.getPartnerMetrics = originalGetPartnerMetrics
    })
  })
})