import { MetricCalculator, calculatePartnerMetrics, type SourceData } from '../db/metric-calculations'

describe('MetricCalculator', () => {
  // Helper function to create test data
  const createTestOpportunities = (): SourceData['opportunities'] => [
    {
      id: 'opp-1',
      partnerId: 'partner-1',
      amount: 100000,
      stage: 'Closed Won',
      closeDate: new Date('2024-10-15'), // Q4 2024
      createdDate: new Date('2024-09-01'),
      isClosed: true,
      isWon: true
    },
    {
      id: 'opp-2',
      partnerId: 'partner-1',
      amount: 150000,
      stage: 'Closed Won',
      closeDate: new Date('2024-11-20'), // Q4 2024
      createdDate: new Date('2024-10-01'),
      isClosed: true,
      isWon: true
    },
    {
      id: 'opp-3',
      partnerId: 'partner-1',
      amount: 80000,
      stage: 'Closed Won',
      closeDate: new Date('2024-07-15'), // Q3 2024 (previous quarter)
      createdDate: new Date('2024-06-01'),
      isClosed: true,
      isWon: true
    },
    {
      id: 'opp-4',
      partnerId: 'partner-1',
      amount: 200000,
      stage: 'Proposal',
      closeDate: new Date('2024-12-30'), // Future close date (pipeline)
      createdDate: new Date('2024-11-01'),
      isClosed: false,
      isWon: false
    },
    {
      id: 'opp-5',
      partnerId: 'partner-1',
      amount: 120000,
      stage: 'Negotiation',
      closeDate: new Date('2025-01-15'), // Future close date (pipeline)
      createdDate: new Date('2024-10-15'),
      isClosed: false,
      isWon: false
    }
  ]

  const createTestDealRegistrations = (): SourceData['dealRegistrations'] => [
    {
      id: 'reg-1',
      partnerId: 'partner-1',
      status: 'submitted',
      submittedDate: new Date('2024-10-01'),
      amount: 50000
    },
    {
      id: 'reg-2',
      partnerId: 'partner-1',
      status: 'won',
      submittedDate: new Date('2024-10-15'),
      amount: 75000
    },
    {
      id: 'reg-3',
      partnerId: 'partner-1',
      status: 'approved',
      submittedDate: new Date('2024-11-01'),
      amount: 60000
    },
    {
      id: 'reg-4',
      partnerId: 'partner-1',
      status: 'rejected',
      submittedDate: new Date('2024-11-15'),
      amount: 40000
    }
  ]

  const createTestTrainingRecords = (): SourceData['trainingRecords'] => [
    {
      partnerId: 'partner-1',
      completedDate: new Date('2024-09-01'),
      courseName: 'Product Fundamentals',
      required: true
    },
    {
      partnerId: 'partner-1',
      completedDate: new Date('2024-09-15'),
      courseName: 'Sales Methodology',
      required: true
    },
    {
      partnerId: 'partner-1',
      completedDate: null as any, // Not completed
      courseName: 'Technical Deep Dive',
      required: true
    },
    {
      partnerId: 'partner-1',
      completedDate: new Date('2024-10-01'),
      courseName: 'Advanced Configuration',
      required: false
    }
  ]

  describe('calculateRevenueMetrics', () => {
    it('should calculate current quarter revenue correctly', () => {
      const opportunities = createTestOpportunities()
      const result = MetricCalculator.calculateRevenueMetrics(
        opportunities,
        'partner-1',
        'Q4 2024',
        300000
      )

      // Q4 2024 revenue = 100000 + 150000 = 250000
      expect(result.current).toBe(250000)
    })

    it('should calculate previous quarter revenue correctly', () => {
      const opportunities = createTestOpportunities()
      const result = MetricCalculator.calculateRevenueMetrics(
        opportunities,
        'partner-1',
        'Q4 2024',
        300000
      )

      // Q3 2024 revenue = 80000
      expect(result.previous).toBe(80000)
    })

    it('should calculate revenue growth correctly', () => {
      const opportunities = createTestOpportunities()
      const result = MetricCalculator.calculateRevenueMetrics(
        opportunities,
        'partner-1',
        'Q4 2024',
        300000
      )

      // Growth = ((250000 - 80000) / 80000) * 100 = 212.5%
      expect(result.growth).toBe(212.5)
    })

    it('should handle zero previous revenue', () => {
      const opportunities = [
        {
          id: 'opp-1',
          partnerId: 'partner-1',
          amount: 100000,
          stage: 'Closed Won',
          closeDate: new Date('2024-10-15'),
          createdDate: new Date('2024-09-01'),
          isClosed: true,
          isWon: true
        }
      ]

      const result = MetricCalculator.calculateRevenueMetrics(
        opportunities,
        'partner-1',
        'Q4 2024',
        300000
      )

      expect(result.growth).toBe(0)
    })

    it('should calculate revenue attainment correctly', () => {
      const opportunities = createTestOpportunities()
      const result = MetricCalculator.calculateRevenueMetrics(
        opportunities,
        'partner-1',
        'Q4 2024',
        300000
      )

      // Attainment = (250000 / 300000) * 100 = 83.3%
      expect(result.attainment).toBe(83.3)
    })

    it('should calculate YTD revenue correctly', () => {
      const opportunities = [
        ...createTestOpportunities(),
        {
          id: 'opp-ytd',
          partnerId: 'partner-1',
          amount: 50000,
          stage: 'Closed Won',
          closeDate: new Date('2024-03-15'), // Q1 2024
          createdDate: new Date('2024-02-01'),
          isClosed: true,
          isWon: true
        }
      ]

      const result = MetricCalculator.calculateRevenueMetrics(
        opportunities,
        'partner-1',
        'Q4 2024',
        300000
      )

      // YTD = Q4 + Q3 + Q1 = 250000 + 80000 + 50000 = 380000
      expect(result.ytd).toBe(380000)
    })
  })

  describe('calculatePipelineMetrics', () => {
    it('should calculate pipeline count correctly', () => {
      const opportunities = createTestOpportunities()
      const result = MetricCalculator.calculatePipelineMetrics(
        opportunities,
        'partner-1',
        300000
      )

      // 2 open opportunities
      expect(result.count).toBe(2)
    })

    it('should calculate pipeline value correctly', () => {
      const opportunities = createTestOpportunities()
      const result = MetricCalculator.calculatePipelineMetrics(
        opportunities,
        'partner-1',
        300000
      )

      // Pipeline value = 200000 + 120000 = 320000
      expect(result.value).toBe(320000)
    })

    it('should calculate pipeline coverage correctly', () => {
      const opportunities = createTestOpportunities()
      const result = MetricCalculator.calculatePipelineMetrics(
        opportunities,
        'partner-1',
        300000
      )

      // Coverage = (320000 / 300000) * 100 = 106.7%
      expect(result.coverage).toBe(106.7)
    })

    it('should calculate average deal size correctly', () => {
      const opportunities = createTestOpportunities()
      const result = MetricCalculator.calculatePipelineMetrics(
        opportunities,
        'partner-1',
        300000
      )

      // Avg deal size = 320000 / 2 = 160000
      expect(result.avgDealSize).toBe(160000)
    })

    it('should calculate conversion rate from historical data', () => {
      const opportunities = createTestOpportunities()
      const result = MetricCalculator.calculatePipelineMetrics(
        opportunities,
        'partner-1',
        300000
      )

      // Historical closed deals: 3 total, 3 won = 100% conversion
      expect(result.conversion).toBe(100)
    })

    it('should handle empty pipeline', () => {
      const opportunities = createTestOpportunities().filter(opp => opp.isClosed)
      const result = MetricCalculator.calculatePipelineMetrics(
        opportunities,
        'partner-1',
        300000
      )

      expect(result.count).toBe(0)
      expect(result.value).toBe(0)
      expect(result.avgDealSize).toBe(0)
      expect(result.coverage).toBe(0)
    })
  })

  describe('calculateDealRegistrationMetrics', () => {
    it('should calculate deal registration metrics correctly', () => {
      const dealRegistrations = createTestDealRegistrations()
      const result = MetricCalculator.calculateDealRegistrationMetrics(
        dealRegistrations,
        'partner-1',
        'Q4 2024'
      )

      expect(result.submitted).toBe(4) // All 4 deals submitted in Q4
      expect(result.approved).toBe(2) // 1 won + 1 approved = 2
      expect(result.won).toBe(1) // 1 won deal
      expect(result.winRate).toBe(25) // 1/4 = 25%
    })

    it('should filter by quarter correctly', () => {
      const dealRegistrations = [
        ...createTestDealRegistrations(),
        {
          id: 'reg-old',
          partnerId: 'partner-1',
          status: 'won' as const,
          submittedDate: new Date('2024-07-01'), // Q3, not Q4
          amount: 100000
        }
      ]

      const result = MetricCalculator.calculateDealRegistrationMetrics(
        dealRegistrations,
        'partner-1',
        'Q4 2024'
      )

      // Should only count Q4 deals, not the Q3 deal
      expect(result.submitted).toBe(4)
    })

    it('should handle no deal registrations', () => {
      const result = MetricCalculator.calculateDealRegistrationMetrics(
        [],
        'partner-1',
        'Q4 2024'
      )

      expect(result.submitted).toBe(0)
      expect(result.approved).toBe(0)
      expect(result.won).toBe(0)
      expect(result.winRate).toBe(0)
    })
  })

  describe('calculateEngagementMetrics', () => {
    const createPortalActivity = (): SourceData['portalActivity'] => {
      const now = new Date()
      return [
        { partnerId: 'partner-1', activityType: 'login', activityDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) }, // 5 days ago
        { partnerId: 'partner-1', activityType: 'login', activityDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) }, // 10 days ago
        { partnerId: 'partner-1', activityType: 'download', activityDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) }, // 15 days ago
        { partnerId: 'partner-1', activityType: 'login', activityDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) }, // 45 days ago (outside 30 days)
      ]
    }

    const createCertifications = (): SourceData['certifications'] => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      const pastDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
      
      return [
        {
          partnerId: 'partner-1',
          certificationName: 'Product Specialist',
          issueDate: new Date('2024-01-01'),
          expiryDate: futureDate, // Active
          isActive: true
        },
        {
          partnerId: 'partner-1',
          certificationName: 'Technical Expert',
          issueDate: new Date('2023-01-01'),
          expiryDate: pastDate, // Expired
          isActive: false
        }
      ]
    }

    const createMDFRequests = (): SourceData['mdfRequests'] => [
      {
        partnerId: 'partner-1',
        requestedAmount: 10000,
        approvedAmount: 8000,
        status: 'approved',
        requestDate: new Date('2024-10-01')
      },
      {
        partnerId: 'partner-1',
        requestedAmount: 15000,
        approvedAmount: 12000,
        status: 'completed',
        requestDate: new Date('2024-11-01')
      }
    ]

    it('should calculate portal logins in last 30 days', () => {
      const result = MetricCalculator.calculateEngagementMetrics(
        createTestTrainingRecords(),
        createPortalActivity(),
        createCertifications(),
        createMDFRequests(),
        'partner-1',
        'Q4 2024'
      )

      // 3 activities within last 30 days
      expect(result.portalLogins).toBe(3)
    })

    it('should calculate training completion rate', () => {
      const result = MetricCalculator.calculateEngagementMetrics(
        createTestTrainingRecords(),
        createPortalActivity(),
        createCertifications(),
        createMDFRequests(),
        'partner-1',
        'Q4 2024'
      )

      // 2 out of 3 required trainings completed = 66.7%
      expect(result.trainingCompletionRate).toBe(66.7)
    })

    it('should count active certifications only', () => {
      const result = MetricCalculator.calculateEngagementMetrics(
        createTestTrainingRecords(),
        createPortalActivity(),
        createCertifications(),
        createMDFRequests(),
        'partner-1',
        'Q4 2024'
      )

      // Only 1 active certification
      expect(result.certifications).toBe(1)
    })

    it('should calculate MDF utilization', () => {
      const result = MetricCalculator.calculateEngagementMetrics(
        createTestTrainingRecords(),
        createPortalActivity(),
        createCertifications(),
        createMDFRequests(),
        'partner-1',
        'Q4 2024'
      )

      // Approved amount = 8000 + 12000 = 20000
      // Allocation = 25000 (default)
      // Utilization = (20000 / 25000) * 100 = 80%
      expect(result.marketingFundUtilization).toBe(80)
    })

    it('should handle 100% training completion rate', () => {
      const allCompletedTrainings = [
        { partnerId: 'partner-1', completedDate: new Date('2024-09-01'), courseName: 'Course 1', required: true },
        { partnerId: 'partner-1', completedDate: new Date('2024-09-15'), courseName: 'Course 2', required: true }
      ]

      const result = MetricCalculator.calculateEngagementMetrics(
        allCompletedTrainings,
        [],
        [],
        [],
        'partner-1',
        'Q4 2024'
      )

      expect(result.trainingCompletionRate).toBe(100)
    })
  })

  describe('calculateDeliveryMetrics', () => {
    const createCustomerSurveys = (): SourceData['customerSurveys'] => [
      { partnerId: 'partner-1', score: 4.5, surveyDate: new Date('2024-10-01') },
      { partnerId: 'partner-1', score: 3.8, surveyDate: new Date('2024-11-01') },
      { partnerId: 'partner-1', score: 4.2, surveyDate: new Date('2024-12-01') }
    ]

    const createSupportTickets = (): SourceData['supportTickets'] => [
      {
        partnerId: 'partner-1',
        createdDate: new Date('2024-10-01'),
        closedDate: new Date('2024-10-02'),
        isEscalated: false,
        firstCallResolution: true
      },
      {
        partnerId: 'partner-1',
        createdDate: new Date('2024-11-01'),
        closedDate: new Date('2024-11-03'),
        isEscalated: true,
        firstCallResolution: false
      }
    ]

    const createImplementations = (): SourceData['implementations'] => [
      {
        partnerId: 'partner-1',
        startDate: new Date('2024-09-01'),
        goLiveDate: new Date('2024-10-31') // 60 days
      },
      {
        partnerId: 'partner-1',
        startDate: new Date('2024-10-01'),
        goLiveDate: new Date('2024-11-15') // 45 days
      }
    ]

    it('should calculate average customer satisfaction', () => {
      const result = MetricCalculator.calculateDeliveryMetrics(
        createCustomerSurveys(),
        createSupportTickets(),
        createImplementations(),
        'partner-1',
        'Q4 2024'
      )

      // Average of 4.5, 3.8, 4.2 = 4.17 (rounded to 4.2)
      expect(result.customerSatisfaction).toBe(4.2)
    })

    it('should calculate average time to go live', () => {
      const result = MetricCalculator.calculateDeliveryMetrics(
        createCustomerSurveys(),
        createSupportTickets(),
        createImplementations(),
        'partner-1',
        'Q4 2024'
      )

      // Average of 60 and 45 days = 52.5, rounded to 53
      expect(result.avgTimeToGoLive).toBe(53)
    })

    it('should count support tickets correctly', () => {
      const result = MetricCalculator.calculateDeliveryMetrics(
        createCustomerSurveys(),
        createSupportTickets(),
        createImplementations(),
        'partner-1',
        'Q4 2024'
      )

      expect(result.supportTickets).toBe(2)
    })

    it('should count escalations correctly', () => {
      const result = MetricCalculator.calculateDeliveryMetrics(
        createCustomerSurveys(),
        createSupportTickets(),
        createImplementations(),
        'partner-1',
        'Q4 2024'
      )

      expect(result.escalations).toBe(1)
    })

    it('should handle empty data gracefully', () => {
      const result = MetricCalculator.calculateDeliveryMetrics(
        [],
        [],
        [],
        'partner-1',
        'Q4 2024'
      )

      expect(result.customerSatisfaction).toBe(0)
      expect(result.avgTimeToGoLive).toBe(0)
      expect(result.supportTickets).toBe(0)
      expect(result.escalations).toBe(0)
    })
  })

  describe('calculateHealthScore', () => {
    it('should calculate health score correctly with good metrics', () => {
      const healthScore = MetricCalculator.calculateHealthScore(
        100, // 100% revenue attainment
        200, // 200% pipeline coverage
        40,  // 40% pipeline conversion
        90,  // 90% training completion
        20,  // 20 portal logins
        4.5, // 4.5/5 CSAT
        30,  // 30% deal win rate
        60   // 60 days average close time
      )

      // Should be a high score (70+)
      expect(healthScore).toBeGreaterThan(70)
      expect(healthScore).toBeLessThanOrEqual(100)
    })

    it('should calculate health score correctly with poor metrics', () => {
      const healthScore = MetricCalculator.calculateHealthScore(
        50,  // 50% revenue attainment
        80,  // 80% pipeline coverage
        15,  // 15% pipeline conversion
        40,  // 40% training completion
        2,   // 2 portal logins
        2.5, // 2.5/5 CSAT
        10,  // 10% deal win rate
        120  // 120 days average close time
      )

      // Should be a low score
      expect(healthScore).toBeLessThan(60)
      expect(healthScore).toBeGreaterThanOrEqual(0)
    })

    it('should handle edge cases and cap values appropriately', () => {
      const healthScore = MetricCalculator.calculateHealthScore(
        200, // 200% revenue attainment (should be capped)
        500, // 500% pipeline coverage (should be capped)
        80,  // 80% pipeline conversion (should be capped)
        100, // 100% training completion
        50,  // 50 portal logins (should be capped)
        5.0, // 5.0/5 CSAT
        60,  // 60% deal win rate (should be capped)
        10   // 10 days average close time
      )

      expect(healthScore).toBeLessThanOrEqual(100)
      expect(healthScore).toBeGreaterThan(90) // Should be very high but not exceed 100
    })
  })

  describe('calculateRiskLevel', () => {
    it('should return Low risk for healthy partners', () => {
      const riskLevel = MetricCalculator.calculateRiskLevel(
        85,  // High health score
        15,  // Positive revenue growth
        4.5, // High customer satisfaction
        200  // Strong pipeline coverage
      )

      expect(riskLevel).toBe('Low')
    })

    it('should return Medium risk for at-risk partners', () => {
      const riskLevel = MetricCalculator.calculateRiskLevel(
        65,  // Medium health score
        5,   // Low positive growth
        3.8, // Moderate customer satisfaction
        80   // Low pipeline coverage
      )

      expect(riskLevel).toBe('Medium')
    })

    it('should return High risk for critical partners', () => {
      const riskLevel = MetricCalculator.calculateRiskLevel(
        40,  // Very low health score
        -15, // Declining revenue
        2.8, // Poor customer satisfaction
        60   // Very low pipeline coverage
      )

      expect(riskLevel).toBe('High')
    })

    it('should return High risk for low health score regardless of other metrics', () => {
      const riskLevel = MetricCalculator.calculateRiskLevel(
        35,  // Very low health score
        20,  // Good revenue growth
        4.8, // Excellent customer satisfaction
        250  // Strong pipeline coverage
      )

      expect(riskLevel).toBe('High')
    })
  })

  describe('Date helper functions', () => {
    it('should calculate quarter dates correctly', () => {
      // Test Q4 2024
      const q4Start = (MetricCalculator as any).getQuarterStart('Q4 2024')
      const q4End = (MetricCalculator as any).getQuarterEnd('Q4 2024')

      expect(q4Start.getMonth()).toBe(9) // October (0-indexed)
      expect(q4Start.getDate()).toBe(1)
      expect(q4Start.getFullYear()).toBe(2024)

      expect(q4End.getMonth()).toBe(11) // December (0-indexed)
      expect(q4End.getDate()).toBe(31)
      expect(q4End.getFullYear()).toBe(2024)
    })

    it('should calculate previous quarter dates correctly', () => {
      const prevStart = (MetricCalculator as any).getPreviousQuarterStart('Q4 2024')
      const prevEnd = (MetricCalculator as any).getPreviousQuarterEnd('Q4 2024')

      expect(prevStart.getMonth()).toBe(6) // July (0-indexed)
      expect(prevStart.getDate()).toBe(1)
      expect(prevStart.getFullYear()).toBe(2024)

      expect(prevEnd.getMonth()).toBe(8) // September (0-indexed)
      expect(prevEnd.getDate()).toBe(30) // September 30th (last day of Q3)
      expect(prevEnd.getFullYear()).toBe(2024)
    })
  })

  describe('Integration tests', () => {
    it('should calculate complete partner metrics', async () => {
      const sourceData: SourceData = {
        opportunities: createTestOpportunities(),
        dealRegistrations: createTestDealRegistrations(),
        trainingRecords: createTestTrainingRecords(),
        portalActivity: [
          { partnerId: 'partner-1', activityType: 'login', activityDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
        ],
        certifications: [
          { partnerId: 'partner-1', certificationName: 'Test Cert', issueDate: new Date(), expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), isActive: true }
        ],
        mdfRequests: [
          { partnerId: 'partner-1', requestedAmount: 10000, approvedAmount: 8000, status: 'approved', requestDate: new Date('2024-10-01') }
        ],
        customerSurveys: [
          { partnerId: 'partner-1', score: 4.2, surveyDate: new Date('2024-10-01') }
        ],
        supportTickets: [
          { partnerId: 'partner-1', createdDate: new Date('2024-10-01'), closedDate: new Date('2024-10-02'), isEscalated: false, firstCallResolution: true }
        ],
        implementations: [
          { partnerId: 'partner-1', startDate: new Date('2024-09-01'), goLiveDate: new Date('2024-10-31') }
        ]
      }

      const result = await calculatePartnerMetrics(
        'partner-1',
        'Q4 2024',
        sourceData,
        300000
      )

      // Verify all sections are calculated
      expect(result.partnerId).toBe('partner-1')
      expect(result.quarter).toBe('Q4 2024')
      expect(result.revenue.current).toBe(250000)
      expect(result.pipeline.count).toBe(2)
      expect(result.dealRegistration.submitted).toBe(4)
      expect(result.engagement.trainingCompletionRate).toBe(66.7)
      expect(result.delivery.customerSatisfaction).toBe(4.2)
      expect(result.healthScore).toBeGreaterThan(0)
      expect(result.healthScore).toBeLessThanOrEqual(100)
      expect(['Low', 'Medium', 'High']).toContain(result.riskLevel)
    })

    it('should handle partner with no data gracefully', async () => {
      const emptySourceData: SourceData = {
        opportunities: [],
        dealRegistrations: [],
        trainingRecords: [],
        portalActivity: [],
        certifications: [],
        mdfRequests: [],
        customerSurveys: [],
        supportTickets: [],
        implementations: []
      }

      const result = await calculatePartnerMetrics(
        'partner-empty',
        'Q4 2024',
        emptySourceData,
        100000
      )

      expect(result.revenue.current).toBe(0)
      expect(result.pipeline.count).toBe(0)
      expect(result.healthScore).toBeGreaterThanOrEqual(0)
      expect(result.riskLevel).toBeDefined()
    })
  })
})