/**
 * Calls the Vercel serverless route for video downloads.
 * POST /api/download
 */

export async function downloadVideoApi(source, { quality = 'best', model = 'download-api' } = {}) {
  const fd = new FormData()

  if (source instanceof File || source instanceof Blob) {
    fd.append('file', source, source.name || 'video.mp4')
  } else if (typeof source === 'string' && source.trim()) {
    fd.append('url', source.trim())
    fd.append('quality', quality)
    fd.append('model', model)
  } else {
    throw new Error('No video source provided.')
  }

  const res = await fetch('/api/download', {
    method: 'POST',
    body: fd,
  })

  if (!res.ok) {
    let detail = 'Video download failed'
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch {
      // ignore
    }
    throw new Error(detail)
  }

  return await res.blob()
}

export const DOWNLOAD_MODEL = {
  id: 'download-api',
  name: 'Direct download API',
  badge: 'Cloud',
  description: 'Fastest route for public video links and direct media URLs',
  icon: 'cloud',
  enabled: true,
}

export const REMOVE_BG_MODEL = DOWNLOAD_MODEL
