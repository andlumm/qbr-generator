import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function PartnerLoading() {
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