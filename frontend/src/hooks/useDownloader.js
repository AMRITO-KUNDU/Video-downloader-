/**
 * Unified hook for:
 * - browser upload
 * - direct download API
 * - alternative video source routes
 */
import { useState, useCallback } from 'react'
import { downloadVideoClient, CLIENT_MODEL_ID } from '../lib/clientSideDownloader'
import { downloadVideoApi } from '../lib/serverApi'

export function useDownloader() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)

  const download = useCallback(async (source, { model, bestQuality = true } = {}) => {
    if (!source) return null

    setLoading(true)
    setError(null)
    setProgress(0)
    setResultUrl(null)

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 10, 88))
    }, 400)

    try {
      let blob

      if (model === CLIENT_MODEL_ID || model === 'browser') {
        blob = await downloadVideoClient(source)
      } else {
        blob = await downloadVideoApi(source, {
          quality: bestQuality ? 'best' : 'medium',
          model,
        })
      }

      const url = URL.createObjectURL(blob)
      setResultUrl(url)
      setProgress(100)
      return url
    } catch (e) {
      setError(e.message || 'Something went wrong while downloading the video.')
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
