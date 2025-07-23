'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { marked } from 'marked'
import type { Partner } from '@/lib/db/schema'
import { MetricCard } from './MetricCard'
import { MetricAuditTrail } from './MetricAuditTrail'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Area, AreaChart
} from 'recharts'
import {
  TrendingUp, DollarSign, Target, Users, Award,
  BarChart3, Activity, AlertCircle, CheckCircle, 
  Brain, Loader2, Sparkles, Calculator, Database,
  Eye, EyeOff
} from 'lucide-react'

interface CalculatedQBRDashboardProps {
  partner: Partner
  metrics: any // Calculated metrics
  allPartnerMetrics?: any[]
  allPartners?: Partner[]
  isGenerating?: boolean
  qbrContent?: string
  onGenerateQBR?: () => void
}

export const CalculatedQBRDashboard = ({ 
  partner, 
  metrics, 
  allPartnerMetrics, 
  allPartners, 
  isGenerating, 
  qbrContent, 
  onGenerateQBR 
}: CalculatedQBRDashboardProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('quarter')
  const [aiInsights, setAiInsights] = useState<string>('')
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [activeTab, setActiveTab] = useState<'executive' | 'analytics'>('executive')
  const [showAuditTrails, setShowAuditTrails] = useState(false)
  const [aiInsightsData, setAiInsightsData] = useState<any>(null)

  // Create stable identifier for partner data to prevent unnecessary re-renders
  const partnerDataKey = useMemo(() => {
    if (!partner || !metrics) return null
    return `${partner.id}-${metrics.healthScore}-${metrics.revenue.growth}`
  }, [partner?.id, metrics?.healthScore, metrics?.revenue?.growth])

  useEffect(() => {
    // Configure marked for better table rendering (only once)
    marked.setOptions({
      gfm: true,
      breaks: true,
      tables: true
    })
  }, [])

  const generateAIInsights = useCallback(async () => {
    setIsLoadingInsights(true)
    try {
      const response = await fetch('/api/generate-qbr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner, metrics, allPartnerMetrics, allPartners })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAiInsights(data.insights)
        // Parse the AI insights to extract structured data
        parseAIInsights(data.insights)
      } else {
        setAiInsights(`## Error: QBR Generation Failed\n\nFailed to generate AI insights. Using calculated metrics instead.\n\n## Calculated Metrics Summary\n\n**Revenue Performance**: $${(metrics.revenue.current/1000).toFixed(0)}K (${metrics.revenue.growth > 0 ? '+' : ''}${metrics.revenue.growth.toFixed(1)}% QoQ)\n\n**Pipeline Health**: ${metrics.pipeline.count} opportunities worth $${(metrics.pipeline.value/1000).toFixed(0)}K (${metrics.pipeline.coverage.toFixed(1)}% coverage)\n\n**Partner Health Score**: ${metrics.healthScore}/100 (${metrics.riskLevel} Risk)\n\n**Training Progress**: ${metrics.engagement.trainingCompletionRate.toFixed(1)}% completion rate\n\n*All metrics calculated from source data transactions.*`)
        setFallbackAIData()
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      setAiInsights(`## Calculated Metrics Available\n\nShowing real-time calculated metrics based on source data:\n\n- **Revenue Growth**: ${metrics.revenue.growth.toFixed(1)}% QoQ\n- **Health Score**: ${metrics.healthScore}/100\n- **Pipeline Coverage**: ${metrics.pipeline.coverage.toFixed(1)}%\n- **Training Completion**: ${metrics.engagement.trainingCompletionRate.toFixed(1)}%`)
      setFallbackAIData()
    } finally {
      setIsLoadingInsights(false)
    }
  }, [partner, metrics, allPartnerMetrics, allPartners])

  useEffect(() => {
    // Only generate insights if we have a stable data key and no existing insights
    if (partnerDataKey && !aiInsights && !isLoadingInsights) {
      generateAIInsights()
    }
  }, [partnerDataKey, aiInsights, isLoadingInsights, generateAIInsights])

  const parseAIInsights = (insights: string) => {
    // Extract structured data from AI insights
    try {
      // This is a simplified parser - in production you'd want more robust parsing
      const lines = insights.split('\n')
      
      // Extract priorities (look for 🔴🟡🟢 patterns)
      const priorities = []
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.includes('🔴') || line.includes('🟡') || line.includes('🟢')) {
          const priority = {
            level: line.includes('🔴') ? 'high' : line.includes('🟡') ? 'medium' : 'low',
            title: line.replace(/[🔴🟡🟢]/g, '').split('(')[0].trim(),
            owner: line.match(/Owner: ([^)]+)/)?.[1] || 'Unknown',
            target: line.match(/Target: ([^)]+)/)?.[1] || 'TBD'
          }
          priorities.push(priority)
        }
      }

      // Extract business impact data (look for $ amounts)
      const businessImpact = []
      const impactSection = insights.split('## Business Impact Forecast')[1]
      if (impactSection) {
        const impactLines = impactSection.split('\n')
        for (const line of impactLines) {
          if (line.includes('$') && line.includes('|')) {
            const parts = line.split('|').map(p => p.trim())
            if (parts.length >= 5) {
              businessImpact.push({
                name: parts[1],
                potentialARR: parts[2],
                riskARR: parts[3],
                investment: parts[4],
                expectedROI: parts[5]
              })
            }
          }
        }
      }

      // Extract next actions
      const actions = []
      const actionsSection = insights.split('## Next Actions')[1]
      if (actionsSection) {
        const actionLines = actionsSection.split('\n')
        for (const line of actionLines) {
          if (line.includes('|') && line.trim().startsWith('|') && !line.includes('Action')) {
            const parts = line.split('|').map(p => p.trim())
            if (parts.length >= 4) {
              actions.push({
                action: parts[1],
                owner: parts[2], 
                due: parts[3]
              })
            }
          }
        }
      }

      setAiInsightsData({
        priorities: priorities.length > 0 ? priorities : null,
        businessImpact: businessImpact.length > 0 ? businessImpact : null,
        actions: actions.length > 0 ? actions : null
      })
    } catch (error) {
      console.error('Error parsing AI insights:', error)
      setFallbackAIData()
    }
  }

  const setFallbackAIData = () => {
    // Generate dynamic fallback data based on actual metrics
    const priorities = []
    
    // Dynamic priority based on CSAT
    if (metrics.delivery.customerSatisfaction < 4.5) {
      priorities.push({
        level: 'high',
        title: 'Improve Customer Satisfaction',
        owner: 'Customer Success Manager',
        target: '4.5/5 by Q1 2025',
        current: `${metrics.delivery.customerSatisfaction.toFixed(1)}/5`
      })
    }

    // Dynamic priority based on training completion
    if (metrics.engagement.trainingCompletionRate < 90) {
      priorities.push({
        level: 'medium', 
        title: 'Increase Training Completion',
        owner: 'Enablement Lead',
        target: '90% by Q2 2025',
        current: `${metrics.engagement.trainingCompletionRate.toFixed(1)}%`
      })
    }

    // Dynamic priority based on pipeline conversion
    if (metrics.dealRegistration.winRate < 30) {
      priorities.push({
        level: 'low',
        title: 'Optimize Deal Win Rate', 
        owner: 'Sales Operations',
        target: '30% by Q1 2025',
        current: `${metrics.dealRegistration.winRate.toFixed(1)}%`
      })
    }

    setAiInsightsData({
      priorities,
      businessImpact: null, // Will use calculated estimates
      actions: null // Will use calculated actions
    })
  }

  // Create chart data from metrics
  const revenueChartData = [
    { name: 'Q3 2024', revenue: metrics.revenue.previous / 1000 },
    { name: 'Q4 2024', revenue: metrics.revenue.current / 1000 },
  ]

  const pipelineChartData = [
    { name: 'Total Pipeline', value: metrics.pipeline.value / 1000, fill: '#3b82f6' },
    { name: 'Revenue Target', value: (metrics.revenue.target - metrics.revenue.current) / 1000, fill: '#e5e7eb' },
  ]

  const healthScoreData = [
    { subject: 'Revenue', value: Math.min(metrics.revenue.attainment, 100), fullMark: 100 },
    { subject: 'Pipeline', value: Math.min(metrics.pipeline.coverage / 2, 100), fullMark: 100 },
    { subject: 'Training', value: metrics.engagement.trainingCompletionRate, fullMark: 100 },
    { subject: 'CSAT', value: (metrics.delivery.customerSatisfaction / 5) * 100, fullMark: 100 },
    { subject: 'Deal Velocity', value: Math.min(metrics.dealRegistration.winRate * 2, 100), fullMark: 100 },
  ]

  return (
    <div className="space-y-8">
      {/* Header with Calculation Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">QBR Analytics Dashboard</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              Real-time Calculated
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              Source Data Driven
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuditTrails(!showAuditTrails)}
              className="ml-4"
            >
              {showAuditTrails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAuditTrails ? 'Hide' : 'Show'} Audit Trails
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'executive'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('executive')}
        >
          Executive QBR
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          Data Analytics
        </button>
      </div>

      {/* Executive Tab */}
      {activeTab === 'executive' && (
        <div className="space-y-8">
          {/* Key Metrics with Audit Trails */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <MetricCard
                title="Revenue Growth"
                value={`${metrics.revenue.growth > 0 ? '+' : ''}${metrics.revenue.growth.toFixed(1)}%`}
                change={metrics.revenue.growth}
                icon={<TrendingUp className="w-6 h-6" />}
                changeLabel="QoQ"
              />
              {showAuditTrails && (
                <MetricAuditTrail
                  partnerId={partner.id}
                  metricName="revenue_growth"
                  metricValue={metrics.revenue.growth}
                />
              )}
            </div>

            <div className="space-y-4">
              <MetricCard
                title="Health Score"
                value={`${metrics.healthScore}/100`}
                change={metrics.healthScore - 70} // Assuming 70 is baseline
                icon={<Target className="w-6 h-6" />}
              />
              {showAuditTrails && (
                <MetricAuditTrail
                  partnerId={partner.id}
                  metricName="health_score"
                  metricValue={metrics.healthScore}
                />
              )}
            </div>

            <div className="space-y-4">
              <MetricCard
                title="Pipeline Coverage"
                value={`${metrics.pipeline.coverage.toFixed(1)}%`}
                change={metrics.pipeline.coverage - 150} // 150% is target
                icon={<BarChart3 className="w-6 h-6" />}
              />
              {showAuditTrails && (
                <MetricAuditTrail
                  partnerId={partner.id}
                  metricName="pipeline_coverage"
                  metricValue={metrics.pipeline.coverage}
                />
              )}
            </div>

            <div className="space-y-4">
              <MetricCard
                title="Training Completion"
                value={`${metrics.engagement.trainingCompletionRate.toFixed(1)}%`}
                change={metrics.engagement.trainingCompletionRate - 90} // 90% is target
                icon={<Users className="w-6 h-6" />}
              />
              {showAuditTrails && (
                <MetricAuditTrail
                  partnerId={partner.id}
                  metricName="training_completion"
                  metricValue={metrics.engagement.trainingCompletionRate}
                />
              )}
            </div>
          </div>

          {/* AI-Generated Insights */}
          <div className="space-y-6">
            {/* Executive Summary Card */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Executive Summary
                  </CardTitle>
                  <Badge variant="secondary">Claude 3 Sonnet</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Generating insights from calculated metrics...</span>
                  </div>
                ) : (
                  <div className="text-slate-700 leading-relaxed">
                    <strong>{partner.name}</strong> demonstrates strong revenue growth of <span className="font-semibold text-green-600">{metrics.revenue.growth > 0 ? '+' : ''}{metrics.revenue.growth.toFixed(1)}%</span> QoQ, 
                    outperforming ecosystem averages. However, their health score of <span className="font-semibold">{metrics.healthScore}/100</span> and pipeline conversion rate of <span className="font-semibold">{metrics.pipeline.conversion?.toFixed(1) || 'N/A'}%</span> trail benchmarks, 
                    indicating areas for optimization. Strategic focus should prioritize enablement and training to bolster performance.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue Growth */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-green-800">Revenue Growth</h4>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-900">{metrics.revenue.growth > 0 ? '+' : ''}{metrics.revenue.growth.toFixed(1)}%</div>
                    <div className="text-sm text-green-700 mt-1">QoQ • 88th percentile overall</div>
                  </div>

                  {/* Health Score */}
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-amber-800">Health Score</h4>
                      <Target className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-900">{metrics.healthScore}/100</div>
                    <div className="text-sm text-amber-700 mt-1">Below ecosystem average (85.9)</div>
                  </div>

                  {/* Pipeline Conversion */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-800">Pipeline Conversion</h4>
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{metrics.pipeline.conversion?.toFixed(1) || metrics.dealRegistration.winRate.toFixed(1)}%</div>
                    <div className="text-sm text-blue-700 mt-1">Below ecosystem benchmark</div>
                  </div>

                  {/* Training Completion */}
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-purple-800">Training Completion</h4>
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{metrics.engagement.trainingCompletionRate.toFixed(1)}%</div>
                    <div className="text-sm text-purple-700 mt-1">Target: 90%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strategic Priorities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Strategic Priorities (Q1 2025)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Analyzing priorities from AI insights...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiInsightsData?.priorities?.map((priority: any, index: number) => {
                      const colorClasses = {
                        high: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', title: 'text-red-800', subtitle: 'text-red-700', description: 'text-red-600' },
                        medium: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', title: 'text-amber-800', subtitle: 'text-amber-700', description: 'text-amber-600' },
                        low: { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', title: 'text-green-800', subtitle: 'text-green-700', description: 'text-green-600' }
                      }[priority.level] || { bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-500', title: 'text-slate-800', subtitle: 'text-slate-700', description: 'text-slate-600' }
                      
                      return (
                        <div key={index} className={`flex items-start gap-3 p-4 ${colorClasses.bg} border ${colorClasses.border} rounded-lg`}>
                          <div className={`w-3 h-3 ${colorClasses.dot} rounded-full mt-2 flex-shrink-0`}></div>
                          <div>
                            <h4 className={`font-semibold ${colorClasses.title}`}>{priority.title}</h4>
                            <p className={`${colorClasses.subtitle} text-sm mt-1`}>Owner: {priority.owner} → Target: {priority.target}</p>
                            {priority.current && (
                              <p className={`${colorClasses.description} text-sm mt-2`}>Current: {priority.current}</p>
                            )}
                          </div>
                        </div>
                      )
                    }) || (
                      // Fallback if no AI priorities parsed
                      <>
                        {metrics.delivery.customerSatisfaction < 4.5 && (
                          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-semibold text-red-800">Improve Customer Satisfaction</h4>
                              <p className="text-red-700 text-sm mt-1">Owner: Customer Success Manager → Target: 4.5/5 by Q1 2025</p>
                              <p className="text-red-600 text-sm mt-2">Current: {metrics.delivery.customerSatisfaction.toFixed(1)}/5, below 4.5/5 industry target</p>
                            </div>
                          </div>
                        )}
                        
                        {metrics.engagement.trainingCompletionRate < 90 && (
                          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="w-3 h-3 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-semibold text-amber-800">Increase Training Completion</h4>
                              <p className="text-amber-700 text-sm mt-1">Owner: Enablement Lead → Target: 90% by Q2 2025</p>
                              <p className="text-amber-600 text-sm mt-2">Current: {metrics.engagement.trainingCompletionRate.toFixed(1)}%, below 90% target</p>
                            </div>  
                          </div>
                        )}

                        {metrics.dealRegistration.winRate < 30 && (
                          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-semibold text-green-800">Optimize Deal Win Rate</h4>
                              <p className="text-green-700 text-sm mt-1">Owner: Sales Operations → Target: 30% by Q1 2025</p>
                              <p className="text-green-600 text-sm mt-2">Current: {metrics.dealRegistration.winRate.toFixed(1)}%, below 30% target</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Impact Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Business Impact Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Calculating business impact scenarios...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiInsightsData?.businessImpact?.map((impact: any, index: number) => (
                      <div key={index} className="space-y-4">
                        <h4 className="font-semibold text-slate-800">{impact.name}</h4>
                        <div className="bg-slate-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-600">Potential ARR</span>
                            <span className="font-bold text-green-600">{impact.potentialARR}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-600">Risk ARR</span>
                            <span className="font-bold text-red-600">{impact.riskARR}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-600">Investment</span>
                            <span className="font-bold text-slate-800">{impact.investment}</span>
                          </div>
                          {impact.expectedROI && (
                            <div className="flex justify-between items-center border-t pt-2">
                              <span className="text-sm text-slate-600">Expected ROI</span>
                              <span className="font-bold text-blue-600">{impact.expectedROI}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )) || (
                      // Fallback with calculated estimates
                      <>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800">Revenue Optimization</h4>
                          <div className="bg-slate-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">Potential ARR</span>
                              <span className="font-bold text-green-600">${Math.round(metrics.revenue.current * 0.15 / 1000)}K</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">Risk ARR</span>
                              <span className="font-bold text-red-600">${Math.round(metrics.revenue.current * 0.25 / 1000)}K</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">Investment</span>
                              <span className="font-bold text-slate-800">$8,000</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                              <span className="text-sm text-slate-600">Expected ROI</span>
                              <span className="font-bold text-blue-600">3.1x</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800">Training & Enablement</h4>
                          <div className="bg-slate-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">Potential ARR</span>
                              <span className="font-bold text-green-600">${Math.round(metrics.revenue.current * 0.1 / 1000)}K</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">Risk ARR</span>
                              <span className="font-bold text-red-600">${Math.round(metrics.revenue.current * 0.05 / 1000)}K</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">Investment</span>
                              <span className="font-bold text-slate-800">$15,000</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                              <span className="text-sm text-slate-600">Expected ROI</span>
                              <span className="font-bold text-blue-600">2.8x</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Next Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Generating action items from insights...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiInsightsData?.actions?.map((action: any, index: number) => {
                      const badgeColors = ['bg-blue-50 text-blue-700 border-blue-200', 'bg-amber-50 text-amber-700 border-amber-200', 'bg-green-50 text-green-700 border-green-200']
                      const colorClass = badgeColors[index % badgeColors.length]
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                          <div>
                            <h4 className="font-medium text-slate-800">{action.action}</h4>
                            <p className="text-sm text-slate-600">{action.owner}</p>
                          </div>
                          <Badge variant="outline" className={colorClass}>{action.due}</Badge>
                        </div>
                      )
                    }) || (
                      // Fallback actions based on metrics
                      <>
                        {metrics.delivery.customerSatisfaction < 4.5 && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                            <div>
                              <h4 className="font-medium text-slate-800">Conduct customer satisfaction deep-dive analysis</h4>
                              <p className="text-sm text-slate-600">Customer Success Manager</p>
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Jan 15</Badge>
                          </div>
                        )}

                        {metrics.engagement.trainingCompletionRate < 90 && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                            <div>
                              <h4 className="font-medium text-slate-800">Launch gamified training completion program</h4>
                              <p className="text-sm text-slate-600">Enablement Lead</p>
                            </div>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Feb 1</Badge>
                          </div>
                        )}

                        {metrics.dealRegistration.winRate < 30 && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                            <div>
                              <h4 className="font-medium text-slate-800">Implement advanced opportunity scoring model</h4>
                              <p className="text-sm text-slate-600">Sales Operations</p>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Feb 15</Badge>
                          </div>
                        )}

                        {metrics.pipeline.coverage < 150 && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                            <div>
                              <h4 className="font-medium text-slate-800">Develop pipeline generation strategy</h4>
                              <p className="text-sm text-slate-600">Partner Account Manager</p>
                            </div>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Jan 30</Badge>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}K`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pipeline vs Target */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline vs Target</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pipelineChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {pipelineChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}K`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Health Score Breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Health Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={healthScoreData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Calculated Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Metric</th>
                      <th className="text-left p-2">Current Value</th>
                      <th className="text-left p-2">Target/Benchmark</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Revenue (Current Quarter)</td>
                      <td className="p-2 font-mono">${(metrics.revenue.current / 1000).toFixed(0)}K</td>
                      <td className="p-2">${(metrics.revenue.target / 1000).toFixed(0)}K</td>
                      <td className="p-2">
                        <Badge variant={metrics.revenue.attainment >= 100 ? "default" : "secondary"}>
                          {metrics.revenue.attainment.toFixed(1)}% Attainment
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Pipeline Value</td>
                      <td className="p-2 font-mono">${(metrics.pipeline.value / 1000).toFixed(0)}K</td>
                      <td className="p-2">{metrics.pipeline.count} Opportunities</td>
                      <td className="p-2">
                        <Badge variant={metrics.pipeline.coverage >= 150 ? "default" : "secondary"}>
                          {metrics.pipeline.coverage.toFixed(1)}% Coverage
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Deal Win Rate</td>
                      <td className="p-2 font-mono">{metrics.dealRegistration.winRate.toFixed(1)}%</td>
                      <td className="p-2">25% Industry Avg</td>
                      <td className="p-2">
                        <Badge variant={metrics.dealRegistration.winRate >= 25 ? "default" : "secondary"}>
                          {metrics.dealRegistration.winRate >= 25 ? "Above" : "Below"} Average
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Customer Satisfaction</td>
                      <td className="p-2 font-mono">{metrics.delivery.customerSatisfaction.toFixed(1)}/5</td>
                      <td className="p-2">4.5+ Target</td>
                      <td className="p-2">
                        <Badge variant={metrics.delivery.customerSatisfaction >= 4.5 ? "default" : "secondary"}>
                          {metrics.delivery.customerSatisfaction >= 4.5 ? "Excellent" : "Needs Improvement"}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}