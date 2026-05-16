import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/stores/auth'
import { downloadExport } from '@/lib/api/export'
import { getApiErrorToastMessage } from '@/lib/api/errors'

export function ExportButton() {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!accessToken || loading) return
    setLoading(true)
    try {
      await downloadExport(accessToken)
      toast.success('Export downloaded successfully')
    } catch (err) {
      toast.error(getApiErrorToastMessage(err, 'Export failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-line bg-card px-4 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
      {loading ? 'Exporting…' : 'Export data'}
    </button>
  )
}
