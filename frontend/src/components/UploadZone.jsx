import { useCallback, useState } from 'react'
import './UploadZone.css'

export default function UploadZone({ onFileSelect, onUrlSubmit }) {
  const [dragging, setDragging] = useState(false)
  const [url, setUrl] = useState('')

  const handleFile = useCallback((file) => {
    if (!file) return
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/mpeg', 'video/ogg']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|mkv|mpeg|ogg)$/i)) {
      alert('Please upload a valid video file. Supported formats: MP4, MOV, WebM, MKV, MPEG, OGG.')
      return
    }
    if (file.size > 250 * 1024 * 1024) {
      alert('File too large. Maximum size is 250 MB.')
      return
    }
    onFileSelect(file)
  }, [onFileSelect])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }, [handleFile])

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragging(true) }, [])
  const handleDragLeave = useCallback(() => setDragging(false), [])
  const handleChange = useCallback((e) => handleFile(e.target.files?.[0]), [handleFile])
  const open = () => document.getElementById('video-file-input')?.click()

  const submitUrl = useCallback((e) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    onUrlSubmit?.(trimmed)
  }, [onUrlSubmit, url])

  return (
    <div
      className={`upload-zone ${dragging ? 'drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && open()}
      aria-label="Upload or paste a video"
    >
      <input
        id="video-file-input"
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/mpeg,video/ogg,.mp4,.webm,.mov,.mkv,.mpeg,.ogg"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      <div className="upload-inner">
        <div className="upload-icon-wrap">
          <span className="material-icons-round upload-icon">video_library</span>
        </div>
        <p className="upload-title">Drop a video here or <span className="upload-browse">click to browse</span></p>
        <p className="upload-hint">MP4, MOV, WebM, MKV, MPEG · up to 250 MB</p>

        <form className="url-form" onSubmit={submitUrl} onClick={(e) => e.stopPropagation()}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            aria-label="Video URL"
          />
          <button type="submit" className="btn-primary url-submit">Paste URL</button>
        </form>
      </div>
    </div>
  )
}
