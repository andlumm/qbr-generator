'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateDummyPartners, generateDummyMetrics, Partner, PartnerMetrics } from '@/lib/dummy-data'
import { QBRDashboard } from '@/components/dashboard/QBRDashboard'
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, 
  BarChart3, Users, Target, Calendar, ArrowLeft,
  Download, Mail, Sparkles, Loader2
} from 'lucide-react'

export default function PartnerQBRPage() {
  const params = useParams()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [metrics, setMetrics] = useState<PartnerMetrics | null>(null)
  const [allPartnerMetrics, setAllPartnerMetrics] = useState<PartnerMetrics[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [qbrContent, setQbrContent] = useState<string>('')

  useEffect(() => {
    // Load all partner data for ecosystem benchmarks
    const partners = generateDummyPartners(8)
    const allMetrics = generateDummyMetrics(partners)
    setAllPartnerMetrics(allMetrics)
    
    // Find specific partner
    const partnerData = partners.find(p => p.id === `partner-${params.id}`)
    if (partnerData) {
      setPartner(partnerData)
      const metricsData = allMetrics.find(m => m.partnerId === partnerData.id)
      if (metricsData) {
        setMetrics(metricsData)
      }
    }
  }, [params.id])

  const generateQBR = async () => {
    setIsGenerating(true)
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Set flag to show dashboard
    setQbrContent('dashboard')
    setIsGenerating(false)
  }

  if (!partner || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-center text-slate-600">Loading partner data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              <Mail className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* 
        REMOVED: Partner Info Card - Now handled by QBRDashboard Partnership Overview section
        This eliminates the duplicate header issue 
        */}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                metrics.healthScore >= 85 ? 'text-green-500' :
                metrics.healthScore >= 70 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {metrics.healthScore}
              </div>
              <div className="text-sm text-slate-600 mt-1">Target: 85</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Q4 Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(metrics.revenue.current / 1000).toFixed(0)}K</div>
              <div className={`flex items-center gap-1 text-sm mt-1 ${
                metrics.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.revenue.growth > 0 ? 
                  <TrendingUp className="w-4 h-4" /> : 
                  <TrendingDown className="w-4 h-4" />
                }
                {Math.abs(metrics.revenue.growth)}% QoQ
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(metrics.pipeline.value / 1000).toFixed(0)}K</div>
              <div className="text-sm text-slate-600 mt-1">{metrics.pipeline.count} opportunities</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Risk Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {metrics.riskLevel === 'Low' && <CheckCircle className="w-8 h-8 text-green-500" />}
                {metrics.riskLevel === 'Medium' && <AlertCircle className="w-8 h-8 text-yellow-500" />}
                {metrics.riskLevel === 'High' && <AlertCircle className="w-8 h-8 text-red-500" />}
                <span className="text-2xl font-bold">{metrics.riskLevel}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QBR Generation */}
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Business Review Generator</CardTitle>
            <CardDescription>
              Generate a comprehensive QBR report with AI-powered insights and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!qbrContent ? (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Generate QBR</h3>
                <p className="text-slate-600 mb-6">
                  Our AI will analyze all partner data and create a comprehensive QBR in seconds
                </p>
                <button
                  onClick={generateQBR}
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
            ) : qbrContent === 'dashboard' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <QBRDashboard partner={partner} metrics={metrics} allPartnerMetrics={allPartnerMetrics} />
              </motion.div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}