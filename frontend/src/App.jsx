import { useState, useCallback, useEffect } from 'react'
import Header from './components/Header'
import ModelSelector from './components/ModelSelector'
import UploadZone from './components/UploadZone'
import ResultPanel from './components/ResultPanel'
import Footer from './components/Footer'
import { CLIENT_MODEL_ID, CLIENT_MODEL_INFO } from './lib/clientSideDownloader'
import { DOWNLOAD_MODEL } from './lib/serverApi'
import { useDownloader } from './hooks/useDownloader'
import './App.css'

const MODEL_STATS = {
  [CLIENT_MODEL_ID]: { speed: 94, quality: 82 },
  'download-api': { speed: 92, quality: 100 },
  'yt-dlp': { speed: 76, quality: 89 },
  'audio-only': { speed: 86, quality: 68 },
}

function QualityToggle({ value, onChange }) {
  return (
    <label className="toggle-row">
      <span
        className={`toggle-switch ${value ? 'on' : ''}`}
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        tabIndex={0}
        onKeyDown={(e) => e.key === ' ' && onChange(!value)}
      >
        <span className="toggle-knob" />
      </span>
      <span className="toggle-label">
        Best quality
        <span className="toggle-hint">Prioritize the highest available resolution</span>
      </span>
    </label>
  )
}

function buildModelList() {
  return [CLIENT_MODEL_INFO, { ...DOWNLOAD_MODEL }]
}

export default function App() {
  const [models, setModels] = useState(buildModelList)
  const [selectedModel, setSelectedModel] = useState(DOWNLOAD_MODEL.id)
  const [bestQuality, setBestQuality] = useState(true)
  const [videoUrl, setVideoUrl] = useState('')
  const [sourceUrl, setSourceUrl] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
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

  useEffect(() => {
    setModels(buildModelList())
  }, [])

  const handleModelSelect = useCallback(
    (id) => {
      const m = models.find((x) => x.id === id)
      if (m?.enabled === false) {
        setError(m.disabledReason || 'This mode is currently unavailable.')
        return
      }
      setSelectedModel(id)
      setError(null)
    },
    [models, setError]
  )

  const handleFileSelect = useCallback(
    (file) => {
      setOriginalFile(file)
      setVideoUrl(file.name)
      setSourceUrl(URL.createObjectURL(file))
      reset()
    },
    [reset]
  )

  const handleUrlSubmit = useCallback(
    (url) => {
      const nextUrl = url.trim()
      if (!nextUrl) return
      setOriginalFile(null)
      setVideoUrl(nextUrl)
      setSourceUrl(nextUrl)
      reset()
    },
    [reset]
  )

  const handleDownloadVideo = useCallback(async () => {
    if (!videoUrl && !originalFile) return
    const source = originalFile ?? videoUrl
    await download(source, { model: selectedModel, bestQuality })
  }, [videoUrl, originalFile, selectedModel, bestQuality, download])

  const handleReset = useCallback(() => {
    setOriginalFile(null)
    setVideoUrl('')
    setSourceUrl(null)
    reset()
  }, [reset])

  const currentModel = models.find((m) => m.id === selectedModel)

  return (
    <div className="app">
      <Header dark={dark} onToggleDark={() => setDark((d) => !d)} />

      <main className="main">
        <div className="hero">
          <h1 className="hero-title">Download videos in seconds</h1>
          <p className="hero-sub">
            Paste a link or drop a file, then fetch the highest-quality version in a few clicks.
          </p>
        </div>

        <div className="workspace">
          <aside className="panel controls-panel">
            <div className="panel-section">
              <p className="label-sm">Download mode</p>
              <ModelSelector
                models={models}
                selected={selectedModel}
                onSelect={handleModelSelect}
              />
            </div>

            <div className="divider" />

            <div className="panel-section">
              <p className="label-sm">Options</p>
              <QualityToggle value={bestQuality} onChange={setBestQuality} />
            </div>

            <div className="divider" />

            <div className="panel-section">
              {(videoUrl || originalFile) && !loading && (
                <button className="btn-primary run-btn" onClick={handleDownloadVideo}>
                  <span className="material-icons-round">download</span>
                  Download video
                </button>
              )}
              {!videoUrl && !originalFile && (
                <p className="idle-hint">Paste a video URL or upload a file to get started.</p>
              )}
            </div>

            {loading && (
              <div className="panel-section progress-area">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="progress-text">
                  Downloading with {currentModel?.name}…
                </p>
              </div>
            )}
          </aside>

          <div className="workspace-right">
            {error && (
              <div className="error-bar" role="alert">
                <span className="material-icons-round">error_outline</span>
                <span>{error}</span>
              </div>
            )}

            <section className="panel image-panel">
              {!sourceUrl ? (
                <UploadZone onFileSelect={handleFileSelect} onUrlSubmit={handleUrlSubmit} />
              ) : (
                <ResultPanel
                  originalUrl={sourceUrl}
                  resultUrl={resultUrl}
                  loading={loading}
                  onReset={handleReset}
                  fileName={originalFile?.name || 'video-download'}
                />
              )}
            </section>
          </div>
        </div>

        <div className="model-strip">
          <h2 className="strip-title">Available download modes</h2>
          <div className="model-cards">
            {models
              .filter((m) => m.enabled !== false)
              .map((m) => {
                const s = MODEL_STATS[m.id]
                if (!s) return null
                const badgeClass =
                  m.badge === 'Cloud' ? 'cloud' : m.badge === 'Heavy' ? 'heavy' : 'local'
                return (
                  <div key={m.id} className="model-card">
                    <div className="model-card-header">
                      <span className="model-card-name">{m.name}</span>
                      <span className={`badge badge-${badgeClass}`}>{m.badge}</span>
                    </div>
                    <p className="model-card-desc">{m.description}</p>
                    <div className="model-bars">
                      <div className="bar-row">
                        <span className="bar-label">Speed</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${s.speed}%` }} />
                        </div>
                      </div>
                      <div className="bar-row">
                        <span className="bar-label">Quality</span>
                        <div className="bar-track">
                          <div className="bar-fill bar-fill-alt" style={{ width: `${s.quality}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
