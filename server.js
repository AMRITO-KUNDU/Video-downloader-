import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT) || 10000
const frontendDist = path.join(__dirname, 'frontend', 'dist')

app.disable('x-powered-by')
app.use(express.json({ limit: '250mb' }))
app.use(express.urlencoded({ extended: true, limit: '250mb' }))


function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const binaries = ['yt-dlp', 'youtube-dl']

    const tryNext = (index) => {
      const binary = binaries[index]
      if (!binary) {
        reject(new Error('yt-dlp is not installed. Install it to use this feature.'))
        return
      }

      execFile(
        binary,
        ['--dump-json', '--no-warnings', url],
        { maxBuffer: 10 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            tryNext(index + 1)
            return
          }

          try {
            const info = JSON.parse(stdout)
            resolve(info)
          } catch (e) {
            tryNext(index + 1)
          }
        }
      )
    }

    tryNext(0)
  })
}

function downloadWithYtDlp(url, outputDir, format = 'best') {
  return new Promise((resolve, reject) => {
    const binaries = ['yt-dlp', 'youtube-dl']

    const tryNext = (index) => {
      const binary = binaries[index]
      if (!binary) {
        reject(new Error('yt-dlp is not installed on this server.'))
        return
      }

      const formatArg = format === 'best' ? 'bestvideo+bestaudio/best' : format

      execFile(
        binary,
        [
          '-f',
          formatArg,
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

app.post('/api/video-info', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    const { url } = req.body

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        detail: 'No URL provided',
      })
    }

    const info = await getVideoInfo(url)

    const formats = []
    if (info.formats && Array.isArray(info.formats)) {
      const seenIds = new Set()
      info.formats.forEach((fmt) => {
        if (fmt.filesize && !seenIds.has(fmt.format_id)) {
          seenIds.add(fmt.format_id)
          let quality = 'unknown'
          if (fmt.height) quality = `${fmt.height}p`
          else if (fmt.abr) quality = `${fmt.abr}kbps`

          formats.push({
            id: fmt.format_id,
            format: fmt.ext?.toUpperCase() || 'MP4',
            quality,
          })
        }
      })
    }

    const metadata = {
      title: info.title || 'Video',
      thumbnail: info.thumbnail || null,
      duration: info.duration
        ? `${Math.floor(info.duration / 60)}:${String(info.duration % 60).padStart(2, '0')}`
        : null,
      formats: formats.slice(0, 10),
    }

    res.json(metadata)
  } catch (error) {
    console.error('[video-info]', error)
    res.status(500).json({ detail: error.message || 'Failed to fetch video info' })
  }
})

app.post('/api/download', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    const { url, format = 'best' } = req.body

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        detail: 'No video URL provided',
      })
    }

    const outputDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-video-'))

    try {
      await downloadWithYtDlp(url.trim(), outputDir, format)
      const filesInDir = fs.readdirSync(outputDir)
      const downloadFile = filesInDir.find((name) =>
        /\.(mp4|webm|m4a|mkv|mov|avi|mpeg|ogg)$/i.test(name)
      )

      if (!downloadFile) {
        throw new Error('No downloadable video file was produced.')
      }

      const finalPath = path.join(outputDir, downloadFile)
      const fileBuffer = fs.readFileSync(finalPath)
      const ext = path.extname(downloadFile).toLowerCase()
      const mime =
        ext === '.mp4'
          ? 'video/mp4'
          : ext === '.webm'
            ? 'video/webm'
            : ext === '.m4a'
              ? 'audio/mp4'
              : 'application/octet-stream'

      res.setHeader('Content-Type', mime)
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFile}"`)
      return res.status(200).send(fileBuffer)
    } finally {
      fs.rmSync(outputDir, { recursive: true, force: true })
    }
  } catch (error) {
    console.error('[video-download]', error)
    return res.status(500).json({ detail: error.message || 'Video download failed' })
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
