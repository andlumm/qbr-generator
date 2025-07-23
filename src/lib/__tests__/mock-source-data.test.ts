import { MockDataGenerator } from '../mock-source-data'

describe('MockDataGenerator', () => {
  describe('generateOpportunities', () => {
    it('should generate same number of opportunities for same seed', () => {
      const data1 = MockDataGenerator.generateOpportunities('partner-1', 123)
      const data2 = MockDataGenerator.generateOpportunities('partner-1', 123)
      
      expect(data1.length).toBe(data2.length)
      // Check that amounts are consistent
      data1.forEach((opp, index) => {
        expect(opp.amount).toBe(data2[index].amount)
        expect(opp.isWon).toBe(data2[index].isWon)
        expect(opp.isClosed).toBe(data2[index].isClosed)
      })
    })

    it('should generate different data for different seeds', () => {
      const data1 = MockDataGenerator.generateOpportunities('partner-1', 123)
      const data2 = MockDataGenerator.generateOpportunities('partner-1', 456)
      
      expect(data1).not.toEqual(data2)
    })

    it('should generate both closed and open opportunities', () => {
      const opportunities = MockDataGenerator.generateOpportunities('partner-1', 123)
      
      const closedOpps = opportunities.filter(opp => opp.isClosed)
      const openOpps = opportunities.filter(opp => !opp.isClosed)
      
      expect(closedOpps.length).toBeGreaterThan(0)
      expect(openOpps.length).toBeGreaterThan(0)
    })

    it('should have realistic opportunity amounts', () => {
      const opportunities = MockDataGenerator.generateOpportunities('partner-1', 123)
      
      opportunities.forEach(opp => {
        expect(opp.amount).toBeGreaterThan(0)
        expect(opp.amount).toBeLessThan(2000000) // Reasonable upper bound
      })
    })

    it('should have proper date relationships', () => {
      const opportunities = MockDataGenerator.generateOpportunities('partner-1', 123)
      
      opportunities.forEach(opp => {
        expect(opp.createdDate).toBeInstanceOf(Date)
        expect(opp.closeDate).toBeInstanceOf(Date)
        
        // For closed opportunities, close date should be after created date
        if (opp.isClosed) {
          expect(opp.closeDate.getTime()).toBeGreaterThanOrEqual(opp.createdDate.getTime())
        }
      })
    })

    it('should generate opportunities with correct partner attribution', () => {
      const opportunities = MockDataGenerator.generateOpportunities('partner-2', 123)
      
      opportunities.forEach(opp => {
        expect(opp.partnerId).toBe('partner-2')
      })
    })

    it('should have won opportunities only when closed', () => {
      const opportunities = MockDataGenerator.generateOpportunities('partner-1', 123)
      
      const wonOpps = opportunities.filter(opp => opp.isWon)
      wonOpps.forEach(opp => {
        expect(opp.isClosed).toBe(true)
        expect(opp.stage).toBe('Closed Won')
      })
    })
  })

  describe('generateDealRegistrations', () => {
    it('should generate consistent data for same seed', () => {
      const data1 = MockDataGenerator.generateDealRegistrations('partner-1', 123)
      const data2 = MockDataGenerator.generateDealRegistrations('partner-1', 123)
      
      expect(data1.length).toBe(data2.length)
      // Check key properties are consistent
      data1.forEach((reg, index) => {
        expect(reg.status).toBe(data2[index].status)
        expect(reg.amount).toBe(data2[index].amount)
      })
    })

    it('should generate registrations with valid statuses', () => {
      const registrations = MockDataGenerator.generateDealRegistrations('partner-1', 123)
      const validStatuses = ['submitted', 'approved', 'rejected', 'won', 'lost']
      
      registrations.forEach(reg => {
        expect(validStatuses).toContain(reg.status)
        expect(reg.partnerId).toBe('partner-1')
        expect(reg.amount).toBeGreaterThan(0)
        expect(reg.submittedDate).toBeInstanceOf(Date)
      })
    })

    it('should distribute statuses realistically', () => {
      const registrations = MockDataGenerator.generateDealRegistrations('partner-1', 123)
      
      const statusCounts = registrations.reduce((counts, reg) => {
        counts[reg.status] = (counts[reg.status] || 0) + 1
        return counts
      }, {} as Record<string, number>)
      
      // Should have some variety in statuses
      expect(Object.keys(statusCounts).length).toBeGreaterThan(1)
    })

    it('should generate registrations across multiple months', () => {
      const registrations = MockDataGenerator.generateDealRegistrations('partner-1', 123)
      
      const months = new Set(registrations.map(reg => 
        `${reg.submittedDate.getFullYear()}-${reg.submittedDate.getMonth()}`
      ))
      
      expect(months.size).toBeGreaterThan(1)
    })
  })

  describe('generateTrainingRecords', () => {
    it('should generate both required and optional trainings', () => {
      const trainings = MockDataGenerator.generateTrainingRecords('partner-1', 123)
      
      const requiredTrainings = trainings.filter(t => t.required)
      const optionalTrainings = trainings.filter(t => !t.required)
      
      expect(requiredTrainings.length).toBeGreaterThan(0)
      expect(trainings.length).toBeGreaterThan(requiredTrainings.length) // Should have some optional ones too
    })

    it('should have higher completion rates for required trainings', () => {
      const trainings = MockDataGenerator.generateTrainingRecords('partner-1', 123)
      
      const requiredCompleted = trainings.filter(t => t.required && t.completedDate).length
      const requiredTotal = trainings.filter(t => t.required).length
      const requiredCompletionRate = requiredCompleted / requiredTotal
      
      // Required trainings should have reasonable completion rate
      expect(requiredCompletionRate).toBeGreaterThan(0.5) // At least 50%
    })

    it('should generate realistic course names', () => {
      const trainings = MockDataGenerator.generateTrainingRecords('partner-1', 123)
      
      trainings.forEach(training => {
        expect(training.courseName).toBeDefined()
        expect(training.courseName.length).toBeGreaterThan(0)
        expect(training.partnerId).toBe('partner-1')
      })
    })
  })

  describe('generatePortalActivity', () => {
    it('should generate activity within last 60 days', () => {
      const activities = MockDataGenerator.generatePortalActivity('partner-1', 123)
      const now = new Date()
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      
      activities.forEach(activity => {
        expect(activity.activityDate.getTime()).toBeGreaterThanOrEqual(sixtyDaysAgo.getTime())
        expect(activity.activityDate.getTime()).toBeLessThanOrEqual(now.getTime())
      })
    })

    it('should generate various activity types', () => {
      const activities = MockDataGenerator.generatePortalActivity('partner-1', 123)
      const validTypes = ['login', 'download', 'training_access', 'deal_submission']
      
      activities.forEach(activity => {
        expect(validTypes).toContain(activity.activityType)
        expect(activity.partnerId).toBe('partner-1')
      })
    })

    it('should generate activities during business hours', () => {
      const activities = MockDataGenerator.generatePortalActivity('partner-1', 123)
      
      activities.forEach(activity => {
        const hour = activity.activityDate.getHours()
        expect(hour).toBeGreaterThanOrEqual(8)
        expect(hour).toBeLessThan(18)
      })
    })
  })

  describe('generateCertifications', () => {
    it('should generate certifications with proper expiry logic', () => {
      const certifications = MockDataGenerator.generateCertifications('partner-1', 123)
      
      certifications.forEach(cert => {
        expect(cert.issueDate).toBeInstanceOf(Date)
        expect(cert.expiryDate).toBeInstanceOf(Date)
        expect(cert.expiryDate.getTime()).toBeGreaterThan(cert.issueDate.getTime())
        
        // isActive should match whether expiry date is in the future
        const isCurrentlyActive = cert.expiryDate > new Date()
        expect(cert.isActive).toBe(isCurrentlyActive)
      })
    })

    it('should generate realistic certification names', () => {
      const certifications = MockDataGenerator.generateCertifications('partner-1', 123)
      
      certifications.forEach(cert => {
        expect(cert.certificationName).toBeDefined()
        expect(cert.certificationName.length).toBeGreaterThan(0)
        expect(cert.partnerId).toBe('partner-1')
      })
    })
  })

  describe('generateMDFRequests', () => {
    it('should generate requests with consistent status and approval logic', () => {
      const requests = MockDataGenerator.generateMDFRequests('partner-1', 123)
      
      requests.forEach(request => {
        expect(request.requestedAmount).toBeGreaterThan(0)
        expect(request.partnerId).toBe('partner-1')
        
        // If rejected or submitted, approved amount should be 0
        if (request.status === 'rejected' || request.status === 'submitted') {
          expect(request.approvedAmount).toBe(0)
        }
        
        // If approved or completed, should have some approved amount
        if (request.status === 'approved' || request.status === 'completed') {
          expect(request.approvedAmount).toBeGreaterThan(0)
          expect(request.approvedAmount).toBeLessThanOrEqual(request.requestedAmount)
        }
      })
    })

    it('should distribute requests across quarters', () => {
      const requests = MockDataGenerator.generateMDFRequests('partner-1', 123)
      
      const quarters = new Set(requests.map(req => {
        const quarter = Math.floor(req.requestDate.getMonth() / 3) + 1
        return `Q${quarter} ${req.requestDate.getFullYear()}`
      }))
      
      expect(quarters.size).toBeGreaterThan(1)
    })
  })

  describe('generateCustomerSurveys', () => {
    it('should generate realistic CSAT scores', () => {
      const surveys = MockDataGenerator.generateCustomerSurveys('partner-1', 123)
      
      surveys.forEach(survey => {
        expect(survey.score).toBeGreaterThanOrEqual(2.0)
        expect(survey.score).toBeLessThanOrEqual(5.0)
        expect(survey.partnerId).toBe('partner-1')
        expect(survey.surveyDate).toBeInstanceOf(Date)
      })
    })

    it('should have realistic score distribution (weighted toward higher scores)', () => {
      const surveys = MockDataGenerator.generateCustomerSurveys('partner-1', 123)
      
      if (surveys.length > 0) {
        const averageScore = surveys.reduce((sum, s) => sum + s.score, 0) / surveys.length
        
        // Should trend toward positive scores (> 3.5)
        expect(averageScore).toBeGreaterThan(3.0)
      }
    })
  })

  describe('generateSupportTickets', () => {
    it('should generate tickets with realistic escalation rates', () => {
      const tickets = MockDataGenerator.generateSupportTickets('partner-1', 123)
      
      const escalatedCount = tickets.filter(t => t.isEscalated).length
      const escalationRate = escalatedCount / tickets.length
      
      // Escalation rate should be reasonable (typically 10-20%)
      expect(escalationRate).toBeLessThan(0.3) // Less than 30%
    })

    it('should have logical first call resolution vs escalation relationship', () => {
      const tickets = MockDataGenerator.generateSupportTickets('partner-1', 123)
      
      tickets.forEach(ticket => {
        // Escalated tickets should not have first call resolution
        if (ticket.isEscalated) {
          expect(ticket.firstCallResolution).toBe(false)
        }
      })
    })

    it('should have older tickets more likely to be closed', () => {
      const tickets = MockDataGenerator.generateSupportTickets('partner-1', 123)
      const now = new Date()
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const oldTickets = tickets.filter(t => t.createdDate < oneMonthAgo)
      const recentTickets = tickets.filter(t => t.createdDate >= oneMonthAgo)
      
      if (oldTickets.length > 0 && recentTickets.length > 0) {
        const oldClosedRate = oldTickets.filter(t => t.closedDate !== null).length / oldTickets.length
        const recentClosedRate = recentTickets.filter(t => t.closedDate !== null).length / recentTickets.length
        
        expect(oldClosedRate).toBeGreaterThanOrEqual(recentClosedRate)
      }
    })
  })

  describe('generateImplementations', () => {
    it('should generate implementations with logical start and go-live dates', () => {
      const implementations = MockDataGenerator.generateImplementations('partner-1', 123)
      
      implementations.forEach(impl => {
        expect(impl.startDate).toBeInstanceOf(Date)
        expect(impl.partnerId).toBe('partner-1')
        
        if (impl.goLiveDate) {
          expect(impl.goLiveDate.getTime()).toBeGreaterThan(impl.startDate.getTime())
          
          // Implementation time should be reasonable (30-90 days typically)
          const implementationDays = Math.floor(
            (impl.goLiveDate.getTime() - impl.startDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          expect(implementationDays).toBeGreaterThan(20) // At least 20 days
          expect(implementationDays).toBeLessThan(120) // Less than 4 months
        }
      })
    })

    it('should have higher completion rates for older implementations', () => {
      const implementations = MockDataGenerator.generateImplementations('partner-1', 123)
      const now = new Date()
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      
      const oldImplementations = implementations.filter(impl => impl.startDate < twoMonthsAgo)
      const completedOld = oldImplementations.filter(impl => impl.goLiveDate !== null).length
      
      // Most implementations older than 2 months should be completed
      if (oldImplementations.length > 0) {
        const completionRate = completedOld / oldImplementations.length
        expect(completionRate).toBeGreaterThan(0.7) // At least 70% completion rate for old implementations
      }
    })
  })

  describe('generateCompleteSourceData', () => {
    it('should generate all data categories', () => {
      const sourceData = MockDataGenerator.generateCompleteSourceData('partner-1', 123)
      
      expect(sourceData.opportunities.length).toBeGreaterThan(0)
      expect(sourceData.dealRegistrations.length).toBeGreaterThan(0)
      expect(sourceData.trainingRecords.length).toBeGreaterThan(0)
      expect(sourceData.portalActivity.length).toBeGreaterThan(0)
      expect(sourceData.certifications.length).toBeGreaterThan(0)
      expect(sourceData.mdfRequests.length).toBeGreaterThan(0)
      expect(sourceData.customerSurveys.length).toBeGreaterThan(0)
      expect(sourceData.supportTickets.length).toBeGreaterThan(0)
      expect(sourceData.implementations.length).toBeGreaterThan(0)
    })

    it('should generate consistent data for same partner and seed', () => {
      const data1 = MockDataGenerator.generateCompleteSourceData('partner-1', 123)
      const data2 = MockDataGenerator.generateCompleteSourceData('partner-1', 123)
      
      // Check that data structure and counts are consistent
      expect(data1.opportunities.length).toBe(data2.opportunities.length)
      expect(data1.dealRegistrations.length).toBe(data2.dealRegistrations.length)
      expect(data1.trainingRecords.length).toBe(data2.trainingRecords.length)
    })

    it('should generate different data for different partners', () => {
      const data1 = MockDataGenerator.generateCompleteSourceData('partner-1', 123)
      const data2 = MockDataGenerator.generateCompleteSourceData('partner-2', 123)
      
      expect(data1).not.toEqual(data2)
    })

    it('should have all data properly attributed to the partner', () => {
      const sourceData = MockDataGenerator.generateCompleteSourceData('partner-3', 123)
      
      sourceData.opportunities.forEach(opp => expect(opp.partnerId).toBe('partner-3'))
      sourceData.dealRegistrations.forEach(reg => expect(reg.partnerId).toBe('partner-3'))
      sourceData.trainingRecords.forEach(training => expect(training.partnerId).toBe('partner-3'))
      sourceData.portalActivity.forEach(activity => expect(activity.partnerId).toBe('partner-3'))
      sourceData.certifications.forEach(cert => expect(cert.partnerId).toBe('partner-3'))
      sourceData.mdfRequests.forEach(request => expect(request.partnerId).toBe('partner-3'))
      sourceData.customerSurveys.forEach(survey => expect(survey.partnerId).toBe('partner-3'))
      sourceData.supportTickets.forEach(ticket => expect(ticket.partnerId).toBe('partner-3'))
      sourceData.implementations.forEach(impl => expect(impl.partnerId).toBe('partner-3'))
    })
  })

  describe('seededRandom', () => {
    it('should generate consistent values for same seed', () => {
      const value1 = (MockDataGenerator as any).seededRandom(123, 0, 100)
      const value2 = (MockDataGenerator as any).seededRandom(123, 0, 100)
      
      expect(value1).toBe(value2)
    })

    it('should generate different values for different seeds', () => {
      const value1 = (MockDataGenerator as any).seededRandom(123, 0, 100)
      const value2 = (MockDataGenerator as any).seededRandom(456, 0, 100)
      
      expect(value1).not.toBe(value2)
    })

    it('should respect min and max bounds', () => {
      for (let i = 0; i < 100; i++) {
        const value = (MockDataGenerator as any).seededRandom(i, 10, 20)
        expect(value).toBeGreaterThanOrEqual(10)
        expect(value).toBeLessThan(20)
      }
    })

    it('should generate values within range for edge cases', () => {
      const value1 = (MockDataGenerator as any).seededRandom(123, 0, 1)
      const value2 = (MockDataGenerator as any).seededRandom(456, -100, 100)
      
      expect(value1).toBeGreaterThanOrEqual(0)
      expect(value1).toBeLessThan(1)
      expect(value2).toBeGreaterThanOrEqual(-100)
      expect(value2).toBeLessThan(100)
    })
  })
})