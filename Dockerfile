# Multi-stage Dockerfile optimized for Google Cloud Run
# Optimizations: minimal image, fast cold starts, proper signal handling

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy source files needed for build
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY drizzle.config.ts ./

COPY client ./client
COPY server ./server
COPY shared ./shared
COPY attached_assets ./attached_assets

# Build frontend (Vite)
RUN npx vite build

# Build backend (esbuild)
RUN npx esbuild server/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outdir=dist

# ============================================
# Stage 3: Production image (minimal)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    # Required for bcrypt
    libc6-compat \
    # Health check utility
    curl \
    # For proper signal handling
    dumb-init

# Create non-root user for security (Cloud Run best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install production dependencies only + drizzle-kit for migrations
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./

# Copy runtime files
COPY shared ./shared

# Create server directory and copy migrations (optional - may not exist)
RUN mkdir -p ./server/migrations

# Copy migrations from builder (they exist there from the COPY server step)
COPY --from=builder /app/server/migrations ./server/migrations

# Create uploads directory with proper permissions
RUN mkdir -p uploads/documents uploads/medical uploads/organizations uploads/patients uploads/staff && \
    chown -R nodejs:nodejs uploads

# Set environment
ENV NODE_ENV=production

# Cloud Run uses PORT environment variable (default 8080)
ENV PORT=8080

# Switch to non-root user
USER nodejs

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080

# Health check for local testing (Cloud Run handles this differently)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Use dumb-init for proper signal handling (SIGTERM for graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

