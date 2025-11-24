# Lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install only production dependencies
# NOTE: make sure "uuid" is in "dependencies" in package.json
RUN npm ci --omit=dev

# Copy the rest of the application source
COPY . .

# Create non-root user and logs directory
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs \
  && mkdir -p logs \
  && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Environment
ENV NODE_ENV=production

# Expose app port
EXPOSE 3000

# Health check (make sure /health-check route exists in your app)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health-check || exit 1

# Start application
CMD ["npm", "start"]
