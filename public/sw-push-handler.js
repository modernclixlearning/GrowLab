self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try {
    data = event.data.json()
  } catch {
    return
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'GrowLab', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.data ?? {},
      tag: data.data?.notificationId,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const d = event.notification.data ?? {}
  let url = '/'
  if (d.referenceType === 'plant' && d.referenceId) {
    url = `/plants/${d.referenceId}`
  } else if (d.referenceType === 'tent' || d.referenceType === 'care_log') {
    url = '/dashboard'
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
