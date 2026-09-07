/**
 * Vercel serverless route for video downloads.
 * POST /api/download
 * Supports either a direct URL or a multipart upload.
 */

import { IncomingForm } from 'formidable'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'

export const config = {
  api: {
    bodyParser: false,
  },
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: 250 * 1024 * 1024,
      keepExtensions: true,
    })

    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

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
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Remote media fetch failed with status ${res.status}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const filename = path.basename(new URL(url).pathname) || 'downloaded-video'

  return { buffer, filename, contentType }
}

function downloadWithYtDlp(url, outputDir) {
  return new Promise((resolve, reject) => {
    const candidates = ['yt-dlp', 'youtube-dl']
    const lastError = []

    const tryNext = (index) => {
      const binary = candidates[index]
      if (!binary) {
        reject(new Error('yt-dlp is not installed. Install yt-dlp or provide a direct media URL.'))
        return
      }

      execFile(binary, ['-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4', '--restrict-filenames', '-o', path.join(outputDir, '%(title)s.%(ext)s'), url], (error, stdout, stderr) => {
        if (error) {
          lastError.push(stderr || stdout || error.message)
          tryNext(index + 1)
          return
        }

        resolve({ stdout, stderr })
      })
    }

    tryNext(0)
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' })
  }

  try {
    const contentType = req.headers['content-type'] || ''
    let fields = {}
    let files = {}

    if (contentType.includes('multipart/form-data')) {
      ;({ fields, files } = await parseForm(req))
    } else {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const rawBody = Buffer.concat(chunks).toString('utf8')
      if (rawBody) {
        Object.assign(fields, JSON.parse(rawBody))
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
        // ignore cleanup errors
      }

      res.setHeader('Content-Type', mime)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      return res.status(200).send(buffer)
    }

    if (url) {
      if (isDirectMediaUrl(url)) {
        const { buffer, filename, contentType: remoteType } = await fetchDirectMedia(url)
        res.setHeader('Content-Type', remoteType)
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        return res.status(200).send(buffer)
      }

      const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'videodl-'))
      const result = await downloadWithYtDlp(url, outputDir)
      const filesInDir = fs.readdirSync(outputDir)
      const videoFile = filesInDir.find((name) => /\.(mp4|webm|m4a|mkv|mov|avi|mpeg|ogg)$/i.test(name))

      if (!videoFile) {
        throw new Error('No downloadable video file was produced for the supplied URL.')
      }

      const finalPath = path.join(outputDir, videoFile)
      const fileBuffer = fs.readFileSync(finalPath)
      const ext = path.extname(videoFile).toLowerCase()
      const mime = ext === '.mp4' ? 'video/mp4' : ext === '.webm' ? 'video/webm' : 'application/octet-stream'

      res.setHeader('Content-Type', mime)
      res.setHeader('Content-Disposition', `attachment; filename="${videoFile}"`)

      fs.rmSync(outputDir, { recursive: true, force: true })
      return res.status(200).send(fileBuffer)
    }

    return res.status(400).json({
      detail: 'No video URL or file was supplied. Pass a file or a valid media URL in form field "url".',
    })
  } catch (e) {
    console.error('[video-download]', e)
    return res.status(500).json({ detail: e.message || 'Video processing failed' })
  }
}
