import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT) || 10000
const frontendDist = path.join(__dirname, 'frontend', 'dist')
const MAX_DOWNLOAD_BYTES = 450 * 1024 * 1024
app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))

function isYouTubeUrl(value) {
  try { return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(new URL(value).hostname.toLowerCase()) } catch { return false }
}

function runYtDlp(args, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''; let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk }); child.stderr.on('data', (chunk) => { stderr += chunk })
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('The download took too long. Try a shorter video or lower quality.')) }, timeout)
    child.on('error', (error) => { clearTimeout(timer); reject(error) })
    child.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr.trim() || 'yt-dlp could not process this video.')) })
  })
}

const FORMAT_PRESETS = {
  best: 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b',
  '1080p': 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/bv*[height<=1080]+ba/b[height<=1080]',
  '720p': 'bv*[height<=720][ext=mp4]+ba[ext=m4a]/bv*[height<=720]+ba/b[height<=720]',
  '480p': 'bv*[height<=480][ext=mp4]+ba[ext=m4a]/bv*[height<=480]+ba/b[height<=480]',
  audio: 'ba[ext=m4a]/ba',
}

async function getVideoInfo(url) {
  const { stdout } = await runYtDlp(['--dump-single-json', '--no-playlist', '--no-warnings', url], 45000)
  const info = JSON.parse(stdout)
  const heights = [...new Set((info.formats || []).map((item) => item.height).filter((height) => height >= 144))].sort((a, b) => b - a).filter((height) => [1080, 720, 480, 360].includes(height))
  return { title: info.title || 'YouTube video', thumbnail: info.thumbnail || null, channel: info.uploader || info.channel || null, duration: Number.isFinite(info.duration) ? info.duration : null, formats: [{ id: 'best', label: 'Best quality', detail: 'MP4 · highest available' }, ...heights.map((height) => ({ id: `${height}p`, label: `${height}p`, detail: `MP4 · up to ${height}p` })), { id: 'audio', label: 'Audio only', detail: 'M4A · best available' }] }
}

function safeName(value) { return String(value || 'youtube-video').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim().slice(0, 120) || 'youtube-video' }
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'streamfetch' }))

app.post('/api/video-info', async (req, res) => {
  const url = String(req.body?.url || '').trim()
  if (!isYouTubeUrl(url)) return res.status(400).json({ detail: 'Paste a valid YouTube video URL.' })
  try { res.json(await getVideoInfo(url)) } catch (error) { console.error('[video-info]', error); res.status(502).json({ detail: 'Could not read that video. Check the URL and try again.' }) }
})

app.post('/api/download', async (req, res) => {
  const url = String(req.body?.url || '').trim(); const preset = String(req.body?.format || 'best')
  if (!isYouTubeUrl(url)) return res.status(400).json({ detail: 'Paste a valid YouTube video URL.' })
  if (!FORMAT_PRESETS[preset]) return res.status(400).json({ detail: 'That download format is not available.' })
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'streamfetch-')); const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s')
  const cleanup = () => fs.rmSync(outputDir, { recursive: true, force: true })
  try {
    await runYtDlp(['--no-playlist', '--no-warnings', '--restrict-filenames', '--max-filesize', `${MAX_DOWNLOAD_BYTES}`, '-f', FORMAT_PRESETS[preset], '--merge-output-format', 'mp4', '-o', outputTemplate, url], 300000)
    const files = fs.readdirSync(outputDir).filter((name) => /\.(mp4|webm|m4a|mkv|mov)$/i.test(name))
    if (!files.length) throw new Error('No media file was produced.')
    const fileName = files[0]; const filePath = path.join(outputDir, fileName); const stat = fs.statSync(filePath)
    if (stat.size > MAX_DOWNLOAD_BYTES) throw new Error('This video is too large for the free server tier.')
    const ext = path.extname(fileName).toLowerCase()
    res.setHeader('Content-Type', ext === '.m4a' ? 'audio/mp4' : ext === '.webm' ? 'video/webm' : 'video/mp4')
    res.setHeader('Content-Disposition', `attachment; filename="${safeName(path.basename(fileName, ext))}${ext}"`)
    res.sendFile(filePath)
  } catch (error) { console.error('[download]', error); if (!res.headersSent) res.status(502).json({ detail: error.message || 'Download failed.' }) }
  finally { if (res.headersSent) { res.once('finish', cleanup); res.once('close', cleanup) } else cleanup() }
})

if (fs.existsSync(frontendDist)) { app.use(express.static(frontendDist)); app.get('*', (req, res, next) => req.path.startsWith('/api') ? next() : res.sendFile(path.join(frontendDist, 'index.html'))) }
else app.get('*', (_req, res) => res.json({ ok: true, message: 'Frontend build is not available yet.' }))
app.listen(port, '0.0.0.0', () => console.log(`StreamFetch running on port ${port}`))
