import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red'
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon,
  color = 'blue' 
}: MetricCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  }

  const getTrendIcon = () => {
    if (!change) return null
    if (change > 0) return <TrendingUp className="w-4 h-4" />
    if (change < 0) return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (!change) return 'text-gray-500'
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 p-6 ${colorClasses[color]} backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-gray-600">• {changeLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-white/50">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}