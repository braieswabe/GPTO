#!/bin/bash
# Script to run the audits table migration using psql with DATABASE_URL

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL_UNPOOLED is set (preferred for migrations)
if [ -z "$DATABASE_URL_UNPOOLED" ] && [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL or DATABASE_URL_UNPOOLED not found"
  exit 1
fi

# Use UNPOOLED if available, otherwise use regular DATABASE_URL
DB_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

echo "🔄 Running audits table migration..."
echo ""

# Run the SQL file using psql with the connection string
psql "$DB_URL" -f create_audits_table.sql

echo ""
echo "✅ Migration completed!"
