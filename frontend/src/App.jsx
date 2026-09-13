import { useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import ResultPanel from './components/ResultPanel'
import Footer from './components/Footer'
import { useDownloader } from './hooks/useDownloader'
import './App.css'

export default function App() {
  const [videoUrl, setVideoUrl] = useState('')
  const [videoMeta, setVideoMeta] = useState(null)
  const [dark, setDark] = useState(() => localStorage.getItem('streamfetch-dark') === 'true' || (localStorage.getItem('streamfetch-dark') === null && window.matchMedia('(prefers-color-scheme: dark)').matches))
  const { loading, progress, error, resultUrl, download, reset, setError } = useDownloader()

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('streamfetch-dark', dark) }, [dark])

  const fetchInfo = useCallback(async (url) => {
    setVideoUrl(url); setVideoMeta(null); reset()
    try {
      const response = await fetch('/api/video-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Unable to load video information.')
      setVideoMeta(data)
    } catch (err) { setError(err.message) }
  }, [reset, setError])

  const handleReset = useCallback(() => { setVideoUrl(''); setVideoMeta(null); reset() }, [reset])
  const handleDownload = useCallback((format) => download(videoUrl, { format }), [download, videoUrl])

  return <div className="app">
    <Header dark={dark} onToggleDark={() => setDark((value) => !value)} />
    <main className="main">
      <div className="hero">
        <div><p className="eyebrow">Private · simple · fast</p><h1 className="hero-title">Download YouTube videos</h1><p className="hero-sub">Save public videos and audio in a format that works for you.</p></div>
        <div className="hero-badge"><span className="material-icons-round">bolt</span>Free to use</div>
      </div>
      <div className="workspace">
        <aside className="panel controls-panel">
          <div className="panel-section"><p className="label-sm">How it works</p><div className="steps"><div><span>1</span><p>Paste a YouTube link</p></div><div><span>2</span><p>Choose your quality</p></div><div><span>3</span><p>Download your file</p></div></div></div>
          <div className="divider" />
          <div className="panel-section"><p className="label-sm">Good to know</p><div className="side-note"><span className="material-icons-round">lock</span><p>Links are processed temporarily. Files are not stored after your download.</p></div></div>
          <div className="divider" />
          <div className="panel-section"><p className="idle-hint">Only download content you have permission to use.</p></div>
        </aside>
        <div className="workspace-right">
          {error && <div className="error-bar" role="alert"><span className="material-icons-round">error_outline</span><span>{error}</span><button onClick={() => setError(null)} aria-label="Dismiss error">×</button></div>}
          <section className="panel image-panel">{!videoMeta ? <UploadZone onUrlSubmit={fetchInfo} loading={loading} /> : <ResultPanel videoMeta={videoMeta} loading={loading} progress={progress} error={null} resultUrl={resultUrl} onDownloadFormat={handleDownload} onReset={handleReset} />}</section>
        </div>
      </div>
      <div className="feature-strip"><div><span className="material-icons-round">high_quality</span><p><strong>Multiple qualities</strong><br />From 480p to the best available</p></div><div><span className="material-icons-round">audio_file</span><p><strong>Video or audio</strong><br />Choose MP4 or audio-only M4A</p></div><div><span className="material-icons-round">memory</span><p><strong>Render friendly</strong><br />Optimized for a small free server</p></div></div>
    </main>
    <Footer />
  </div>
}
