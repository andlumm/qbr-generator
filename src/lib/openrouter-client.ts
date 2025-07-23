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
            content: `You are a Strategic Partnership Analyst for Executive Management.
            
            OUTPUT FORMAT - AI INSIGHTS BLOCK ONLY:
            
            ## Executive Summary
            [2-3 sentences: Health, Growth, Strategic Direction - concise, data-driven]
            
            ## Key Insights
            | Category | Metric/Statement |
            |----------|------------------|
            [Structured table with concrete numbers and business relevance]
            
            ## Priority Action Items
            [Bullet points - concrete, measurable, no emojis/badges]
            
            ## Business Impact Forecast
            | Lever | Potential ARR | Risk ARR | Investment |
            |-------|---------------|----------|------------|
            [Quantified table with dollar amounts]
            
            STYLE:
            - No emojis, colors, badges
            - Executive language (professional, solution-oriented)
            - Data-driven statements with business context
            - Avoid overly negative language ("subpar" → "requires optimization")
            - PPT/Management Summary ready`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })

      console.log('OpenRouter API call successful!')
      return response.choices[0]?.message?.content || 'No insights generated'
    } catch (error) {
      console.error('OpenRouter API Error:', error)
      console.log('Falling back to local insights...')
      return this.generateFallbackInsights(partner, metrics)
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
- Tier Revenue Growth: ${tierAvgGrowth.toFixed(1)}% QoQ vs ${metrics.revenue.growth.toFixed(1)}% (${metrics.revenue.growth > tierAvgGrowth ? 'Above' : 'Below'} tier average)
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
- Ecosystem Revenue Growth: ${ecoAvgGrowth.toFixed(1)}% QoQ vs ${metrics.revenue.growth.toFixed(1)}% (${metrics.revenue.growth > ecoAvgGrowth ? 'Above' : 'Below'} ecosystem average)
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
- ARR: $${metrics.revenue.current.toLocaleString()} | Growth: ${metrics.revenue.growth}% QoQ
- Pipeline: $${metrics.pipeline.value.toLocaleString()} (${metrics.pipeline.count} Deals)
- Conversion Rate: ${metrics.pipeline.conversion}% | Avg Deal: $${metrics.pipeline.avgDealSize.toLocaleString()}
- Training: ${metrics.engagement.trainingCompletionRate}% | CSAT: ${metrics.delivery.customerSatisfaction}/5
- Deal Win Rate: ${metrics.dealRegistration.winRate}% | MDF Usage: ${metrics.engagement.marketingFundUtilization}%

${benchmarksSection}

**Static Benchmarks:**
- Pipeline Coverage Target: 150%  
- Training Completion Target: 90%
- CSAT Target: 4.5/5
- Industry Win Rate: 25%

**Investment Recommendations (Data-Driven):**
${this.buildInvestmentRecommendations(partner, metrics)}

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
| Lever | Potential ARR | Risk ARR | Investment |
|-------|---------------|----------|------------|
[Use the investment recommendations provided above - these are calculated based on partner tier, performance gaps, and industry ROI benchmarks]

## Next Actions
| Action | Owner | Due |
|--------|-------|-----|
[3 specific actions with realistic owners and dates based on partner metrics and priorities - no status needed as these are new actions]

IMPORTANT: Text only, no visual elements, executive language, PPT-ready. Use ecosystem benchmarks for comparative insights and provided investment data for Business Impact Forecast.
    `
  }

  private calculatePercentile(value: number, allValues: number[]): number {
    const sorted = allValues.sort((a, b) => a - b)
    const rank = sorted.filter(v => v <= value).length
    return Math.round((rank / sorted.length) * 100)
  }

  private buildInvestmentRecommendations(partner: Partner, metrics: PartnerMetrics): string {
    const recommendations = PartnerInvestmentCalculator.calculateRecommendedInvestments(partner, metrics)
    
    let output = 'Based on partner tier, performance gaps, and industry ROI benchmarks:\n'
    recommendations.forEach((rec, index) => {
      output += `${index + 1}. ${rec.name}: ${PartnerInvestmentCalculator.formatCurrency(rec.potentialARR)} potential ARR, ${PartnerInvestmentCalculator.formatCurrency(rec.riskARR)} risk ARR, ${PartnerInvestmentCalculator.formatCurrency(rec.investment)} investment (ROI: ${rec.expectedROI.toFixed(1)}x, Priority: ${rec.priority})\n`
    })
    
    return output
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

${partner.name} shows ${metrics.revenue.growth > 15 ? 'above-average' : metrics.revenue.growth > 0 ? 'solid but improvable' : 'below-average'} growth of ${metrics.revenue.growth}% QoQ with a Health Score of ${metrics.healthScore}/100. Pipeline Coverage of ${metrics.pipeline.coverage}% and ${metrics.engagement.trainingCompletionRate < 90 ? 'suboptimal enablement metrics require strategic adjustments to maximize revenue potential' : 'solid enablement foundation provides basis for accelerated expansion'}.

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

| Lever | Potential ARR | Risk ARR | Investment |
|-------|---------------|----------|------------|
${recommendations.map(rec => 
  `| ${rec.name} | ${PartnerInvestmentCalculator.formatCurrency(rec.potentialARR)} | -${PartnerInvestmentCalculator.formatCurrency(rec.riskARR)} | ${PartnerInvestmentCalculator.formatCurrency(rec.investment)} |`
).join('\n')}
    `
  }
}

// Helper function for API Route
export async function generateQBRWithAI(partner: Partner, metrics: PartnerMetrics, allPartnerMetrics?: PartnerMetrics[], allPartners?: Partner[]) {
  const client = new OpenRouterClient()
  return await client.generateQBRInsights(partner, metrics, allPartnerMetrics, allPartners)
}