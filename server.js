import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'
import { IncomingForm } from 'formidable'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT) || 10000
const frontendDist = path.join(__dirname, 'frontend', 'dist')

app.disable('x-powered-by')
app.use(express.json({ limit: '250mb' }))
app.use(express.urlencoded({ extended: true, limit: '250mb' }))

function isDirectMediaUrl(value) {
  if (!value || typeof value !== 'string') return false

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && /\.(mp4|m4v|mov|webm|mkv|avi|mpeg|mpg|ogg|m4a|aac|wav)(\?.*)?$/i.test(url.pathname)
  } catch {
    return false
  }
}

async function fetchDirectMedia(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Remote media fetch failed with status ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const filename = path.basename(new URL(url).pathname) || 'downloaded-video'

  return { buffer, filename, contentType }
}

function downloadWithYtDlp(url, outputDir) {
  return new Promise((resolve, reject) => {
    const binaries = ['yt-dlp', 'youtube-dl']

    const tryNext = (index) => {
      const binary = binaries[index]
      if (!binary) {
        reject(new Error('yt-dlp is not installed on this server. Install it or provide a direct media URL.'))
        return
      }

      execFile(
        binary,
        [
          '-f',
          'bestvideo+bestaudio/best',
          '--merge-output-format',
          'mp4',
          '--restrict-filenames',
          '-o',
          path.join(outputDir, '%(title)s.%(ext)s'),
          url,
        ],
        (error, stdout, stderr) => {
          if (error) {
            tryNext(index + 1)
            return
          }

          resolve({ stdout, stderr })
        }
      )
    }

    tryNext(0)
  })
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: 250 * 1024 * 1024,
      keepExtensions: true,
      multiples: false,
    })

    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

app.post('/api/download', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    const contentType = req.headers['content-type'] || ''
    let fields = {}
    let files = {}

    if (contentType.includes('multipart/form-data')) {
      ;({ fields, files } = await parseMultipart(req))
    } else {
      const body = await new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => {
          data += chunk
        })
        req.on('end', () => resolve(data))
        req.on('error', reject)
      })

      if (body) {
        try {
          Object.assign(fields, JSON.parse(body))
        } catch {
          // ignore malformed JSON
        }
      }
    }

    const url = fields.url || fields.videoUrl || fields.link
    const fileEntry = files.file || files.video || files.media
    const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry

    if (file?.filepath) {
      const buffer = fs.readFileSync(file.filepath)
      const mime = file.mimetype || 'application/octet-stream'
      const filename = file.originalFilename || 'uploaded-video.mp4'

      try {
        fs.unlinkSync(file.filepath)
      } catch {
        // ignore cleanup failures
      }

      res.setHeader('Content-Type', mime)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      return res.status(200).send(buffer)
    }

    if (url) {
      const mediaUrl = String(url).trim()

      if (isDirectMediaUrl(mediaUrl)) {
        const { buffer, filename, contentType: remoteType } = await fetchDirectMedia(mediaUrl)
        res.setHeader('Content-Type', remoteType)
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        return res.status(200).send(buffer)
      }

      const outputDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-video-'))
      try {
        await downloadWithYtDlp(mediaUrl, outputDir)
        const filesInDir = fs.readdirSync(outputDir)
        const downloadFile = filesInDir.find((name) => /\.(mp4|webm|m4a|mkv|mov|avi|mpeg|ogg)$/i.test(name))

        if (!downloadFile) {
          throw new Error('No downloadable video file was produced for the supplied URL.')
        }

        const finalPath = path.join(outputDir, downloadFile)
        const fileBuffer = fs.readFileSync(finalPath)
        const ext = path.extname(downloadFile).toLowerCase()
        const mime = ext === '.mp4' ? 'video/mp4' : ext === '.webm' ? 'video/webm' : 'application/octet-stream'

        res.setHeader('Content-Type', mime)
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFile}"`)
        return res.status(200).send(fileBuffer)
      } finally {
        fs.rmSync(outputDir, { recursive: true, force: true })
      }
    }

    return res.status(400).json({
      detail: 'No video URL or file was supplied. Pass a file or valid media URL in the form field "url".',
    })
  } catch (error) {
    console.error('[video-download]', error)
    return res.status(500).json({ detail: error.message || 'Video processing failed' })
  }
})

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
} else {
  app.get('*', (req, res) => {
    res.json({
      ok: true,
      message: 'App is starting. Frontend build has not been generated yet.',
    })
  })
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Video downloader running on http://0.0.0.0:${port}`)
})
