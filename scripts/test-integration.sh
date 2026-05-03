#!/bin/bash

# scripts/test-integration.sh
# Orchestrates API integration tests with a dedicated Docker container.

set -e

# Configuration
COMPOSE_FILE="apps/api/docker-compose.test.yml"
TEST_ENV="apps/api/.env.test"

echo "🚀 Starting test database..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker exec collaborateam-test-db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Database is ready!"

# Run migrations/seed if needed (assuming we have a script for this)
# echo "🌱 Seeding test database..."
# DATABASE_URL='postgres://postgres:postgres_password@localhost:5433/collaborateam_test' bun run packages/infrastructure/src/db/seed.js

echo "🧪 Running integration tests..."
./apps/api/node_modules/.bin/vitest apps/api/src/integration.spec.js --run

echo "🧹 Cleaning up..."
docker-compose -f $COMPOSE_FILE down -v

echo "✨ All tests passed (or failed gracefully)!"
