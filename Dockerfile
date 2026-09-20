FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=3000
EXPOSE 3000

# Seeds the SQLite database (safe to re-run) then starts the server.
CMD ["npm", "start"]
