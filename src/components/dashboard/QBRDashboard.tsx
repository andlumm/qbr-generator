'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Partner } from '@/lib/db/schema'
import { MetricCard } from './MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Area, AreaChart
} from 'recharts'
import {
  TrendingUp, DollarSign, Target, Users, Award,
  BarChart3, Activity, AlertCircle, CheckCircle, 
  Brain, Loader2, Sparkles
} from 'lucide-react'

interface QBRDashboardProps {
  partner: Partner
  metrics: any // Using converted metrics format from PartnerService
  allPartnerMetrics?: any[]
  allPartners?: Partner[]
  isGenerating?: boolean
  qbrContent?: string
  onGenerateQBR?: () => void
}

export const QBRDashboard = ({ partner, metrics, allPartnerMetrics, allPartners, isGenerating, qbrContent, onGenerateQBR }: QBRDashboardProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('quarter')
  const [aiInsights, setAiInsights] = useState<string>('')
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [activeTab, setActiveTab] = useState<'executive' | 'analytics'>('executive')

  useEffect(() => {
    generateAIInsights()
  }, [partner, metrics])

  const generateAIInsights = async () => {
    console.log('Starting AI insights generation...')
    console.log('Partner:', partner?.name)
    console.log('Metrics available:', !!metrics)
    
    setIsLoadingInsights(true)
    try {
      const response = await fetch('/api/generate-qbr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner, metrics, allPartnerMetrics, allPartners })
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.success) {
        setAiInsights(data.insights)
      } else {
        console.error('Failed to generate insights:', data.error)
        console.error('Error details:', data.details)
        console.error('Has API key:', data.hasApiKey)
        console.error('API key length:', data.apiKeyLength)
        
        // Show error to user
        setAiInsights(`## Error\n\nFailed to generate QBR insights.\n\n**Details:** ${data.details}\n\n**API Key Available:** ${data.hasApiKey ? 'Yes' : 'No'}\n\n**Debug Info:** This error typically occurs when the OpenRouter API key is not configured in Vercel environment variables.`)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      
      // Provide fallback content when API fails
      setAiInsights(`## Error: API Connection Failed

Failed to connect to OpenRouter API for QBR generation.

**Most likely cause:** OpenRouter API key not configured in Vercel environment variables.

**To fix this issue:**
1. Get a new OpenRouter API key (old one was compromised)
2. Go to Vercel Dashboard → Project Settings → Environment Variables
3. Add: \`OPENROUTER_API_KEY\` = \`[your_new_api_key]\`
4. Redeploy the application

**For now, here's a basic analysis:**

## Executive Summary
${partner.name} (${partner.tier} Partner) shows ${metrics.revenue.growth > 0 ? 'positive' : 'declining'} growth trends with ${metrics.healthScore}/100 health score requiring strategic attention.

## Key Insights
| Category | Metric/Statement |
|----------|------------------|
| Revenue Performance | $${(metrics.revenue.current/1000).toFixed(0)}K ARR with ${metrics.revenue.growth.toFixed(1)}% QoQ growth |
| Pipeline Health | ${metrics.pipeline.coverage}% coverage, ${metrics.pipeline.count} opportunities worth $${(metrics.pipeline.value/1000).toFixed(0)}K |
| Partner Enablement | ${metrics.engagement.trainingCompletionRate}% training completion rate |
| Customer Satisfaction | ${metrics.delivery.customerSatisfaction}/5 CSAT score |

## Next Actions
| Action | Owner | Due |
|--------|-------|-----|
| Configure OpenRouter API key in Vercel | Technical Team | This Week |
| Schedule partner health review | ${partner.partnerManager} | Next Week |
| Review enablement gaps | Partner Success | End of Month |`)
    } finally {
      setIsLoadingInsights(false)
    }
  }

  // Prepare data for charts
  const revenueData = [
    { month: 'Oct', revenue: metrics.revenue.previous * 0.3, target: metrics.revenue.target * 0.3 },
    { month: 'Nov', revenue: metrics.revenue.previous * 0.35, target: metrics.revenue.target * 0.35 },
    { month: 'Dec', revenue: metrics.revenue.previous * 0.35, target: metrics.revenue.target * 0.35 },
    { month: 'Jan', revenue: metrics.revenue.current * 0.3, target: metrics.revenue.target * 0.3 },
    { month: 'Feb', revenue: metrics.revenue.current * 0.35, target: metrics.revenue.target * 0.35 },
    { month: 'Mar', revenue: metrics.revenue.current * 0.35, target: metrics.revenue.target * 0.35 }
  ]

  const dealFunnelData = [
    { stage: 'Submitted', value: metrics.dealRegistration.submitted, percentage: 100 },
    { stage: 'Approved', value: metrics.dealRegistration.approved, percentage: (metrics.dealRegistration.approved / metrics.dealRegistration.submitted) * 100 },
    { stage: 'Won', value: metrics.dealRegistration.won, percentage: (metrics.dealRegistration.won / metrics.dealRegistration.submitted) * 100 }
  ]

  const performanceRadarData = [
    { metric: 'Revenue', value: metrics.revenue.attainment },
    { metric: 'Pipeline', value: metrics.pipeline.coverage },
    { metric: 'Training', value: metrics.engagement.trainingCompletionRate },
    { metric: 'MDF Usage', value: metrics.engagement.marketingFundUtilization },
    { metric: 'CSAT', value: metrics.delivery.customerSatisfaction * 20 },
    { metric: 'Deal Win Rate', value: metrics.dealRegistration.winRate * 2 }
  ]

  const pieData = [
    { name: 'Won', value: metrics.dealRegistration.won, color: '#10b981' },
    { name: 'Lost', value: metrics.dealRegistration.approved - metrics.dealRegistration.won, color: '#ef4444' },
    { name: 'Pending', value: metrics.dealRegistration.submitted - metrics.dealRegistration.approved, color: '#f59e0b' }
  ]

  const getHealthColor = (score: number) => {
    if (score >= 85) return '#10b981'
    if (score >= 70) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('executive')}
              className={`flex-1 px-6 py-4 text-center font-medium text-sm transition-colors ${
                activeTab === 'executive'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-4 h-4" />
                Executive QBR
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-6 py-4 text-center font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Data Analytics
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'executive' ? (
        <div className="space-y-6">
          {/* Compact Partner Managers Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Partner Manager</div>
                <div className="text-base font-semibold text-slate-900">{partner.partnerManager}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Account Manager</div>
                <div className="text-base font-semibold text-slate-900">{partner.accountManager}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QBR Generation UI */}
      {onGenerateQBR && !qbrContent && (
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center py-8">
              <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to Generate QBR</h3>
              <p className="text-slate-600 mb-6">
                Our AI will analyze all partner data and create a comprehensive QBR in seconds
              </p>
              <button
                onClick={onGenerateQBR}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating QBR...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate QBR Report
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 
      COMMENTED OUT FOR EXECUTIVE TEMPLATE - CAN BE RESTORED LATER
      
      KPI Cards Grid
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue Attainment"
          value={`${metrics.revenue.attainment}%`}
          change={metrics.revenue.growth}
          changeLabel="QoQ"
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Pipeline Coverage"
          value={`${metrics.pipeline.coverage}%`}
          change={metrics.pipeline.coverage - 100}
          icon={<Target className="w-6 h-6" />}
          color={metrics.pipeline.coverage >= 100 ? 'green' : 'amber'}
        />
        <MetricCard
          title="Deal Win Rate"
          value={`${metrics.dealRegistration.winRate}%`}
          icon={<Award className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Customer Satisfaction"
          value={`${metrics.delivery.customerSatisfaction}/5`}
          icon={<Users className="w-6 h-6" />}
          color={metrics.delivery.customerSatisfaction >= 4 ? 'green' : 'amber'}
        />
      </div>

      Charts Row 1
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        Revenue Trend
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        Deal Funnel
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Deal Registration Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dealFunnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                  {dealFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#10b981' : index === 1 ? '#3b82f6' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      Charts Row 2
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        Performance Radar
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceRadarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        Deal Status Pie
        <Card>
          <CardHeader>
            <CardTitle>Deal Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        Key Metrics Summary
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Portal Logins (30d)</span>
                <span className="font-bold">{metrics.engagement.portalLogins}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Certifications Active</span>
                <span className="font-bold">{metrics.engagement.certificationsActive}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Training Completion</span>
                <span className="font-bold">{metrics.engagement.trainingCompletionRate}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">MDF Utilization</span>
                <span className="font-bold">{metrics.engagement.marketingFundUtilization}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Avg Time to Go-Live</span>
                <span className="font-bold">{metrics.delivery.avgTimeToGoLive} days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      END OF COMMENTED CHARTS SECTION 
      */}

      {/* AI Insights Section - Only show when QBR is generated */}
      {qbrContent && (
        <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Strategic Analysis</h3>
                <p className="text-sm text-slate-500">AI-powered insights • Claude 3 Sonnet</p>
              </div>
            </div>
            {isLoadingInsights && (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-slate-600">Analyzing partner data...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInsights ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-slate-600 font-medium">Analyzing partner data...</span>
              </div>
            </div>
            ) : aiInsights ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="space-y-8">
                  {aiInsights.split('## ').filter(section => section.trim()).map((section, index) => {
                    const lines = section.trim().split('\n').filter(line => line.trim())
                    const title = lines[0]
                    const content = lines.slice(1).join('\n')
                    
                    // Determine section styling based on title
                    const getSectionStyle = (title: string) => {
                      if (title === 'Executive Summary') {
                        return {
                          borderColor: 'border-blue-600',
                          bgColor: 'bg-blue-50',
                          textColor: 'text-blue-900',
                          titleSize: 'text-xl'
                        }
                      } else if (title.includes('Strategic Priorities')) {
                        return {
                          borderColor: 'border-green-500',
                          bgColor: 'bg-green-50',
                          textColor: 'text-green-900',
                          titleSize: 'text-lg'
                        }
                      } else if (title === 'Business Impact Forecast') {
                        return {
                          borderColor: 'border-amber-500',
                          bgColor: 'bg-amber-50',
                          textColor: 'text-amber-900',
                          titleSize: 'text-lg'
                        }
                      } else if (title === 'Next Actions') {
                        return {
                          borderColor: 'border-red-500',
                          bgColor: 'bg-red-50',
                          textColor: 'text-red-900',
                          titleSize: 'text-lg'
                        }
                      } else {
                        return {
                          borderColor: 'border-slate-300',
                          bgColor: 'bg-slate-50',
                          textColor: 'text-slate-800',
                          titleSize: 'text-lg'
                        }
                      }
                    }
                    
                    const sectionStyle = getSectionStyle(title)
                    
                    return (
                      <div key={index}>
                        <div className={`${sectionStyle.bgColor} border-l-4 ${sectionStyle.borderColor} p-4 mb-4`}>
                          <h2 className={`${sectionStyle.titleSize} font-semibold ${sectionStyle.textColor}`}>{title}</h2>
                        </div>
                        
                        {title === 'Key Insights' && content.includes('|') ? (
                          <div className="mb-6">
                            <table className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-6 py-4 text-left font-semibold text-slate-800 border-b border-slate-200 w-1/3">Category</th>
                                  <th className="px-6 py-4 text-left font-semibold text-slate-800 border-b border-slate-200">Metric/Statement</th>
                                </tr>
                              </thead>
                              <tbody>
                                {content.split('\n').filter(line => 
                                  line.includes('|') && 
                                  !line.includes('---') && 
                                  !line.includes('Category') &&
                                  line.trim() !== ''
                                ).map((row, i) => {
                                  const parts = row.split('|')
                                  if (parts.length < 3) return null
                                  const cat = parts[1]?.trim()
                                  const desc = parts[2]?.trim()
                                  if (!cat || !desc) return null
                                  return (
                                    <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}>
                                      <td className="px-6 py-4 text-slate-900 font-semibold align-top">{cat}</td>
                                      <td className="px-6 py-4 text-slate-700 leading-relaxed">{desc}</td>
                                    </tr>
                                  )
                                }).filter(Boolean)}
                              </tbody>
                            </table>
                          </div>
                        ) : title === 'Business Impact Forecast' && content.includes('|') ? (
                          <div className="mb-6">
                            <table className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-6 py-4 text-left font-semibold text-slate-800 border-b border-slate-200">Lever</th>
                                  <th className="px-6 py-4 text-right font-semibold text-slate-800 border-b border-slate-200">Potential ARR</th>
                                  <th className="px-6 py-4 text-right font-semibold text-slate-800 border-b border-slate-200">Risk ARR</th>
                                  <th className="px-6 py-4 text-right font-semibold text-slate-800 border-b border-slate-200">Investment</th>
                                </tr>
                              </thead>
                              <tbody>
                                {content.split('\n').filter(line => 
                                  line.includes('|') && 
                                  !line.includes('---') && 
                                  !line.includes('Lever') &&
                                  line.trim() !== ''
                                ).map((row, i) => {
                                  const parts = row.split('|')
                                  if (parts.length < 5) return null
                                  const lever = parts[1]?.trim()
                                  const potential = parts[2]?.trim()
                                  const risk = parts[3]?.trim()
                                  const investment = parts[4]?.trim()
                                  if (!lever || !potential || !risk || !investment) return null
                                  return (
                                    <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}>
                                      <td className="px-6 py-4 text-slate-900 font-semibold">{lever}</td>
                                      <td className="px-6 py-4 text-right font-mono text-green-700 font-semibold">{potential}</td>
                                      <td className="px-6 py-4 text-right font-mono text-red-600 font-semibold">{risk}</td>
                                      <td className="px-6 py-4 text-right font-mono text-slate-900 font-semibold">{investment}</td>
                                    </tr>
                                  )
                                }).filter(Boolean)}
                              </tbody>
                            </table>
                          </div>
                        ) : title === 'Strategic Priorities (Q1 2025)' ? (
                          <div className="space-y-3">
                            {content.split('\n').filter(line => line.trim() && (line.trim().startsWith('🔴') || line.trim().startsWith('🟡') || line.trim().startsWith('🟢') || line.trim().startsWith('-'))).map((item, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border-l-4 border-slate-300">
                                <div className="text-slate-700 leading-relaxed">{item.replace(/^-\s*/, '').trim()}</div>
                              </div>
                            ))}
                          </div>
                        ) : title === 'Next Actions' && content.includes('|') ? (
                          <div className="overflow-x-auto">
                            <table className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-6 py-4 text-left font-semibold text-slate-800 border-b border-slate-200">Action</th>
                                  <th className="px-6 py-4 text-left font-semibold text-slate-800 border-b border-slate-200">Owner</th>
                                  <th className="px-6 py-4 text-left font-semibold text-slate-800 border-b border-slate-200">Due</th>
                                </tr>
                              </thead>
                              <tbody>
                                {content.split('\n').filter(line => 
                                  line.includes('|') && 
                                  !line.includes('---') && 
                                  !line.includes('Action') &&
                                  line.trim() !== ''
                                ).map((row, i) => {
                                  const parts = row.split('|')
                                  if (parts.length < 4) return null
                                  const action = parts[1]?.trim()
                                  const owner = parts[2]?.trim()
                                  const due = parts[3]?.trim()
                                  if (!action || !owner || !due) return null
                                  return (
                                    <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}>
                                      <td className="px-6 py-4 text-slate-900">{action}</td>
                                      <td className="px-6 py-4 text-slate-700 font-semibold">{owner}</td>
                                      <td className="px-6 py-4 text-slate-700 font-medium">{due}</td>
                                    </tr>
                                  )
                                }).filter(Boolean)}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div 
                            className="text-slate-700 whitespace-pre-line"
                            dangerouslySetInnerHTML={{
                              __html: content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* AI Attribution Footer */}
                <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-center">
                    <div className="text-sm text-slate-600 mb-2">
                      🧠 Generated by <span className="font-semibold">Claude 3 Sonnet</span> • via <span className="font-semibold">OpenRouter API</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Built with Claude Code — open to feedback from Partner Strategy Leaders!
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      #AI #Partnerships #GTM #PartnerStrategy
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <Brain className="w-12 h-12 text-purple-400 mx-auto" />
                  <p className="text-purple-600">Insights werden geladen...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 
      REMOVED: Static Strategic Priorities and Next Actions sections
      These are now fully AI-generated as part of the Claude insights for consistency
      All content (Executive Summary, Key Insights, Strategic Priorities, Business Impact, Next Actions) 
      is now generated by Claude 3 Sonnet with consistent tone and logic
      */}

      {/* 
      COMMENTED OUT FOR EXECUTIVE TEMPLATE - CAN BE RESTORED LATER
      
      Insights Section
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Key Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-sm">{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5" />
              Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <span className="text-sm">{challenge}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Target className="w-5 h-5" />
              Strategic Initiatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.initiatives.map((initiative, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span className="text-sm">{initiative}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      END OF COMMENTED INSIGHTS SECTION
      */}
        </div>
      ) : (
        // Analytics Dashboard Tab
        <div className="space-y-6">
          {/* KPI Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Revenue Attainment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.revenue.attainment}%</div>
                <div className="text-xs text-slate-500">Target: 100%</div>
                <div className="mt-2 text-xs">
                  <span className={metrics.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {metrics.revenue.growth > 0 ? '+' : ''}{metrics.revenue.growth}% QoQ
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Pipeline Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pipeline.coverage}%</div>
                <div className="text-xs text-slate-500">Target: 150%</div>
                <div className="mt-2 text-xs text-slate-600">
                  ${(metrics.pipeline.value / 1000).toFixed(0)}K pipeline
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">MDF Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.engagement.marketingFundUtilization}%</div>
                <div className="text-xs text-slate-500">Target: 80%</div>
                <div className="mt-2 text-xs text-slate-600">
                  Marketing fund usage
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Training Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.engagement.trainingCompletionRate}%</div>
                <div className="text-xs text-slate-500">Target: 90%</div>
                <div className="mt-2 text-xs text-slate-600">
                  {metrics.engagement.trainingsCompleted} completed
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Pipeline Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue & Pipeline Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Current Revenue</div>
                      <div className="text-lg font-semibold">${(metrics.revenue.current / 1000).toFixed(0)}K</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">YTD Revenue</div>
                      <div className="text-lg font-semibold">${(metrics.revenue.ytd / 1000).toFixed(0)}K</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Pipeline Value</div>
                      <div className="text-lg font-semibold">${(metrics.pipeline.value / 1000).toFixed(0)}K</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Avg Deal Size</div>
                      <div className="text-lg font-semibold">${(metrics.pipeline.avgDealSize / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-sm text-slate-600">
                      <div className="flex justify-between mb-1">
                        <span>Pipeline Conversion Rate:</span>
                        <span className="font-semibold">{metrics.pipeline.conversion}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue Target:</span>
                        <span className="font-semibold">${(metrics.revenue.target / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement & Training Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Partner Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Portal Logins (30d)</div>
                      <div className="text-lg font-semibold">{metrics.engagement.portalLogins}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Active Certifications</div>
                      <div className="text-lg font-semibold">{metrics.engagement.certificationsActive}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Event Participation</div>
                      <div className="text-lg font-semibold">{metrics.engagement.eventParticipation}%</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Last Activity</div>
                      <div className="text-sm font-semibold">{new Date(metrics.engagement.lastActivityDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-sm text-slate-600">
                      <div className="flex justify-between mb-1">
                        <span>Training Completion Rate:</span>
                        <span className="font-semibold">{metrics.engagement.trainingCompletionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>MDF Utilization:</span>
                        <span className="font-semibold">{metrics.engagement.marketingFundUtilization}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deal Registration & Delivery Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Deal Registration Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Submitted</span>
                      <span className="font-bold text-blue-700">{metrics.dealRegistration.submitted}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Approved</span>
                      <span className="font-bold text-green-700">{metrics.dealRegistration.approved}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium">Won</span>
                      <span className="font-bold text-purple-700">{metrics.dealRegistration.won}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">{metrics.dealRegistration.winRate}%</div>
                      <div className="text-xs text-slate-500">Overall Win Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Delivery & Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-2xl font-bold">{metrics.delivery.avgTimeToGoLive}</div>
                      <div className="text-xs text-slate-500">Avg Time to Go-Live (days)</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-2xl font-bold">{metrics.delivery.customerSatisfaction}</div>
                      <div className="text-xs text-slate-500">CSAT Score (/5)</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-sm text-slate-600">
                      <div className="flex justify-between mb-1">
                        <span>Support Tickets:</span>
                        <span className="font-semibold">{metrics.delivery.supportTickets}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escalations:</span>
                        <span className="font-semibold">{metrics.delivery.escalations}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Health Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium">Overall Health Score</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-2xl" style={{ color: getHealthColor(metrics.healthScore) }}>
                      {metrics.healthScore}
                    </span>
                    <span className="text-slate-500">/100</span>
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  <div className="flex justify-between mb-2">
                    <span>Risk Level:</span>
                    <span className={`font-semibold ${
                      metrics.riskLevel === 'Low' ? 'text-green-600' : 
                      metrics.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metrics.riskLevel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Health score calculated based on revenue performance, engagement metrics, customer satisfaction, and deal velocity.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}