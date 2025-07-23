'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Partner, PartnerMetrics } from '@/lib/dummy-data'
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
  Brain, Loader2
} from 'lucide-react'

interface QBRDashboardProps {
  partner: Partner
  metrics: PartnerMetrics
  allPartnerMetrics?: PartnerMetrics[]
}

export const QBRDashboard = ({ partner, metrics, allPartnerMetrics }: QBRDashboardProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('quarter')
  const [aiInsights, setAiInsights] = useState<string>('')
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)

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
        body: JSON.stringify({ partner, metrics, allPartnerMetrics })
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.success) {
        setAiInsights(data.insights)
      } else {
        console.error('Failed to generate insights:', data.error)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
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
      {/* Partnership Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{partner.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <div className="text-slate-600 font-medium">Partner Tier</div>
              <div className="text-lg font-semibold">{partner.tier}</div>
            </div>
            <div>
              <div className="text-slate-600 font-medium">Region</div>
              <div className="text-lg font-semibold">{partner.region}</div>
            </div>
            <div>
              <div className="text-slate-600 font-medium">Health Score</div>
              <div className="text-lg font-semibold" style={{ color: getHealthColor(metrics.healthScore) }}>
                {metrics.healthScore}/100
              </div>
            </div>
            <div>
              <div className="text-slate-600 font-medium">Quarter</div>
              <div className="text-lg font-semibold">{metrics.quarter}</div>
            </div>
            <div>
              <div className="text-slate-600 font-medium">Current Revenue</div>
              <div className="text-lg font-semibold">${(metrics.revenue.current / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <div className="text-slate-600 font-medium">Growth Rate</div>
              <div className="text-lg font-semibold" style={{ color: metrics.revenue.growth > 0 ? '#10b981' : '#ef4444' }}>
                {metrics.revenue.growth > 0 ? '+' : ''}{metrics.revenue.growth.toFixed(1)}% QoQ
              </div>
            </div>
            <div>
              <div className="text-slate-600 font-medium">Pipeline Value</div>
              <div className="text-lg font-semibold">${(metrics.pipeline.value / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <div className="text-slate-600 font-medium">Risk Level</div>
              <div className="text-lg font-semibold" style={{ 
                color: metrics.riskLevel === 'Low' ? '#10b981' : metrics.riskLevel === 'Medium' ? '#f59e0b' : '#ef4444' 
              }}>
                {metrics.riskLevel}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* AI Insights Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-xl blur-xl"></div>
        <Card className="relative border-2 border-purple-200/50 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-purple-900">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">AI-Strategische Insights</div>
                  <div className="text-sm text-purple-600 font-normal">Powered by Claude 3 Sonnet</div>
                </div>
              </CardTitle>
              {isLoadingInsights && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-purple-600">Analysiere...</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingInsights ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-purple-800">Generiere strategische Insights</p>
                  <p className="text-sm text-purple-600">Claude 3 analysiert Partnerdaten...</p>
                </div>
              </div>
            ) : aiInsights ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-6">
                  {aiInsights.split('## ').filter(section => section.trim()).map((section, index) => {
                    const lines = section.trim().split('\n').filter(line => line.trim())
                    const title = lines[0]
                    const content = lines.slice(1).join('\n')
                    
                    return (
                      <div key={index}>
                        <div className="bg-slate-100 border-l-4 border-slate-600 p-4 mb-4">
                          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                        </div>
                        
                        {title === 'Key Insights' && content.includes('|') ? (
                          <div className="mb-6">
                            <table className="w-full bg-white border border-gray-300 rounded-lg">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b w-1/4">Category</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b">Metric/Statement</th>
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
                                    <tr key={i} className="border-b border-gray-200">
                                      <td className="px-4 py-3 text-slate-900 font-medium align-top">{cat}</td>
                                      <td className="px-4 py-3 text-slate-700">{desc}</td>
                                    </tr>
                                  )
                                }).filter(Boolean)}
                              </tbody>
                            </table>
                          </div>
                        ) : title === 'Business Impact Forecast' && content.includes('|') ? (
                          <div className="mb-6">
                            <table className="w-full bg-white border border-gray-300 rounded-lg">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b">Lever</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b">Potential ARR</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b">Risk ARR</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b">Investment</th>
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
                                  const hebel = parts[1]?.trim()
                                  const potenzial = parts[2]?.trim()
                                  const risiko = parts[3]?.trim()
                                  const invest = parts[4]?.trim()
                                  if (!hebel || !potenzial || !risiko || !invest) return null
                                  return (
                                    <tr key={i} className="border-b border-gray-200">
                                      <td className="px-4 py-3 text-slate-900 font-medium">{hebel}</td>
                                      <td className="px-4 py-3 text-slate-700">{potenzial}</td>
                                      <td className="px-4 py-3 text-slate-700">{risiko}</td>
                                      <td className="px-4 py-3 text-slate-900 font-medium">{invest}</td>
                                    </tr>
                                  )
                                }).filter(Boolean)}
                              </tbody>
                            </table>
                          </div>
                        ) : title === 'Priority Action Items' ? (
                          <div className="space-y-2">
                            {content.split('\n').filter(line => line.trim().startsWith('-')).map((item, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-slate-700">{item.replace(/^-\s*/, '')}</span>
                              </div>
                            ))}
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
                <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-center text-sm text-slate-600">
                    Generated by <span className="font-medium">Claude 3 Sonnet</span> • via <span className="font-medium">OpenRouter API</span>
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
      </div>

      {/* Strategic Priorities (Q1) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Strategic Priorities (Q1 2025)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(() => {
              const priorities = []
              
              // Determine priorities based on metrics
              if (metrics.healthScore < 75) {
                priorities.push({ emoji: '🔥', type: 'Health Recovery', desc: 'Urgent health score remediation required' })
              }
              if (metrics.delivery.customerSatisfaction < 4.5) {
                priorities.push({ emoji: '🔥', type: 'CSAT Recovery', desc: 'Customer satisfaction below target (4.5)' })
              }
              if (metrics.revenue.growth > 15) {
                priorities.push({ emoji: '🟢', type: 'Expansion', desc: 'Capitalize on strong growth momentum' })
              }
              if (metrics.dealRegistration.winRate < 30) {
                priorities.push({ emoji: '🟡', type: 'Win Rate Coaching', desc: 'Pipeline conversion needs improvement' })
              }
              if (metrics.engagement.trainingCompletionRate < 85) {
                priorities.push({ emoji: '🟡', type: 'Enablement Focus', desc: 'Training completion below benchmark' })
              }
              if (priorities.length === 0) {
                priorities.push({ emoji: '🟢', type: 'Performance Optimization', desc: 'Focus on continuous improvement' })
              }
              
              return priorities.slice(0, 3).map((priority, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-xl">{priority.emoji}</span>
                  <div>
                    <div className="font-semibold">{priority.type}</div>
                    <div className="text-sm text-slate-600">{priority.desc}</div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Next Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Next Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(() => {
              const actions = []
              
              if (metrics.healthScore < 75) {
                actions.push({ 
                  action: 'Schedule health assessment call with partner leadership',
                  owner: partner.partnerManager,
                  eta: 'End of Week'
                })
              }
              if (metrics.engagement.trainingCompletionRate < 85) {
                actions.push({
                  action: 'Enroll partner in accelerated enablement program',
                  owner: 'Enablement Team',
                  eta: 'Next Monday'
                })
              }
              if (metrics.dealRegistration.winRate < 30) {
                actions.push({
                  action: 'Implement weekly sales coaching sessions',
                  owner: partner.accountManager,
                  eta: 'This Week'
                })
              }
              
              // Ensure we always have at least one action
              if (actions.length === 0) {
                actions.push({
                  action: 'Schedule quarterly business review meeting',
                  owner: partner.partnerManager,
                  eta: 'Next Week'
                })
              }
              
              return actions.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between items-start p-3 border border-slate-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.action}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      <span className="font-medium">Owner:</span> {item.owner} • <span className="font-medium">ETA:</span> {item.eta}
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </CardContent>
      </Card>

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
  )
}