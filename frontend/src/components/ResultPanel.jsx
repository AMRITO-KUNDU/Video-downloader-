import { useState } from 'react'
import './ResultPanel.css'

const FORMAT_PRESETS = [
  { id: 'mp4', label: 'MP4' },
  { id: 'webm', label: 'WebM' },
  { id: 'm4a', label: 'Audio' },
]

export default function ResultPanel({ originalUrl, resultUrl, loading, onReset, fileName }) {
  const [view, setView] = useState('compare')
  const [sliderPos, setSliderPos] = useState(50)
  const [format, setFormat] = useState('mp4')

  const handleDownload = () => {
    if (!resultUrl) return
    const base = fileName?.replace(/\.[^/.]+$/, '') ?? 'video'
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `${base}.${format}`
    a.click()
  }

  return (
    <div className="result-panel">
      <div className="result-tabs">
        {[
          { id: 'compare', label: 'Compare', icon: 'compare' },
          { id: 'result', label: 'Result', icon: 'movie' },
          { id: 'original', label: 'Original', icon: 'videocam' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${view === t.id ? 'active' : ''}`}
            onClick={() => setView(t.id)}
            type="button"
          >
            <span className="material-icons-round">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="result-viewport">
        {loading ? (
          <div className="viewport-state">
            <span className="spinner" />
            <span className="state-text">Fetching video…</span>
          </div>
        ) : (
          <>
            {view === 'compare' && (
              <div className="slider-root">
                <video src={originalUrl} controls className="slider-layer" />

                <div
                  className="slider-fg"
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                  <video
                    src={resultUrl || originalUrl}
                    controls
                    className="slider-layer"
                  />
                </div>

                <div className="slider-line" style={{ left: `${sliderPos}%` }}>
                  <div className="slider-handle">
                    <span className="material-icons-round">unfold_more</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="slider-input"
                  aria-label="Compare slider"
                />

                <span className="layer-label label-left">Before</span>
                <span className="layer-label label-right">After</span>
              </div>
            )}

            {view === 'result' && (
              <div className="single-view">
                {resultUrl ? (
                  <video src={resultUrl} controls className="preview-img" />
                ) : (
                  <div className="viewport-state">
                    <span className="material-icons-round state-icon">movie</span>
                    <span className="state-text">Result will appear here</span>
                  </div>
                )}
              </div>
            )}

            {view === 'original' && (
              <div className="single-view">
                <video src={originalUrl} controls className="preview-img" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="result-footer">
        <div className="bg-picker">
          <span className="label-sm">Format</span>
          <div className="bg-dots">
            {FORMAT_PRESETS.map((p) => (
              <button
                key={p.id}
                className={`bg-dot ${format === p.id ? 'active' : ''}`}
                onClick={() => setFormat(p.id)}
                title={p.label}
                type="button"
                aria-label={`Format: ${p.label}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="result-actions">
          <button className="btn-ghost" onClick={onReset} type="button">
            <span className="material-icons-round">refresh</span>
            New video
          </button>
          {resultUrl && (
            <button className="btn-primary" onClick={handleDownload} type="button">
              <span className="material-icons-round">download</span>
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
