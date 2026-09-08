/**
 * Hook for downloading YouTube videos in selected format.
 */
import { useState, useCallback } from 'react'

export function useDownloader() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)

  const download = useCallback(async (videoUrl, { format = 'best' } = {}) => {
    if (!videoUrl) return null

    setLoading(true)
    setError(null)
    setProgress(0)
    setResultUrl(null)

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 10, 88))
    }, 400)

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl, format }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Download failed')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
      setProgress(100)
      return url
    } catch (e) {
      setError(e.message || 'Something went wrong')
      return null
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setProgress(0)
    setError(null)
    setResultUrl(null)
  }, [])

  return { loading, progress, error, resultUrl, download, reset, setError }
}

