#!/bin/bash
# Script to run database migrations in production
# Usage: ./scripts/run-migration-production.sh

set -e

echo "🚀 Running database migrations in production..."
echo ""

# Check for required environment variables
if [ -z "$DATABASE_URL_UNPOOLED" ] && [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ] && [ -z "$NEON_DATABASE_URL" ]; then
  echo "❌ Error: Database connection string not found"
  echo ""
  echo "Please set one of these environment variables:"
  echo "  - DATABASE_URL_UNPOOLED (recommended for migrations)"
  echo "  - DATABASE_URL"
  echo "  - POSTGRES_URL"
  echo "  - NEON_DATABASE_URL"
  echo ""
  exit 1
fi

# Run migrations
cd packages/database
pnpm migrate

echo ""
echo "✅ Migrations completed successfully!"
