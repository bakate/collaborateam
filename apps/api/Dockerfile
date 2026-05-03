FROM oven/bun:alpine

WORKDIR /app

# Copy root config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy all packages and apps
COPY apps/api ./apps/api
COPY packages ./packages

# Install dependencies
RUN bun install

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["bun", "run", "src/server.js"]
