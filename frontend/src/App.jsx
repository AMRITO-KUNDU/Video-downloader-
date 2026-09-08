import { useState, useCallback, useEffect } from 'react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import ResultPanel from './components/ResultPanel'
import Footer from './components/Footer'
import { useDownloader } from './hooks/useDownloader'
import './App.css'

export default function App() {
  const [videoUrl, setVideoUrl] = useState('')
  const [videoMeta, setVideoMeta] = useState(null)
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('video-downloader-dark')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const { loading, progress, error, resultUrl, download, reset, setError } = useDownloader()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('video-downloader-dark', dark)
  }, [dark])

  const handleUrlSubmit = useCallback(
    async (url) => {
      const trimmed = url.trim()
      if (!trimmed) return

      setVideoUrl(trimmed)
      setVideoMeta(null)
      reset()

      try {
        const res = await fetch('/api/video-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.detail || 'Failed to fetch video info')
        }

        const meta = await res.json()
        setVideoMeta(meta)
      } catch (e) {
        setError(e.message || 'Unable to load video information')
      }
    },
    [reset, setError]
  )

  const handleDownloadFormat = useCallback(
    async (format) => {
      if (!videoUrl) return
      await download(videoUrl, { format })
    },
    [videoUrl, download]
  )

  const handleReset = useCallback(() => {
    setVideoUrl('')
    setVideoMeta(null)
    reset()
  }, [reset])

  return (
    <div className="app">
      <Header dark={dark} onToggleDark={() => setDark((d) => !d)} />

      <main className="main">
        <div className="hero">
          <h1 className="hero-title">Download YouTube videos</h1>
          <p className="hero-sub">
            Paste a YouTube link, pick your format, and download instantly.
          </p>
        </div>

        <div className="workspace">
          <section className="panel image-panel">
            {!videoMeta ? (
              <UploadZone onUrlSubmit={handleUrlSubmit} loading={loading} />
            ) : (
              <ResultPanel
                videoMeta={videoMeta}
                loading={loading}
                progress={progress}
                error={error}
                resultUrl={resultUrl}
                onDownloadFormat={handleDownloadFormat}
                onReset={handleReset}
              />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
