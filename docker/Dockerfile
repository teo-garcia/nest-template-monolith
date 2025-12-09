# ================================
# Build Stage
# ================================
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Set working directory
WORKDIR /app

# Copy package files
# Copying these first allows Docker to cache the dependency layer
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN pnpm db:generate

# Copy source code
COPY . .

# Build the application
# This compiles TypeScript to JavaScript in the /dist directory
RUN pnpm build

# Remove development dependencies to reduce image size
RUN pnpm prune --prod

# ================================
# Production Stage
# ================================
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
# dumb-init ensures signals (SIGTERM, SIGINT) are properly forwarded to Node.js
RUN apk add --no-cache dumb-init

# Create app user and group
# Running as non-root user is a security best practice
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy node_modules from builder
# This includes production dependencies only
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy prisma files for migrations in production
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Copy package.json for version info and scripts
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 3000

# Health check
# This allows Docker and orchestrators to monitor container health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to run the application
# This ensures proper signal handling and zombie process reaping
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]




