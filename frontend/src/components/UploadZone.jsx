import { useCallback, useState } from 'react'
import './UploadZone.css'

export default function UploadZone({ onUrlSubmit, loading }) {
  const [url, setUrl] = useState('')

  const submitUrl = useCallback((e) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    onUrlSubmit?.(trimmed)
    setUrl('')
  }, [onUrlSubmit, url])

  return (
    <div className="upload-zone">
      <div className="upload-inner">
        <div className="upload-icon-wrap">
          <span className="material-icons-round upload-icon">play_circle</span>
        </div>
        <p className="upload-title">Paste a YouTube link</p>
        <p className="upload-hint">Enter a YouTube URL to see available download formats</p>

        <form className="url-form" onSubmit={submitUrl}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            aria-label="YouTube video URL"
            disabled={loading}
          />
          <button type="submit" className="btn-primary url-submit" disabled={loading}>
            {loading ? 'Fetching...' : 'Fetch'}
          </button>
        </form>
      </div>
    </div>
  )
}

