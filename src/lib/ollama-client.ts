// Ollama API client for Llama 3.2:3b
export class OllamaClient {
  private baseUrl: string

  constructor(baseUrl: string = 'http://your-vps-ip:11434') {
    this.baseUrl = baseUrl
  }

  async generateSection(prompt: string, model: string = 'llama3.2:3b') {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      })
    })

    const data = await response.json()
    return data.response
  }

  async generateQBR(partner: any, metrics: any) {
    // Generiere QBR in Abschnitten
    const sections = await Promise.all([
      this.generateExecutiveSummary(partner, metrics),
      this.generatePerformanceAnalysis(metrics),
      this.generateRiskAssessment(metrics),
      this.generateActionItems(partner, metrics)
    ])

    return sections.join('\n\n')
  }

  private async generateExecutiveSummary(partner: any, metrics: any) {
    const prompt = `Create an executive summary for ${partner.name}:
- Revenue: $${metrics.revenue.current} (${metrics.revenue.growth}% growth)
- Health Score: ${metrics.healthScore}
- Risk Level: ${metrics.riskLevel}

Write 3 bullet points: highlights, challenges, outlook. Be concise.`
    
    return `## Executive Summary\n\n${await this.generateSection(prompt)}`
  }

  private async generatePerformanceAnalysis(metrics: any) {
    const prompt = `Analyze this partner performance:
- Quarter Revenue: $${metrics.revenue.current}
- Previous Quarter: $${metrics.revenue.previous}
- Pipeline: ${metrics.pipeline.count} deals worth $${metrics.pipeline.value}
- Conversion: ${metrics.pipeline.conversion}%

Write a brief performance analysis (max 100 words).`

    return `## Performance Analysis\n\n${await this.generateSection(prompt)}`
  }

  private async generateRiskAssessment(metrics: any) {
    const prompt = `Assess partner risk level "${metrics.riskLevel}" with health score ${metrics.healthScore}.
List 3 specific actions to ${metrics.riskLevel === 'High' ? 'mitigate risks' : 'maintain momentum'}.`

    return `## Risk Assessment\n\n${await this.generateSection(prompt)}`
  }

  private async generateActionItems(partner: any, metrics: any) {
    const prompt = `Create 5 action items for ${partner.name} based on:
- ${metrics.revenue.growth}% revenue growth
- ${metrics.engagement.trainingsCompleted} trainings completed
- ${metrics.pipeline.count} pipeline opportunities

Format as bullet points with owner and deadline.`

    return `## Action Items\n\n${await this.generateSection(prompt)}`
  }
}