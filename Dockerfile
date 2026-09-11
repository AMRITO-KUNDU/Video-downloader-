FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "start"]
