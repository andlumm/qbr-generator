export const qbrTemplates = {
  executiveSummary: (data: any) => `
## Executive Summary

**Key Highlights:**
- Revenue ${data.revenue.growth > 0 ? 'increased' : 'decreased'} by ${Math.abs(data.revenue.growth)}% to $${data.revenue.current.toLocaleString()}
- ${data.pipeline.count} active opportunities in pipeline worth $${data.pipeline.value.toLocaleString()}
- Partner health score: ${data.healthScore} (${data.healthScore >= 85 ? 'Excellent' : data.healthScore >= 70 ? 'Good' : 'Needs Attention'})

**Challenges:**
${data.riskLevel === 'High' ? 
  '- Urgent attention required to address declining metrics' :
  data.riskLevel === 'Medium' ?
  '- Pipeline conversion needs improvement' :
  '- Maintain current momentum while exploring growth opportunities'}

**Strategic Outlook:**
- ${data.revenue.growth > 20 ? 'Accelerate expansion into new segments' : 'Focus on core business stabilization'}
- ${data.engagement.trainingsCompleted < 5 ? 'Increase enablement participation' : 'Leverage certified team for complex deals'}
`,

  performanceMetrics: (data: any) => `
## Performance Metrics

### Revenue Performance
- **Current Quarter:** $${data.revenue.current.toLocaleString()}
- **Previous Quarter:** $${data.revenue.previous.toLocaleString()}
- **QoQ Growth:** ${data.revenue.growth}%
- **YTD Revenue:** $${data.revenue.ytd.toLocaleString()}

### Pipeline Health
- **Active Opportunities:** ${data.pipeline.count}
- **Total Pipeline Value:** $${data.pipeline.value.toLocaleString()}
- **Average Deal Size:** $${data.pipeline.avgDealSize.toLocaleString()}
- **Conversion Rate:** ${data.pipeline.conversion}%
`,

  // Weitere Templates...
}

// Hybrid-Ansatz: Template + LLM für Details
export async function generateHybridQBR(
  partner: any, 
  metrics: any, 
  llmClient?: any
) {
  let qbr = ''
  
  // Nutze Templates für Struktur
  qbr += qbrTemplates.executiveSummary(metrics)
  qbr += qbrTemplates.performanceMetrics(metrics)
  
  // Nutze LLM für spezifische Insights (wenn verfügbar)
  if (llmClient) {
    const insights = await llmClient.generateSection(
      `Based on ${metrics.revenue.growth}% growth and ${metrics.healthScore} health score, 
       provide 2-3 specific recommendations for ${partner.name}.`
    )
    qbr += `\n## AI-Generated Insights\n${insights}`
  }
  
  return qbr
}