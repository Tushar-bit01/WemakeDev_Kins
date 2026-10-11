FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# 1. Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# 2. Copy the source code
COPY . .

# 3. Create the logs directory so your logger doesn't fail on startup
RUN mkdir -p logs

# 4. Expose the port (matches server.js default)
EXPOSE 3000

# 5. Use exec form for CMD so PID 1 forwards SIGTERM to server.js for graceful shutdown
CMD ["node", "server.js"]