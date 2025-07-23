import type { SourceData } from './db/metric-calculations'

// Mock source data generators for realistic testing and demo purposes
export class MockDataGenerator {
  
  // Generate deterministic random numbers based on seed
  private static seededRandom(seed: number, min: number = 0, max: number = 1): number {
    const x = Math.sin(seed) * 10000
    const random = x - Math.floor(x)
    return min + (random * (max - min))
  }
  
  // Generate mock opportunities data
  static generateOpportunities(partnerId: string, seed: number = 1): SourceData['opportunities'] {
    const opportunities: SourceData['opportunities'] = []
    // More realistic deal sizes based on partner tier
    const baseAmount = partnerId.includes('1') ? 75000 : partnerId.includes('2') ? 50000 : 25000
    
    // Fixed base date for consistency - ensure UTC
    const baseDate = new Date('2024-12-01T00:00:00.000Z')
    
    // Generate historical opportunities (last 12 months, more realistic volume)
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const monthSeed = seed + monthOffset * 100
      const dealsInMonth = Math.floor(this.seededRandom(monthSeed, 1, 4)) // 1-3 deals per month max
      
      for (let dealIndex = 0; dealIndex < dealsInMonth; dealIndex++) {
        const dealSeed = monthSeed + dealIndex * 10
        const closeDate = new Date(baseDate)
        closeDate.setMonth(closeDate.getMonth() - monthOffset)
        closeDate.setDate(Math.floor(this.seededRandom(dealSeed + 1, 1, 28)))
        
        const createdDate = new Date(closeDate)
        createdDate.setDate(createdDate.getDate() - Math.floor(this.seededRandom(dealSeed + 2, 30, 120)))
        
        const amount = Math.floor(this.seededRandom(dealSeed + 3, baseAmount * 0.7, baseAmount * 1.3)) // 30% variance
        const isWon = this.seededRandom(dealSeed + 4) > 0.65 // 35% win rate (more realistic)
        const isClosed = monthOffset < 2 ? this.seededRandom(dealSeed + 5) > 0.2 : true // Recent deals might still be open
        
        const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
        let stage: string
        if (isClosed) {
          stage = isWon ? 'Closed Won' : 'Closed Lost'
        } else {
          stage = stages[Math.floor(this.seededRandom(dealSeed + 6, 0, 4))]
        }
        
        opportunities.push({
          id: `opp-${partnerId}-${monthOffset}-${dealIndex}`,
          partnerId,
          amount,
          stage,
          closeDate,
          createdDate,
          isClosed,
          isWon: isClosed ? isWon : false
        })
      }
    }
    
    // Generate realistic current open pipeline (target 120-250% coverage)
    // Realistic quarterly revenue targets based on historical performance
    const targetQuarterlyRevenue = baseAmount * 3 // 3 deals per quarter target
    const targetCoverage = 1.5 + this.seededRandom(seed + 1000) * 0.8 // 150-230% coverage
    const targetPipelineValue = targetQuarterlyRevenue * targetCoverage
    
    const openDeals = Math.floor(this.seededRandom(seed + 1001, 4, 8)) // 4-7 deals
    const avgDealSize = targetPipelineValue / openDeals
    
    for (let i = 0; i < openDeals; i++) {
      const dealSeed = seed + 2000 + i * 10
      const createdDate = new Date()
      createdDate.setDate(createdDate.getDate() - Math.floor(this.seededRandom(dealSeed, 1, 90)))
      
      const closeDate = new Date()
      closeDate.setDate(closeDate.getDate() + Math.floor(this.seededRandom(dealSeed + 1, 15, 120)))
      
      const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation']
      const stage = stages[Math.floor(this.seededRandom(dealSeed + 2, 0, stages.length))]
      
      // Vary deal sizes around the average (50% to 150% of average)
      const dealVariance = 0.5 + this.seededRandom(dealSeed + 3) * 1.0
      const dealAmount = Math.floor(avgDealSize * dealVariance)
      
      opportunities.push({
        id: `opp-${partnerId}-open-${i}`,
        partnerId,
        amount: dealAmount,
        stage,
        closeDate,
        createdDate,
        isClosed: false,
        isWon: false
      })
    }
    
    return opportunities
  }
  
  // Generate mock deal registrations
  static generateDealRegistrations(partnerId: string, seed: number = 1): SourceData['dealRegistrations'] {
    const registrations: SourceData['dealRegistrations'] = []
    // Define baseAmount for deal registrations
    const baseAmount = partnerId.includes('1') ? 75000 : partnerId.includes('2') ? 50000 : 25000
    
    // Generate registrations for last 12 months
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const monthSeed = seed + monthOffset * 50
      const regsInMonth = Math.floor(this.seededRandom(monthSeed, 1, 4))
      
      for (let regIndex = 0; regIndex < regsInMonth; regIndex++) {
        const regSeed = monthSeed + regIndex * 5
        const submittedDate = new Date()
        submittedDate.setMonth(submittedDate.getMonth() - monthOffset)
        submittedDate.setDate(Math.floor(this.seededRandom(regSeed, 1, 28)))
        
        const statusRandom = this.seededRandom(regSeed + 1)
        let status: 'submitted' | 'approved' | 'rejected' | 'won' | 'lost'
        
        if (statusRandom < 0.1) status = 'rejected'
        else if (statusRandom < 0.3) status = 'submitted'
        else if (statusRandom < 0.5) status = 'approved'
        else if (statusRandom < 0.75) status = 'won'
        else status = 'lost'
        
        registrations.push({
          id: `reg-${partnerId}-${monthOffset}-${regIndex}`,
          partnerId,
          status,
          submittedDate,
          amount: Math.floor(this.seededRandom(regSeed + 2, baseAmount * 0.8, baseAmount * 1.2)) // More realistic, tied to partner tier
        })
      }
    }
    
    return registrations
  }
  
  // Generate mock training records
  static generateTrainingRecords(partnerId: string, seed: number = 1): SourceData['trainingRecords'] {
    const trainings: SourceData['trainingRecords'] = []
    const courses = [
      { name: 'Product Fundamentals', required: true },
      { name: 'Sales Methodology', required: true },
      { name: 'Technical Deep Dive', required: true },
      { name: 'Advanced Configuration', required: false },
      { name: 'Customer Success Best Practices', required: true },
      { name: 'Competitive Positioning', required: false }
    ]
    
    courses.forEach((course, courseIndex) => {
      const courseSeed = seed + courseIndex * 20
      const isCompleted = this.seededRandom(courseSeed) > (course.required ? 0.2 : 0.4) // Higher completion for required
      
      if (isCompleted) {
        const completedDate = new Date()
        completedDate.setDate(completedDate.getDate() - Math.floor(this.seededRandom(courseSeed + 1, 1, 365)))
        
        trainings.push({
          partnerId,
          completedDate,
          courseName: course.name,
          required: course.required
        })
      } else if (course.required) {
        // Add assigned but not completed required training
        trainings.push({
          partnerId,
          completedDate: null as any, // Not completed
          courseName: course.name,
          required: course.required
        })
      }
    })
    
    return trainings
  }
  
  // Generate mock portal activity
  static generatePortalActivity(partnerId: string, seed: number = 1): SourceData['portalActivity'] {
    const activities: SourceData['portalActivity'] = []
    
    // Generate login activity for last 60 days
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const daySeed = seed + dayOffset * 3
      const hasActivity = this.seededRandom(daySeed) > 0.7 // 30% chance of activity per day
      
      if (hasActivity) {
        const loginDate = new Date()
        loginDate.setDate(loginDate.getDate() - dayOffset)
        loginDate.setHours(Math.floor(this.seededRandom(daySeed + 1, 8, 18))) // Business hours
        
        const activityTypes = ['login', 'download', 'training_access', 'deal_submission']
        const numActivities = Math.floor(this.seededRandom(daySeed + 2, 1, 4))
        
        for (let actIndex = 0; actIndex < numActivities; actIndex++) {
          const actSeed = daySeed + actIndex
          const activityType = activityTypes[Math.floor(this.seededRandom(actSeed, 0, activityTypes.length))]
          
          activities.push({
            partnerId,
            activityType,
            activityDate: new Date(loginDate.getTime() + actIndex * 1000 * 60 * 15) // 15 min apart
          })
        }
      }
    }
    
    return activities
  }
  
  // Generate mock certifications
  static generateCertifications(partnerId: string, seed: number = 1): SourceData['certifications'] {
    const certifications: SourceData['certifications'] = []
    const certTypes = [
      'Product Specialist',
      'Technical Expert',
      'Sales Professional',
      'Implementation Specialist',
      'Advanced Solutions Architect'
    ]
    
    certTypes.forEach((certName, certIndex) => {
      const certSeed = seed + certIndex * 15
      const hasCert = this.seededRandom(certSeed) > 0.4 // 60% chance of having cert
      
      if (hasCert) {
        const issueDate = new Date()
        issueDate.setMonth(issueDate.getMonth() - Math.floor(this.seededRandom(certSeed + 1, 1, 24)))
        
        const expiryDate = new Date(issueDate)
        expiryDate.setMonth(expiryDate.getMonth() + 24) // 2 year validity
        
        const isActive = expiryDate > new Date()
        
        certifications.push({
          partnerId,
          certificationName: certName,
          issueDate,
          expiryDate,
          isActive
        })
      }
    })
    
    return certifications
  }
  
  // Generate mock MDF requests
  static generateMDFRequests(partnerId: string, seed: number = 1): SourceData['mdfRequests'] {
    const requests: SourceData['mdfRequests'] = []
    
    // Generate requests for last 4 quarters
    for (let quarterOffset = 0; quarterOffset < 4; quarterOffset++) {
      const quarterSeed = seed + quarterOffset * 25
      const requestsInQuarter = Math.floor(this.seededRandom(quarterSeed, 1, 3))
      
      for (let reqIndex = 0; reqIndex < requestsInQuarter; reqIndex++) {
        const reqSeed = quarterSeed + reqIndex * 5
        const requestDate = new Date()
        requestDate.setMonth(requestDate.getMonth() - (quarterOffset * 3))
        requestDate.setDate(Math.floor(this.seededRandom(reqSeed, 1, 28)))
        
        const requestedAmount = Math.floor(this.seededRandom(reqSeed + 1, 5000, 25000))
        const statusRandom = this.seededRandom(reqSeed + 2)
        
        let status: 'submitted' | 'approved' | 'rejected' | 'completed'
        let approvedAmount = 0
        
        if (statusRandom < 0.1) {
          status = 'rejected'
        } else if (statusRandom < 0.2) {
          status = 'submitted'
          approvedAmount = 0
        } else if (statusRandom < 0.4) {
          status = 'approved'
          approvedAmount = Math.floor(requestedAmount * this.seededRandom(reqSeed + 3, 0.7, 1.0))
        } else {
          status = 'completed'
          approvedAmount = Math.floor(requestedAmount * this.seededRandom(reqSeed + 3, 0.7, 1.0))
        }
        
        requests.push({
          partnerId,
          requestedAmount,
          approvedAmount,
          status,
          requestDate
        })
      }
    }
    
    return requests
  }
  
  // Generate mock customer surveys
  static generateCustomerSurveys(partnerId: string, seed: number = 1): SourceData['customerSurveys'] {
    const surveys: SourceData['customerSurveys'] = []
    
    // Generate surveys for last 12 months
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const monthSeed = seed + monthOffset * 8
      const surveysInMonth = Math.floor(this.seededRandom(monthSeed, 0, 3))
      
      for (let surveyIndex = 0; surveyIndex < surveysInMonth; surveyIndex++) {
        const surveySeed = monthSeed + surveyIndex * 3
        const surveyDate = new Date()
        surveyDate.setMonth(surveyDate.getMonth() - monthOffset)
        surveyDate.setDate(Math.floor(this.seededRandom(surveySeed, 1, 28)))
        
        // Generate realistic CSAT distribution (tend toward higher scores)
        const scoreRandom = this.seededRandom(surveySeed + 1)
        let score: number
        if (scoreRandom < 0.1) score = 2.0 + this.seededRandom(surveySeed + 2, 0, 1) // 2.0-3.0
        else if (scoreRandom < 0.3) score = 3.0 + this.seededRandom(surveySeed + 2, 0, 1) // 3.0-4.0
        else score = 4.0 + this.seededRandom(surveySeed + 2, 0, 1) // 4.0-5.0
        
        surveys.push({
          partnerId,
          score: Math.round(score * 10) / 10, // Round to 1 decimal
          surveyDate
        })
      }
    }
    
    return surveys
  }
  
  // Generate mock support tickets
  static generateSupportTickets(partnerId: string, seed: number = 1): SourceData['supportTickets'] {
    const tickets: SourceData['supportTickets'] = []
    
    // Generate tickets for last 12 months
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const monthSeed = seed + monthOffset * 12
      const ticketsInMonth = Math.floor(this.seededRandom(monthSeed, 1, 8))
      
      for (let ticketIndex = 0; ticketIndex < ticketsInMonth; ticketIndex++) {
        const ticketSeed = monthSeed + ticketIndex * 4
        const createdDate = new Date()
        createdDate.setMonth(createdDate.getMonth() - monthOffset)
        createdDate.setDate(Math.floor(this.seededRandom(ticketSeed, 1, 28)))
        
        const isEscalated = this.seededRandom(ticketSeed + 1) < 0.15 // 15% escalation rate
        const firstCallResolution = this.seededRandom(ticketSeed + 2) > 0.3 // 70% FCR rate
        
        let closedDate: Date | null = null
        if (monthOffset > 0) { // Older tickets are likely closed
          closedDate = new Date(createdDate)
          closedDate.setHours(createdDate.getHours() + Math.floor(this.seededRandom(ticketSeed + 3, 2, 72)))
        }
        
        tickets.push({
          partnerId,
          createdDate,
          closedDate,
          isEscalated,
          firstCallResolution: !isEscalated && firstCallResolution
        })
      }
    }
    
    return tickets
  }
  
  // Generate mock implementations
  static generateImplementations(partnerId: string, seed: number = 1): SourceData['implementations'] {
    const implementations: SourceData['implementations'] = []
    
    // Generate implementations for last 18 months
    for (let monthOffset = 0; monthOffset < 18; monthOffset++) {
      const monthSeed = seed + monthOffset * 20
      const hasImplementation = this.seededRandom(monthSeed) > 0.7 // 30% chance per month
      
      if (hasImplementation) {
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - monthOffset)
        startDate.setDate(Math.floor(this.seededRandom(monthSeed + 1, 1, 28)))
        
        let goLiveDate: Date | null = null
        if (monthOffset > 2) { // Implementations older than 2 months are likely complete
          goLiveDate = new Date(startDate)
          goLiveDate.setDate(startDate.getDate() + Math.floor(this.seededRandom(monthSeed + 2, 30, 90)))
        }
        
        implementations.push({
          partnerId,
          startDate,
          goLiveDate
        })
      }
    }
    
    return implementations
  }
  
  // Generate complete source data set for a partner
  static generateCompleteSourceData(partnerId: string, seed: number = 123): SourceData {
    try {
      const partnerSeed = seed + parseInt(partnerId.replace(/\D/g, '')) * 1000
      
      console.log(`Generating source data for ${partnerId} with seed ${partnerSeed}`)
      
      return {
        opportunities: this.generateOpportunities(partnerId, partnerSeed + 100),
        dealRegistrations: this.generateDealRegistrations(partnerId, partnerSeed + 200),
        trainingRecords: this.generateTrainingRecords(partnerId, partnerSeed + 300),
        portalActivity: this.generatePortalActivity(partnerId, partnerSeed + 400),
        certifications: this.generateCertifications(partnerId, partnerSeed + 500),
        mdfRequests: this.generateMDFRequests(partnerId, partnerSeed + 600),
        customerSurveys: this.generateCustomerSurveys(partnerId, partnerSeed + 700),
        supportTickets: this.generateSupportTickets(partnerId, partnerSeed + 800),
        implementations: this.generateImplementations(partnerId, partnerSeed + 900)
      }
    } catch (error) {
      console.error(`Error generating source data for ${partnerId}:`, error)
      throw new Error(`Failed to generate mock data: ${error.message}`)
    }
  }
}