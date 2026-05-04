# syntax=docker/dockerfile:1

FROM oven/bun:alpine AS base
WORKDIR /app
# Install pnpm globally using bun (npm is not available in the base image)
RUN bun add -g pnpm@10.28.0

# Stage 1: Pruning
# Use turbo to extract only what's necessary for the API
FROM base AS pruner
RUN bun add -g turbo
COPY . .
RUN turbo prune @workspace/api --docker

# Stage 2: Install and link dependencies
FROM base AS builder
WORKDIR /app
# Copy the full pruned source code first
# This ensures pnpm can create valid symbolic links for workspace packages
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Set HUSKY=0 to skip husky install during pnpm install
ENV HUSKY=0

# Install dependencies (now workspace symlinks will be correct)
RUN pnpm install --frozen-lockfile

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunuser
    
ENV NODE_ENV=production

# Copy everything from builder (including correctly linked node_modules)
COPY --from=builder /app .

# Ensure correct permissions
RUN chown -R bunuser:nodejs /app
USER bunuser

# Render injects the PORT environment variable automatically
ENV PORT=3000
EXPOSE $PORT

# Start command
CMD ["bun", "run", "apps/api/src/server.js"]
