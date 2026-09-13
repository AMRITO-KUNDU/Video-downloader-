FROM node:20-alpine

# yt-dlp needs Python; ffmpeg is required to merge separate video/audio streams.
RUN apk add --no-cache python3 py3-pip ffmpeg \
  && pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "start"]
