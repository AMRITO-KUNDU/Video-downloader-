# YouTubeDownload - YouTube Video Downloader

A fast, simple app to download YouTube videos in your preferred format. Paste a link, select a format, and get your video instantly.

## Features

- Paste a YouTube URL
- Fetches video metadata (title, thumbnail, duration)
- Shows available download formats
- Download in MP4, WebM, MP3, or other available formats
- Clean, minimal UI
- Runs on Render with Docker

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Video extraction: `yt-dlp`
- Deployment: Docker + Render

## Project structure

```
.
├── Dockerfile
├── .dockerignore
├── server.js
├── package.json
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── components/
│       ├── hooks/
│       └── lib/
└── README.md
```

## How it works

1. User pastes a YouTube URL in the input field
2. App calls `/api/video-info` to fetch video metadata (title, thumbnail, available formats)
3. Thumbnail and available formats are displayed
4. User selects a format and clicks download
5. App calls `/api/download` with the selected format
6. Server uses `yt-dlp` to extract and convert the video
7. Video is sent back to the browser for download

## Local development

Install dependencies:

```bash
npm install
npm --prefix frontend install
```

Run locally:

```bash
npm run dev
```

The Express server runs on port `10000` and serves the app at `http://localhost:10000`.

## Production build

```bash
npm run build
npm start
```

## Docker and Render

This app is built for Render.

### Build and run locally

```bash
docker build -t youtubedownload .
docker run -p 10000:10000 youtubedownload
```

### Deploy to Render

1. Connect your GitHub repo
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Set port: `10000`

## API endpoints

### POST /api/video-info
Fetch video metadata (title, thumbnail, available formats)

**Request:**
```json
{ "url": "https://www.youtube.com/watch?v=..." }
```

**Response:**
```json
{
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": "5:30",
  "formats": [
    { "id": "18", "format": "MP4", "quality": "360p" },
    { "id": "22", "format": "MP4", "quality": "720p" }
  ]
}
```

### POST /api/download
Download a video in the selected format

**Request:**
```json
{ "url": "https://www.youtube.com/watch?v=...", "format": "18" }
```

**Response:**
Returns the video file as a binary blob

## Requirements

- Node.js 20+
- `yt-dlp` installed on the server

## License

Respect copyright and platform terms of service when downloading content.

