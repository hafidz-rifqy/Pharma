FROM node:20-alpine

# Install build tools for native sqlite3 bindings
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy backend dependency declarations
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm install --production

# Copy all source files
COPY . .

# Expose port (default 3000)
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["node", "backend/server.js"]
