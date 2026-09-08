import { useState } from 'react'
import './ResultPanel.css'

export default function ResultPanel({
  videoMeta,
  loading,
  progress,
  error,
  resultUrl,
  onDownloadFormat,
  onReset,
}) {
  const [selectedFormat, setSelectedFormat] = useState(null)

  const handleDownload = (format) => {
    setSelectedFormat(format)
    onDownloadFormat(format)
  }

  return (
    <div className="result-panel">
      {error && (
        <div className="error-bar" role="alert">
          <span className="material-icons-round">error_outline</span>
          <span>{error}</span>
        </div>
      )}

      <div className="video-info">
        {videoMeta?.thumbnail && (
          <div className="video-thumbnail">
            <img src={videoMeta.thumbnail} alt={videoMeta.title} />
          </div>
        )}
        <div className="video-details">
          <h2 className="video-title">{videoMeta?.title || 'Video'}</h2>
          {videoMeta?.duration && (
            <p className="video-duration">{videoMeta.duration}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="download-state">
          <span className="spinner" />
          <p>Preparing download...</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : resultUrl ? (
        <div className="download-success">
          <span className="material-icons-round" style={{ fontSize: '48px', color: '#16a34a' }}>
            check_circle
          </span>
          <p>Ready to download!</p>
          <a href={resultUrl} download className="btn-primary" style={{ marginTop: '12px' }}>
            <span className="material-icons-round">download</span>
            Download now
          </a>
        </div>
      ) : (
        <div className="format-selector">
          <p className="format-label">Select download format:</p>
          <div className="format-grid">
            {videoMeta?.formats?.map((fmt) => (
              <button
                key={fmt.id}
                className="format-btn"
                onClick={() => handleDownload(fmt.id)}
                disabled={loading || selectedFormat === fmt.id}
                type="button"
              >
                <div className="format-name">{fmt.format}</div>
                <div className="format-quality">{fmt.quality}</div>
                {selectedFormat === fmt.id && (
                  <div className="format-loading">
                    <span className="spinner small" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && resultUrl && (
        <button className="btn-ghost" onClick={onReset} type="button" style={{ marginTop: '16px' }}>
          <span className="material-icons-round">refresh</span>
          Download another video
        </button>
      )}
    </div>
  )
}

