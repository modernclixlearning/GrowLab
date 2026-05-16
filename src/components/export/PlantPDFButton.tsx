import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generatePlantPDF } from '@/lib/pdf/plant-report'
import { getApiErrorToastMessage } from '@/lib/api/errors'

interface PlantPDFButtonProps {
  plant: {
    id: string
    name: string
    strainName?: string | null
    strainType: string
    growthStage: string
    healthStatus?: string | null
    createdAt: string
  }
  careLogs?: Array<{
    id: string
    logType: string
    loggedAt: string
    amount?: string | null
    unit?: string | null
    notes?: string | null
  }>
  growthMeasurements?: Array<{
    id: string
    metric: string
    value: string
    recordedAt: string
  }>
}

export function PlantPDFButton({ plant, careLogs = [], growthMeasurements = [] }: PlantPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGeneratePDF = async () => {
    if (loading) return
    setLoading(true)
    try {
      await generatePlantPDF(plant, careLogs, growthMeasurements)
      toast.success('PDF downloaded')
    } catch (err) {
      toast.error(getApiErrorToastMessage(err, 'Failed to generate PDF'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGeneratePDF}
      disabled={loading}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg/60 text-fg-2 backdrop-blur transition-colors hover:bg-accent/20 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      aria-label="Download plant PDF report"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-5 w-5" />
      )}
    </button>
  )
}
