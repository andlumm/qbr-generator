'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  Database, 
  TrendingUp, 
  Users, 
  Target,
  ChevronDown,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react'

interface MetricAuditTrailProps {
  partnerId: string
  metricName: string
  metricValue: number | string
  quarter?: string
}

export function MetricAuditTrail({ 
  partnerId, 
  metricName, 
  metricValue, 
  quarter = 'Q4 2024' 
}: MetricAuditTrailProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [auditData, setAuditData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleExpandClick = async () => {
    if (!isExpanded && !auditData) {
      setIsLoading(true)
      try {
        // Extract partner ID from full partner ID (remove 'partner-' prefix)
        const id = partnerId.replace('partner-', '')
        const response = await fetch(`/api/partners/${id}/audit?metric=${metricName}&quarter=${encodeURIComponent(quarter)}`)
        const result = await response.json()
        
        if (result.success) {
          setAuditData(result.data)
        } else {
          console.error('Failed to fetch audit trail:', result.error)
        }
      } catch (error) {
        console.error('Failed to load audit trail:', error)
      } finally {
        setIsLoading(false)
      }
    }
    setIsExpanded(!isExpanded)
  }

  const getMetricIcon = () => {
    switch (metricName) {
      case 'revenue_growth': return <TrendingUp className="w-4 h-4" />
      case 'training_completion': return <Users className="w-4 h-4" />
      case 'health_score': return <Target className="w-4 h-4" />
      default: return <Calculator className="w-4 h-4" />
    }
  }

  const getMetricDisplayName = () => {
    switch (metricName) {
      case 'revenue_growth': return 'Revenue Growth'
      case 'training_completion': return 'Training Completion Rate'
      case 'health_score': return 'Health Score'
      default: return metricName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getMetricIcon()}
            <div>
              <CardTitle className="text-lg font-medium">
                {getMetricDisplayName()}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="font-mono">
                  {typeof metricValue === 'number' ? 
                    metricName.includes('rate') || metricName.includes('growth') ? 
                      `${metricValue}%` : metricValue
                    : metricValue
                  }
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Calculated
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpandClick}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            ) : isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Eye className="w-4 h-4" />
            Audit Trail
          </Button>
        </div>
      </CardHeader>

      {isExpanded && auditData && (
        <CardContent className="pt-0 border-t">
          <div className="space-y-4">
            {/* Calculation Formula */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-sm">Calculation Method</h4>
              </div>
              <code className="text-sm text-slate-700 bg-white px-2 py-1 rounded">
                {auditData.calculation}
              </code>
            </div>

            {/* Health Score Components */}
            {auditData.components && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-sm">Weighted Components</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(auditData.components).map(([component, weight]) => (
                    <div key={component} className="flex justify-between text-sm">
                      <span className="capitalize">{component.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <Badge variant="outline" className="text-xs">{weight}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training Details */}
            {auditData.sourceData?.courses && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-sm">Training Breakdown</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Required Courses:</span>
                    <span>{auditData.sourceData.totalRequired}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Completed:</span>
                    <span className="text-green-600">{auditData.sourceData.completed}</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {auditData.sourceData.courses.map((course: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span>{course.name}</span>
                        <Badge 
                          variant={course.completed ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {course.completed ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Source Data Summary */}
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-sm">Source Data</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(auditData.sourceData).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="font-mono text-amber-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Timestamp */}
            <div className="flex items-center gap-2 text-xs text-slate-500 border-t pt-3">
              <Info className="w-3 h-3" />
              <span>Calculated from source data • Updated in real-time</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}