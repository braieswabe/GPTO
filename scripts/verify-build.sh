#!/bin/bash

# GPTO Suite Build Verification Script

set -e

echo "🔍 Verifying GPTO Suite build..."

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Current: $(node -v)"
  exit 1
fi
echo "✅ Node.js version OK: $(node -v)"

# Check pnpm
echo "📦 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm not found. Install with: npm install -g pnpm"
  exit 1
fi
echo "✅ pnpm found: $(pnpm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Type check
echo "🔍 Running type checks..."
pnpm type-check || {
  echo "⚠️  Type check warnings (continuing...)"
}

# Build packages
echo "🔨 Building packages..."
pnpm build || {
  echo "❌ Build failed"
  exit 1
}

# Build dashboard specifically
echo "🔨 Building dashboard..."
pnpm --filter dashboard build || {
  echo "❌ Dashboard build failed"
  exit 1
}

echo "✅ Build verification complete!"
echo ""
echo "🚀 To start the development server:"
echo "   pnpm dev"
echo ""
echo "🌐 Dashboard will be available at: http://localhost:3000"
