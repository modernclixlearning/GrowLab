interface ExportParams {
  sensorFrom?: string
  sensorTo?: string
  deviceId?: string
}

export async function downloadExport(accessToken: string, params?: ExportParams): Promise<void> {
  const qs = new URLSearchParams()
  if (params?.sensorFrom) qs.set('sensorFrom', params.sensorFrom)
  if (params?.sensorTo) qs.set('sensorTo', params.sensorTo)
  if (params?.deviceId) qs.set('deviceId', params.deviceId)

  const url = `/api/export${qs.toString() ? `?${qs}` : ''}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Export failed')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  const dateStr = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = `growlab-export-${dateStr}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}
