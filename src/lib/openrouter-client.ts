import OpenAI from 'openai'
import { Partner, PartnerMetrics } from './dummy-data'
import { PartnerInvestmentCalculator } from './investment-calculator'

export class OpenRouterClient {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'QBR Navigator'
      }
    })
  }

  async generateQBRInsights(partner: Partner, metrics: PartnerMetrics, allPartnerMetrics?: PartnerMetrics[], allPartners?: Partner[]): Promise<string> {
    const prompt = this.buildQBRPrompt(partner, metrics, allPartnerMetrics, allPartners)
    
    console.log('OpenRouter API Key present:', !!process.env.OPENROUTER_API_KEY)
    console.log('Making OpenRouter API call...')
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'anthropic/claude-3-sonnet-20240229',
        messages: [
          {
            role: 'system',
            content: `You are a Strategic Partnership Investment Analyst for Executive Management.
            
            Your role is to analyze partner performance data and create data-driven investment recommendations that maximize ROI and minimize churn risk.
            
            CRITICAL INSTRUCTION: You MUST correctly interpret revenue growth numbers.
            - NEGATIVE numbers (-20.5%) = DECLINING/POOR performance 
            - POSITIVE numbers (+20.5%) = GROWING/STRONG performance
            - NEVER describe negative growth as "strong" - this is factually incorrect
            
            INVESTMENT ANALYSIS FRAMEWORK:
            - Identify specific performance gaps and their revenue impact
            - Calculate realistic investment amounts based on partner tier and ROI benchmarks
            - Prioritize investments by ROI potential and risk mitigation
            - Create partner-specific intervention strategies, not generic templates
            
            OUTPUT FORMAT - AI INSIGHTS BLOCK ONLY:
            
            ## Executive Summary
            [2-3 sentences: Health, Growth, Strategic Direction - CRITICAL: Check the revenue growth number first. If it's NEGATIVE (has a minus sign), you MUST describe it as "declining revenue" or "revenue contraction" - NEVER as "strong growth" or "demonstrates growth". If POSITIVE, then use "strong growth" language.]
            
            ## Key Insights
            | Category | Metric/Statement |
            |----------|------------------|
            [Structured table with concrete numbers and business relevance]
            
            ## Strategic Priorities (Q1 2025)
            🔴 [Urgent Priority] (Owner: [Role]) → Target: [Measurable Goal]
            🟡 [Important Priority] (Owner: [Role]) → Target: [Measurable Goal]  
            🟢 [Opportunity Priority] (Owner: [Role]) → Target: [Measurable Goal]
            [Always include exactly 3 priorities. Use 🔴 for urgent issues, 🟡 for improvements, 🟢 for growth]
            
            ## Business Impact Forecast
            | Investment Strategy | Potential ARR | Risk ARR | Investment | Expected ROI |
            |---------------------|---------------|----------|------------|--------------|
            [Create 2-4 partner-specific investment strategies based on actual performance gaps. Calculate realistic dollar amounts using partner tier, current ARR, and industry benchmarks]
            
            ## Next Actions
            | Action | Owner | Due |
            |--------|-------|-----|
            [3 specific actions with realistic owners and dates]
            
            CALCULATION GUIDELINES:
            - Strategic Partners: $15-50k investments, 3-5x ROI expected
            - Select Partners: $8-25k investments, 2.5-4x ROI expected  
            - Registered Partners: $3-15k investments, 2-3x ROI expected
            - Risk ARR = Current ARR × (Gap Impact %) × (Churn Probability %)
            - Potential ARR = Investment × Expected ROI Multiplier
            
            CRITICAL: INTERPRET METRICS CORRECTLY - NO EXCEPTIONS
            - NEGATIVE revenue growth % = DECLINING/POOR performance (NEVER call negative growth "strong" or "good")
            - POSITIVE revenue growth % = GROWING/STRONG performance
            - Health scores below 70 = HIGH RISK, below 85 = NEEDS ATTENTION
            - Pipeline conversion below 25% = POOR performance
            - Training completion below 80% = SIGNIFICANT GAP
            
            EXAMPLES OF CORRECT INTERPRETATION:
            - "-14.7% growth" → "declining revenue of -14.7% QoQ requires immediate attention"
            - "+14.7% growth" → "strong revenue growth of +14.7% QoQ demonstrates solid performance"
            - "83/100 health score" → "health score of 83/100 indicates room for improvement"
            
            FORBIDDEN PHRASES for negative metrics:
            - "strong revenue growth of -X%" (NEVER SAY THIS)
            - "demonstrates growth of -X%" (INCORRECT)
            - "outperforming" when metrics are negative (WRONG)
            
            NEXT ACTIONS REQUIREMENTS - CRITICAL:
            - MANDATORY: Provide exactly 3 concrete, actionable next steps
            - FORBIDDEN: Empty actions, dashes "--------", placeholders, or generic text
            - REQUIRED: Specific owners (Partner Manager, Account Manager, Partner Team, Channel Training)
            - REQUIRED: Priority levels (High/Medium/Low) based on urgency
            - EXAMPLES:
              | Implement pipeline conversion coaching program | Partner Manager | High |
              | Complete outstanding required training modules | Partner Team | Medium |
              | Schedule quarterly strategic business review | Account Manager | Low |
            
            STYLE: Executive language, PPT-ready, data-driven, solution-oriented, ACCURATE metric interpretation`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.6
      })

      console.log('OpenRouter API call successful!')
      const rawContent = response.choices[0]?.message?.content || 'No insights generated'
      
      // Post-process to fix negative growth misinterpretations
      return this.fixNegativeGrowthDescriptions(rawContent, metrics)
    } catch (error) {
      console.error('OpenRouter API Error:', error)
      console.log('Falling back to local insights...')
      const fallbackContent = this.generateFallbackInsights(partner, metrics)
      return this.fixNegativeGrowthDescriptions(fallbackContent, metrics)
    }
  }

  private buildQBRPrompt(partner: Partner, metrics: PartnerMetrics, allPartnerMetrics?: PartnerMetrics[], allPartners?: Partner[]): string {
    // Calculate both tier-specific and ecosystem-wide benchmarks
    let benchmarksSection = ''
    if (allPartnerMetrics && allPartnerMetrics.length > 0) {
      // Filter for same tier partners using actual partner data
      const tierPartners = allPartnerMetrics.filter(m => {
        if (allPartners) {
          // Use actual partner tier data
          const partnerData = allPartners.find(p => p.id === m.partnerId)
          return partnerData?.tier === partner.tier
        } else {
          // Fallback: estimate based on revenue ranges
          const revenue = m.revenue.current
          const partnerTier = revenue > 400000 ? 'Strategic' : revenue > 200000 ? 'Select' : 'Registered'
          return partnerTier === partner.tier
        }
      }).filter(m => m.partnerId !== metrics.partnerId) // Exclude current partner
      
      // Calculate ecosystem averages
      const ecoAvgGrowth = allPartnerMetrics.reduce((sum, m) => sum + m.revenue.growth, 0) / allPartnerMetrics.length
      const ecoAvgHealth = allPartnerMetrics.reduce((sum, m) => sum + m.healthScore, 0) / allPartnerMetrics.length
      const ecoAvgConversion = allPartnerMetrics.reduce((sum, m) => sum + m.pipeline.conversion, 0) / allPartnerMetrics.length
      const ecoAvgTraining = allPartnerMetrics.reduce((sum, m) => sum + m.engagement.trainingCompletionRate, 0) / allPartnerMetrics.length
      const ecoAvgWinRate = allPartnerMetrics.reduce((sum, m) => sum + m.dealRegistration.winRate, 0) / allPartnerMetrics.length
      const ecoAvgCSAT = allPartnerMetrics.reduce((sum, m) => sum + m.delivery.customerSatisfaction, 0) / allPartnerMetrics.length
      
      // Calculate tier-specific averages if we have enough data
      let tierBenchmarks = ''
      if (tierPartners.length >= 2) {
        const tierAvgGrowth = tierPartners.reduce((sum, m) => sum + m.revenue.growth, 0) / tierPartners.length
        const tierAvgHealth = tierPartners.reduce((sum, m) => sum + m.healthScore, 0) / tierPartners.length
        const tierAvgConversion = tierPartners.reduce((sum, m) => sum + m.pipeline.conversion, 0) / tierPartners.length
        const tierAvgTraining = tierPartners.reduce((sum, m) => sum + m.engagement.trainingCompletionRate, 0) / tierPartners.length
        const tierAvgWinRate = tierPartners.reduce((sum, m) => sum + m.dealRegistration.winRate, 0) / tierPartners.length
        const tierAvgCSAT = tierPartners.reduce((sum, m) => sum + m.delivery.customerSatisfaction, 0) / tierPartners.length
        
        tierBenchmarks = `
**${partner.tier} Tier Benchmarks (${tierPartners.length} Partners):**
- Tier Revenue Growth: ${tierAvgGrowth.toFixed(1)}% QoQ vs ${metrics.revenue.growth.toFixed(1)}% ${metrics.revenue.growth > tierAvgGrowth ? '(ABOVE tier average)' : '(BELOW tier average)'} ${metrics.revenue.growth < 0 ? '⚠️ DECLINING' : ''}
- Tier Health Score: ${tierAvgHealth.toFixed(1)}/100 vs ${metrics.healthScore}/100 (${metrics.healthScore > tierAvgHealth ? 'Above' : 'Below'} tier average)
- Tier Pipeline Conversion: ${tierAvgConversion.toFixed(1)}% vs ${metrics.pipeline.conversion}% (${metrics.pipeline.conversion > tierAvgConversion ? 'Above' : 'Below'} tier average)
- Tier Training Completion: ${tierAvgTraining.toFixed(1)}% vs ${metrics.engagement.trainingCompletionRate}% (${metrics.engagement.trainingCompletionRate > tierAvgTraining ? 'Above' : 'Below'} tier average)
- Tier Deal Win Rate: ${tierAvgWinRate.toFixed(1)}% vs ${metrics.dealRegistration.winRate}% (${metrics.dealRegistration.winRate > tierAvgWinRate ? 'Above' : 'Below'} tier average)
- Tier CSAT: ${tierAvgCSAT.toFixed(1)}/5 vs ${metrics.delivery.customerSatisfaction}/5 (${metrics.delivery.customerSatisfaction > tierAvgCSAT ? 'Above' : 'Below'} tier average)

**Tier Performance Ranking:**
- Revenue Growth: ${this.calculatePercentile(metrics.revenue.growth, tierPartners.map(m => m.revenue.growth))}th percentile within ${partner.tier} tier
- Health Score: ${this.calculatePercentile(metrics.healthScore, tierPartners.map(m => m.healthScore))}th percentile within ${partner.tier} tier
- Pipeline Conversion: ${this.calculatePercentile(metrics.pipeline.conversion, tierPartners.map(m => m.pipeline.conversion))}th percentile within ${partner.tier} tier
        `
      }
      
      benchmarksSection = `
**Ecosystem Benchmarks (${allPartnerMetrics.length} Total Partners):**
- Ecosystem Revenue Growth: ${ecoAvgGrowth.toFixed(1)}% QoQ vs ${metrics.revenue.growth.toFixed(1)}% ${metrics.revenue.growth > ecoAvgGrowth ? '(ABOVE ecosystem average)' : '(BELOW ecosystem average)'} ${metrics.revenue.growth < 0 ? '⚠️ NEGATIVE GROWTH' : ''}
- Ecosystem Health Score: ${ecoAvgHealth.toFixed(1)}/100 vs ${metrics.healthScore}/100 (${metrics.healthScore > ecoAvgHealth ? 'Above' : 'Below'} ecosystem average)
- Ecosystem Pipeline Conversion: ${ecoAvgConversion.toFixed(1)}% vs ${metrics.pipeline.conversion}% (${metrics.pipeline.conversion > ecoAvgConversion ? 'Above' : 'Below'} ecosystem average)
- Ecosystem Training Completion: ${ecoAvgTraining.toFixed(1)}% vs ${metrics.engagement.trainingCompletionRate}% (${metrics.engagement.trainingCompletionRate > ecoAvgTraining ? 'Above' : 'Below'} ecosystem average)

**Ecosystem Performance Ranking:**
- Revenue Growth: ${this.calculatePercentile(metrics.revenue.growth, allPartnerMetrics.map(m => m.revenue.growth))}th percentile overall
- Health Score: ${this.calculatePercentile(metrics.healthScore, allPartnerMetrics.map(m => m.healthScore))}th percentile overall
- Pipeline Conversion: ${this.calculatePercentile(metrics.pipeline.conversion, allPartnerMetrics.map(m => m.pipeline.conversion))}th percentile overall

${tierBenchmarks}
      `
    }
    return `
Analyze ${partner.name} and create AI INSIGHTS BLOCK only:

**Partner Data:**
- Tier: ${partner.tier} | Region: ${partner.region} | Health Score: ${metrics.healthScore}/100
- Partner Manager: ${partner.partnerManager} | Account Manager: ${partner.accountManager}
- ARR: $${metrics.revenue.current.toLocaleString()} | Growth: ${metrics.revenue.growth}% QoQ ${metrics.revenue.growth >= 0 ? '(POSITIVE - Growing)' : '(NEGATIVE - Declining - POOR PERFORMANCE)'}
- Pipeline: $${metrics.pipeline.value.toLocaleString()} (${metrics.pipeline.count} Deals)
- Conversion Rate: ${metrics.pipeline.conversion}% ${metrics.pipeline.conversion >= 30 ? '(Above Average)' : metrics.pipeline.conversion >= 20 ? '(Average)' : '(Below Average)'}
- Training: ${metrics.engagement.trainingCompletionRate}% ${metrics.engagement.trainingCompletionRate >= 90 ? '(Excellent)' : metrics.engagement.trainingCompletionRate >= 80 ? '(Good)' : '(Needs Improvement)'}
- CSAT: ${metrics.delivery.customerSatisfaction}/5 ${metrics.delivery.customerSatisfaction >= 4.5 ? '(Excellent)' : metrics.delivery.customerSatisfaction >= 4.0 ? '(Good)' : '(At Risk)'}
- Deal Win Rate: ${metrics.dealRegistration.winRate}% | MDF Usage: ${metrics.engagement.marketingFundUtilization}%

**CRITICAL REMINDER FOR AI ANALYSIS:**
${metrics.revenue.growth < 0 ? 
`- REVENUE GROWTH IS NEGATIVE (${metrics.revenue.growth}%) - This is DECLINING/POOR performance
- DO NOT use words like "strong", "demonstrates growth", or "outperforming" 
- MUST describe as "declining revenue", "revenue contraction", or "poor performance"
- This partner needs URGENT intervention due to NEGATIVE growth` :
`- Revenue growth is POSITIVE (${metrics.revenue.growth}%) - This is good performance
- You may describe this as "strong growth" or "solid performance"`}

${benchmarksSection}

**Static Benchmarks:**
- Pipeline Coverage Target: 150%  
- Training Completion Target: 90%
- CSAT Target: 4.5/5
- Industry Win Rate: 25%

**Performance Gap Analysis for Investment Strategy:**
${this.buildPerformanceGapAnalysis(partner, metrics)}

**Industry Investment Benchmarks:**
- Strategic Partners: Typical investments $15-50k with 3-5x ROI targets
- Select Partners: Typical investments $8-25k with 2.5-4x ROI targets  
- Registered Partners: Typical investments $3-15k with 2-3x ROI targets
- Churn Prevention ROI: 5-7x (highest priority)
- Enablement ROI: 3-4x industry average
- Sales Coaching ROI: 2.5-3.5x industry average

Create output exactly in this structure:

## Executive Summary
[2-3 concise sentences about Health, Growth, Strategic Direction]

## Key Insights  
| Category | Metric/Statement |
|----------|------------------|
[4-6 rows with key findings - numbers and business relevance only]

## Strategic Priorities (Q1 2025)
🔴 [Priority Name] (Owner: [Specific Role]) → Target: [Measurable Goal]
🟡 [Priority Name] (Owner: [Specific Role]) → Target: [Measurable Goal]  
🟢 [Priority Name] (Owner: [Specific Role]) → Target: [Measurable Goal]
[REQUIRED: Always include exactly 3 priorities based on partner performance gaps. Use 🔴 for urgent health/CSAT issues, 🟡 for improvement areas like win rate/training, 🟢 for optimization/expansion opportunities. Do NOT use dashes - start directly with emoji]

## Business Impact Forecast
| Investment Strategy | Potential ARR | Risk ARR | Investment | Expected ROI |
|---------------------|---------------|----------|------------|--------------|
[Create 2-4 partner-specific investment strategies based on the performance gap analysis. Calculate realistic dollar amounts using partner tier and ROI benchmarks provided. Focus on the most impactful gaps identified.]

## Next Actions
| Action | Owner | Priority |
|--------|-------|----------|
[3 specific actions with realistic owners and priority levels (High/Medium/Low) based on partner metrics and priorities - no empty actions allowed]

IMPORTANT: Text only, no visual elements, executive language, PPT-ready. Use ecosystem benchmarks for comparative insights and provided investment data for Business Impact Forecast.
    `
  }

  private calculatePercentile(value: number, allValues: number[]): number {
    const sorted = allValues.sort((a, b) => a - b)
    const rank = sorted.filter(v => v <= value).length
    return Math.round((rank / sorted.length) * 100)
  }

  private buildPerformanceGapAnalysis(partner: Partner, metrics: PartnerMetrics): string {
    let analysis = ''
    
    // Revenue Performance Gap
    const revenueGap = metrics.revenue.growth < 10 ? 'Significant' : metrics.revenue.growth < 20 ? 'Moderate' : 'Minor'
    const revenueRisk = metrics.revenue.current * (metrics.revenue.growth < 0 ? 0.3 : metrics.revenue.growth < 10 ? 0.15 : 0.05)
    analysis += `• Revenue Growth Gap: ${revenueGap} (${metrics.revenue.growth}% vs 15% target) - Risk: $${Math.round(revenueRisk/1000)}k ARR\n`
    
    // Pipeline Performance Gap
    const pipelineGap = metrics.pipeline.coverage < 120 ? 'Critical' : metrics.pipeline.coverage < 150 ? 'Moderate' : 'Minor'
    const pipelineRisk = metrics.pipeline.value * 0.1
    analysis += `• Pipeline Coverage Gap: ${pipelineGap} (${metrics.pipeline.coverage}% vs 150% target) - Risk: $${Math.round(pipelineRisk/1000)}k pipeline\n`
    
    // Conversion Performance Gap
    const conversionGap = metrics.pipeline.conversion < 25 ? 'High' : metrics.pipeline.conversion < 35 ? 'Moderate' : 'Low'
    const conversionUpside = metrics.pipeline.value * (Math.max(0, 35 - metrics.pipeline.conversion) / 100)
    analysis += `• Conversion Rate Gap: ${conversionGap} (${metrics.pipeline.conversion}% vs 35% target) - Upside: $${Math.round(conversionUpside/1000)}k ARR\n`
    
    // Training Gap
    const trainingGap = metrics.engagement.trainingCompletionRate < 80 ? 'Critical' : metrics.engagement.trainingCompletionRate < 90 ? 'Moderate' : 'Minor'
    const dealSizeImpact = metrics.pipeline.avgDealSize * (Math.max(0, 90 - metrics.engagement.trainingCompletionRate) / 100)
    analysis += `• Training Completion Gap: ${trainingGap} (${metrics.engagement.trainingCompletionRate}% vs 90% target) - Deal Size Impact: -$${Math.round(dealSizeImpact/1000)}k avg\n`
    
    // Health Score Gap  
    const healthGap = metrics.healthScore < 70 ? 'Critical' : metrics.healthScore < 85 ? 'Moderate' : 'Minor'
    const churnRisk = metrics.revenue.current * ((100 - metrics.healthScore) / 100) * 0.4
    analysis += `• Health Score Gap: ${healthGap} (${metrics.healthScore}/100) - Churn Risk: $${Math.round(churnRisk/1000)}k ARR\n`
    
    // CSAT Gap
    const csatGap = metrics.delivery.customerSatisfaction < 4.0 ? 'High' : metrics.delivery.customerSatisfaction < 4.5 ? 'Moderate' : 'Low'
    const csatRisk = metrics.revenue.current * (Math.max(0, 4.5 - metrics.delivery.customerSatisfaction) / 4.5) * 0.25
    analysis += `• Customer Satisfaction Gap: ${csatGap} (${metrics.delivery.customerSatisfaction}/5 vs 4.5 target) - Risk: $${Math.round(csatRisk/1000)}k ARR\n`
    
    return analysis
  }

  private generateAIInvestmentStrategies(partner: Partner, metrics: PartnerMetrics): string {
    const strategies = []
    
    // Tier-based investment ranges
    const tierInvestment = {
      Strategic: { min: 15000, max: 50000, roiMin: 3, roiMax: 5 },
      Select: { min: 8000, max: 25000, roiMin: 2.5, roiMax: 4 },
      Registered: { min: 3000, max: 15000, roiMin: 2, roiMax: 3 }
    }[partner.tier] || { min: 5000, max: 20000, roiMin: 2, roiMax: 3.5 }
    
    // Strategy 1: Address biggest performance gap
    if (metrics.healthScore < 75) {
      const investment = Math.round(tierInvestment.min * 1.2)
      const riskARR = Math.round(metrics.revenue.current * 0.25)
      const potentialARR = Math.round(investment * 4.5)
      strategies.push(`| Health Recovery Program | $${Math.round(potentialARR/1000)}k | $${Math.round(riskARR/1000)}k | $${Math.round(investment/1000)}k | ${(potentialARR/investment).toFixed(1)}x |`)
    } else if (metrics.pipeline.conversion < 30) {
      const investment = Math.round(tierInvestment.min * 0.8)
      const riskARR = Math.round(metrics.pipeline.value * 0.15)
      const potentialARR = Math.round(investment * 3.2)
      strategies.push(`| Pipeline Conversion Optimization | $${Math.round(potentialARR/1000)}k | $${Math.round(riskARR/1000)}k | $${Math.round(investment/1000)}k | ${(potentialARR/investment).toFixed(1)}x |`)
    } else if (metrics.engagement.trainingCompletionRate < 85) {
      const investment = Math.round(tierInvestment.min * 0.9)
      const riskARR = Math.round(metrics.pipeline.avgDealSize * metrics.pipeline.count * 0.2)
      const potentialARR = Math.round(investment * 3.8)
      strategies.push(`| Advanced Enablement Program | $${Math.round(potentialARR/1000)}k | $${Math.round(riskARR/1000)}k | $${Math.round(investment/1000)}k | ${(potentialARR/investment).toFixed(1)}x |`)
    }
    
    // Strategy 2: Revenue growth acceleration
    if (metrics.revenue.growth < 15) {
      const investment = Math.round(tierInvestment.max * 0.6)
      const riskARR = Math.round(metrics.revenue.current * 0.1)
      const potentialARR = Math.round(investment * tierInvestment.roiMin)
      strategies.push(`| Revenue Growth Acceleration | $${Math.round(potentialARR/1000)}k | $${Math.round(riskARR/1000)}k | $${Math.round(investment/1000)}k | ${(potentialARR/investment).toFixed(1)}x |`)
    }
    
    // Strategy 3: Customer experience enhancement
    if (metrics.delivery.customerSatisfaction < 4.5) {
      const investment = Math.round(tierInvestment.min * 1.1)
      const riskARR = Math.round(metrics.revenue.current * 0.2)
      const potentialARR = Math.round(investment * 4.8)
      strategies.push(`| Customer Experience Enhancement | $${Math.round(potentialARR/1000)}k | $${Math.round(riskARR/1000)}k | $${Math.round(investment/1000)}k | ${(potentialARR/investment).toFixed(1)}x |`)
    }
    
    // Strategy 4: Market expansion (if performing well)
    if (metrics.healthScore > 80 && metrics.revenue.growth > 10) {
      const investment = Math.round(tierInvestment.max * 0.8)
      const riskARR = Math.round(metrics.revenue.current * 0.05)
      const potentialARR = Math.round(investment * 2.8)
      strategies.push(`| Market Expansion Initiative | $${Math.round(potentialARR/1000)}k | $${Math.round(riskARR/1000)}k | $${Math.round(investment/1000)}k | ${(potentialARR/investment).toFixed(1)}x |`)
    }
    
    return strategies.slice(0, 3).join('\n') || '| No specific investments recommended | - | - | - | - |'
  }

  // Post-process AI response to fix negative growth misinterpretations and clean up next actions
  private fixNegativeGrowthDescriptions(content: string, metrics: PartnerMetrics): string {
    const growthRate = metrics.revenue.growth
    
    // Only apply fixes if growth is actually negative
    if (growthRate >= 0) {
      return content
    }
    
    // Define problematic patterns and their corrections for negative growth
    const negativeGrowthFixes = [
      {
        // "strong revenue growth of -14.7%" -> "revenue decline of -14.7%"
        pattern: /strong\s+revenue\s+growth\s+of\s+(-?\d+\.?\d*)%/gi,
        replacement: 'revenue decline of $1%'
      },
      {
        // "demonstrates strong growth of -14.7%" -> "shows revenue decline of -14.7%"
        pattern: /demonstrates\s+strong\s+growth\s+of\s+(-?\d+\.?\d*)%/gi,
        replacement: 'shows revenue decline of $1%'
      },
      {
        // "demonstrates growth of -14.7%" -> "shows decline of -14.7%"
        pattern: /demonstrates\s+growth\s+of\s+(-?\d+\.?\d*)%/gi,
        replacement: 'shows decline of $1%'
      },
      {
        // "Strong growth of -14.7%" -> "Revenue decline of -14.7%"
        pattern: /Strong\s+growth\s+of\s+(-?\d+\.?\d*)%/gi,
        replacement: 'Revenue decline of $1%'
      },
      {
        // "revenue growth of -14.7%" -> "revenue decline of -14.7%"
        pattern: /revenue\s+growth\s+of\s+(-?\d+\.?\d*)%/gi,
        replacement: 'revenue decline of $1%'
      },
      {
        // "strong growth" when we know it's negative -> "declining performance"
        pattern: /strong\s+growth/gi,
        replacement: 'declining performance'
      },
      {
        // "solid growth" when we know it's negative -> "revenue contraction"
        pattern: /solid\s+growth/gi,
        replacement: 'revenue contraction'
      },
      {
        // "outperforming" when we know it's negative -> "underperforming"
        pattern: /outperforming/gi,
        replacement: 'underperforming'
      }
    ]
    
    let fixedContent = content
    
    // Apply all fixes
    negativeGrowthFixes.forEach(fix => {
      fixedContent = fixedContent.replace(fix.pattern, fix.replacement)
    })
    
    // Log if we made corrections
    if (fixedContent !== content) {
      console.log(`Post-processed AI response to fix negative growth descriptions for ${growthRate}% growth`)
    }
    
    // Clean up Next Actions section to remove empty or invalid entries
    fixedContent = this.cleanupNextActions(fixedContent, metrics)
    
    return fixedContent
  }

  // Clean up Next Actions section to remove empty entries and add proper ones
  private cleanupNextActions(content: string, metrics: PartnerMetrics): string {
    const nextActionsRegex = /## Next Actions\s*\n\s*\| Action \| Owner \| Priority \|\s*\n\s*\|[^|]+\|[^|]+\|[^|]+\|\s*\n((?:\|[^|]*\|[^|]*\|[^|]*\|\s*\n)*)/gi
    
    const match = nextActionsRegex.exec(content)
    if (!match) return content
    
    // Parse existing actions
    const actionsText = match[1]
    const actionLines = actionsText.split('\n').filter(line => line.trim() && line.includes('|'))
    
    // Filter out empty or invalid actions
    const validActions = actionLines.filter(line => {
      const parts = line.split('|').map(p => p.trim())
      return parts.length >= 4 && 
             parts[1] && 
             !parts[1].match(/^-+$/) && // Remove lines with just dashes
             parts[1] !== '' &&
             parts[1] !== 'Action'
    })
    
    // Generate default actions if we don't have enough valid ones
    const defaultActions = [
      `| ${metrics.healthScore < 75 ? 'Conduct partner health assessment and recovery plan' : metrics.pipeline.conversion < 30 ? 'Implement sales coaching program to improve conversion' : 'Schedule strategic business review meeting'} | Partner Manager | High |`,
      `| ${metrics.engagement.trainingCompletionRate < 90 ? 'Complete outstanding required training modules' : 'Pursue advanced product certifications'} | Partner Team | Medium |`,
      `| ${metrics.delivery.customerSatisfaction < 4.5 ? 'Launch customer satisfaction improvement initiative' : 'Implement customer advocacy and reference program'} | Account Manager | ${metrics.delivery.customerSatisfaction < 4.0 ? 'High' : 'Low'} |`
    ]
    
    // Use valid actions or fall back to defaults
    const finalActions = validActions.length >= 3 ? validActions.slice(0, 3) : defaultActions
    
    // Rebuild the Next Actions section
    const newNextActions = `## Next Actions

| Action | Owner | Priority |
|--------|-------|----------|
${finalActions.join('\n')}`

    // Replace the old section with the new one
    return content.replace(nextActionsRegex, newNextActions)
  }

  private generateFallbackInsights(partner: Partner, metrics: PartnerMetrics): string {
    // Use realistic investment calculations
    const recommendations = PartnerInvestmentCalculator.calculateRecommendedInvestments(partner, metrics)
    
    // Calculate values needed for fallback content
    const avgDealSize = metrics.pipeline.avgDealSize
    const pipelineUpside = Math.round(metrics.pipeline.value * 0.12)
    const churnRisk = Math.round(metrics.revenue.current * 0.15)
    
    return `
## Executive Summary

${partner.name} shows ${metrics.revenue.growth > 15 ? 'strong growth' : metrics.revenue.growth > 0 ? 'moderate growth' : 'declining revenue'} of ${metrics.revenue.growth}% QoQ with a Health Score of ${metrics.healthScore}/100. Pipeline Coverage of ${metrics.pipeline.coverage}% and ${metrics.engagement.trainingCompletionRate < 90 ? 'suboptimal enablement metrics require strategic adjustments to maximize revenue potential' : 'solid enablement foundation provides basis for accelerated expansion'}.

## Key Insights

| Category | Metric/Statement |
|----------|------------------|
| Pipeline Coverage | ${metrics.pipeline.coverage}% (Target: 150%) - ${metrics.pipeline.coverage > 200 ? 'Expansion-ready, can generate additional $' + Math.round(pipelineUpside/1000) + 'k ARR' : 'Under-utilization limits growth potential'} |
| Conversion Rate | ${metrics.pipeline.conversion}% at $${Math.round(avgDealSize/1000)}k Average Deal Size - ${metrics.pipeline.conversion < 30 ? 'Coaching needs identified' : 'Solid performance'} |
| Training Completion | ${metrics.engagement.trainingCompletionRate}% (Benchmark: 90%) - ${metrics.engagement.trainingCompletionRate < 90 ? 'Limits deal complexity to <$' + Math.round(avgDealSize*1.2/1000) + 'k' : 'Enables enterprise deals'} |
| Customer Satisfaction | ${metrics.delivery.customerSatisfaction}/5 (Target: 4.5+) - ${metrics.delivery.customerSatisfaction < 4.5 ? 'Churn probability 40% higher, $' + Math.round(churnRisk/1000) + 'k ARR at risk' : 'Stable customer relationships'} |
| Deal Registration | ${metrics.dealRegistration.winRate}% Win Rate - ${metrics.dealRegistration.winRate > 25 ? 'Above-average performance' : 'Optimization needed in sales process'} |

## Strategic Priorities (Q1 2025)

🔴 ${metrics.pipeline.conversion < 30 ? 'Increase pipeline conversion through structured sales coaching from ' + metrics.pipeline.conversion + '% to 35% (Impact: +$' + Math.round(pipelineUpside/1000) + 'k ARR)' : 'Leverage pipeline momentum for enterprise expansion'}
🟡 ${metrics.engagement.trainingCompletionRate < 90 ? 'Increase enablement rate to 95% to unlock more complex deals (Target: +25% Average Deal Size)' : 'Drive advanced certifications for specialized solutions'}  
🟢 ${metrics.delivery.customerSatisfaction < 4.5 ? 'Implement Customer Success Recovery Program (Executive Sponsor, monthly reviews)' : 'Launch Customer Advocacy Program for reference-driven growth'}

## Business Impact Forecast

| Investment Strategy | Potential ARR | Risk ARR | Investment | Expected ROI |
|---------------------|---------------|----------|------------|--------------|
${this.generateAIInvestmentStrategies(partner, metrics)}

## Next Actions

| Action | Owner | Priority |
|--------|-------|----------|
| ${metrics.healthScore < 75 ? 'Conduct comprehensive health assessment' : metrics.pipeline.conversion < 30 ? 'Implement pipeline conversion coaching program' : 'Schedule quarterly business review'} | ${partner.partnerManager} | High |
| ${metrics.engagement.trainingCompletionRate < 90 ? 'Complete missing required training modules' : 'Enroll in advanced certification program'} | Partner Team | Medium |
| ${metrics.delivery.customerSatisfaction < 4.5 ? 'Launch customer satisfaction recovery initiative' : 'Implement customer advocacy program'} | ${partner.accountManager} | ${metrics.delivery.customerSatisfaction < 4.0 ? 'High' : 'Low'} |
    `
  }
}

// Helper function for API Route
export async function generateQBRWithAI(partner: Partner, metrics: PartnerMetrics, allPartnerMetrics?: PartnerMetrics[], allPartners?: Partner[]) {
  const client = new OpenRouterClient()
  return await client.generateQBRInsights(partner, metrics, allPartnerMetrics, allPartners)
}