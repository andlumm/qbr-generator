'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateDummyPartners, generateDummyMetrics } from '@/lib/dummy-data'
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, 
  BarChart3, Users, Target, Calendar, ArrowRight,
  Sparkles, Clock, FileText, Brain
} from 'lucide-react'

export default function HomePage() {
  const [partners, setPartners] = useState(generateDummyPartners(8))
  const [metrics, setMetrics] = useState(generateDummyMetrics(partners))

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getRiskIcon = (level: string) => {
    switch(level) {
      case 'Low': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'Medium': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'High': return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container mx-auto px-4 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Partner Success Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Transform Your QBRs from
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Hours to Minutes</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Generate comprehensive, data-driven Quarterly Business Reviews with AI. 
              Save 90% of preparation time while delivering insights that drive partner growth.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium">4+ hours → 30 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-medium">AI-Generated Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-medium">One-Click Reports</span>
              </div>
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
              See Live Demo <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12">Partner Health Dashboard</h2>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Total Partners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{partners.length}</div>
                <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12% QoQ</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Pipeline Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(metrics.reduce((acc, m) => acc + m.pipeline.coverage, 0) / metrics.length)}%
                </div>
                <div className="text-sm text-slate-600 mt-1">Target: 100%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Deal Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(metrics.reduce((acc, m) => acc + m.dealRegistration.winRate, 0) / metrics.length)}%
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Industry avg: 25%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Avg CSAT Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(metrics.reduce((acc, m) => acc + m.delivery.customerSatisfaction, 0) / metrics.length).toFixed(1)}
                </div>
                <div className="text-sm text-slate-600 mt-1">out of 5.0</div>
              </CardContent>
            </Card>
          </div>

          {/* Partner List */}
          <Card>
            <CardHeader>
              <CardTitle>Partner Performance Overview</CardTitle>
              <CardDescription>Click any partner to generate instant QBR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Partner</th>
                      <th className="text-left py-3 px-4">Tier</th>
                      <th className="text-left py-3 px-4">Revenue</th>
                      <th className="text-left py-3 px-4">Growth</th>
                      <th className="text-left py-3 px-4">Health</th>
                      <th className="text-left py-3 px-4">Risk</th>
                      <th className="text-left py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner, index) => {
                      const metric = metrics[index]
                      return (
                        <motion.tr 
                          key={partner.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{partner.name}</div>
                              <div className="text-sm text-slate-600">{partner.region}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              partner.tier === 'Strategic' ? 'bg-purple-100 text-purple-700' :
                              partner.tier === 'Select' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {partner.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            ${(metric.revenue.current / 1000).toFixed(0)}K
                          </td>
                          <td className="py-3 px-4">
                            <div className={`flex items-center gap-1 ${
                              metric.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {metric.revenue.growth > 0 ? 
                                <TrendingUp className="w-4 h-4" /> : 
                                <TrendingDown className="w-4 h-4" />
                              }
                              {Math.abs(metric.revenue.growth)}%
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className={`font-medium ${getHealthColor(metric.healthScore)}`}>
                              {metric.healthScore}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              {getRiskIcon(metric.riskLevel)}
                              <span className="text-sm">{metric.riskLevel}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <a href={`/partner/${index + 1}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                              Generate QBR →
                            </a>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Partner Teams Choose QBR Navigator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-blue-600 mb-4" />
              <CardTitle>Data-Driven Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Automatically aggregate data from CRM, PRM, and engagement platforms. 
                AI identifies trends, risks, and opportunities you might miss.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="w-10 h-10 text-purple-600 mb-4" />
              <CardTitle>AI-Generated Narratives</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Transform raw data into compelling executive summaries, action plans, 
                and strategic recommendations tailored to each partner.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="w-10 h-10 text-green-600 mb-4" />
              <CardTitle>Actionable Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Move beyond reporting to strategic conversations. Focus on growth 
                opportunities and partnership optimization.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
