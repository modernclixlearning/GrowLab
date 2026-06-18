/** Converts an image File to WebP using the canvas API.
 *  Falls back to the original if WebP encoding is unavailable (e.g. old Safari, test env). */
export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
  if (file.type === 'image/webp') return file

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const webpName = file.name.replace(/\.[^.]+$/, '') + '.webp'
          resolve(new File([blob], webpName, { type: 'image/webp' }))
        },
        'image/webp',
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}
