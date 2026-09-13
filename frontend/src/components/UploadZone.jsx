import { useState } from 'react'
import './UploadZone.css'

export default function UploadZone({ onUrlSubmit, loading }) {
  const [url, setUrl] = useState('')
  const submit = (event) => { event.preventDefault(); if (url.trim()) onUrlSubmit(url.trim()) }
  return <div className="upload-zone"><div className="upload-inner">
    <div className="upload-icon-wrap"><span className="material-icons-round upload-icon">smart_display</span></div>
    <p className="upload-title">Paste a YouTube link</p><p className="upload-hint">We’ll find the title, thumbnail, and available qualities for you.</p>
    <form className="url-form" onSubmit={submit}><div className="url-input-wrap"><span className="material-icons-round">link</span><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtube.com/watch?v=..." aria-label="YouTube video URL" disabled={loading} /></div><button className="btn-primary url-submit" type="submit" disabled={loading || !url.trim()}><span className="material-icons-round">search</span>{loading ? 'Reading…' : 'Get video'}</button></form>
    <p className="upload-footnote"><span className="material-icons-round">info</span>Public YouTube videos only</p>
  </div></div>
}
