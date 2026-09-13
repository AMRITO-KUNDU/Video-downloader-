# StreamFetch

A small, Render-friendly YouTube downloader with the same calm workspace UI as the Image Background Remover project.

## What it includes

- React + Vite frontend with light/dark mode, responsive layout, URL validation, metadata preview, quality cards, and download state.
- Express API with `yt-dlp` metadata extraction and temporary-file downloads.
- MP4 quality presets: best available, 1080p, 720p, 480p, plus M4A audio-only.
- Docker image includes both `yt-dlp` and `ffmpeg`, which are required for merged video/audio streams.
- 450 MB download cap and automatic temporary-file cleanup for Render’s free tier.

## Run locally

```bash
npm install
npm --prefix frontend install
npm run build
npm start
```

Open `http://localhost:10000`.

## Docker / Render

The included Dockerfile installs Node 20, Python, `yt-dlp`, and `ffmpeg`, builds the frontend, and starts the Express server on Render’s `$PORT` (default `10000`).

```bash
docker build -t streamfetch .
docker run --rm -p 10000:10000 streamfetch
```

For Render, create a Web Service using the Docker runtime. No separate build or start command is needed; the Dockerfile handles both. Render should discover the service on port `10000` through the `PORT` environment variable.

## API

`POST /api/video-info`

```json
{ "url": "https://www.youtube.com/watch?v=..." }
```

`POST /api/download`

```json
{ "url": "https://www.youtube.com/watch?v=...", "format": "720p" }
```

Allowed formats are `best`, `1080p`, `720p`, `480p`, and `audio`.

Use this only for content you have permission to download and in accordance with YouTube’s terms.
