# Use a lightweight Node 18 image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files first (layer caching)
COPY package*.json ./

# Install dependencies
# IMPORTANT: "uuid" must be in "dependencies" in package.json
RUN npm i uuid@8.3.2
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Create non-root user and logs directory
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs \
  && mkdir -p logs \
  && chown -R nodejs:nodejs .

# Switch to non-root user
USER nodejs

# Environment
ENV NODE_ENV=production

# Expose application port
EXPOSE 3000

# Health check (make sure this route exists in your server)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health-check || exit 1

# Start the app
CMD ["npm", "start"]
