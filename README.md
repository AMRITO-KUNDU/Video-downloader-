# StreamFetch — Video Downloader

A lightweight Vercel + React app for downloading video files from direct links or local uploads. The project keeps the same monorepo layout as the original template, but swaps the image-processing backend for a downloader flow.

## Stack

- Frontend: React + Vite
- Backend: Vercel serverless API route
- Storage: none required for direct links
- Optional extraction: `yt-dlp` for non-direct URLs

## Project structure

```text
.
├── api/
│   └── download.js            # Vercel serverless route for video downloads
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── components/
│       ├── hooks/
│       └── lib/
├── package.json
├── vercel.json
└── README.md
```

## Features

- Paste a video URL and download it
- Drag and drop a local video file
- Compare original vs result before downloading
- Quick format selection for MP4 / WebM / audio export
- Keeps the same UI structure as the original template for an easy visual match

## Local development

1. Install dependencies:

```bash
npm install
cd frontend && npm install
```

1. Start the app:

```bash
npm run dev
```

The root script runs the frontend dev server through Vercel-style development.

## Backend behavior

The route in `api/download.js` supports both:

- Direct media links such as `https://example.com/video.mp4`
- Uploaded local video files
- Optional extraction with `yt-dlp` for public video URLs when the binary is available

If the supplied link is already a direct video file, the route streams that file back to the browser.

## Prerequisites for URL extraction

If you want broader URL support for streaming sites or share links, install `yt-dlp` on the machine or deployment environment:

```bash
pip install yt-dlp
```

Or on macOS / Linux:

```bash
brew install yt-dlp
```

The app will still work for direct media URLs without any extra setup.

## Vercel deployment

1. Deploy the project to Vercel.
1. Set the root directory to `frontend` if you are using the repo as a front-end project in Vercel.
1. Keep the serverless route in `api/download.js` at the project root.

## Notes

- This version is tuned for clean UI parity with the original remover template.
- For production streaming sites, you may need a stronger backend or a server with `yt-dlp` available in the environment.
- Always respect copyright and platform terms of service when downloading media.
