# syntax=docker/dockerfile:1

FROM oven/bun:alpine AS base
WORKDIR /app
# Install pnpm globally to ensure compatibility with the lockfile
RUN bun add -g pnpm@10.28.0

# Stage 1: Pruning
# Use turbo to extract only what's necessary for the API
FROM base AS pruner
RUN bun add -g turbo
COPY . .
RUN turbo prune @workspace/api --docker

# Stage 2: Install dependencies
FROM base AS installer
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Use pnpm for installation because the lockfile is in pnpm v10 format
RUN pnpm install --frozen-lockfile

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunuser
    
ENV NODE_ENV=production

# Copy pruned files and node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/node_modules ./node_modules

# Ensure correct permissions
RUN chown -R bunuser:nodejs /app
USER bunuser

# Render injects the PORT environment variable automatically
ENV PORT=3000
EXPOSE $PORT

# Start command
CMD ["bun", "run", "apps/api/src/server.js"]
